import axios from 'axios';
import { getYouTubeApiKey } from '../config/env.js';
import { YOUTUBE_API_BASE } from '../config/constants.js';

const API_KEY = getYouTubeApiKey();

/**
 * Retry wrapper for API calls with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise} Result of the function
 */
async function withRetry(fn, maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on 4xx errors (client errors)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt - 1) * 1000;
        console.log(`   ⚠️  Retry ${attempt}/${maxRetries} after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Fetches channel information by handle
 * @param {string} handle - Channel handle (e.g., @channelname)
 * @returns {Promise<Object|null>} Channel data or null if not found
 */
export async function fetchChannelByHandle(handle) {
  try {
    // Try exact handle lookup first (most accurate)
    const response = await withRetry(() =>
      axios.get(`${YOUTUBE_API_BASE}/channels`, {
        params: {
          part: 'snippet',
          forHandle: handle,
          key: API_KEY,
        },
      })
    );

    if (response.data.items && response.data.items.length > 0) {
      const item = response.data.items[0];
      return {
        id: item.id,
        title: item.snippet.title,
        handle: handle,
        thumbnail: item.snippet.thumbnails?.default?.url,
      };
    }

    // Fallback to search if exact match not found
    console.log('   (Exact match not found, trying search API...)');
    const searchResponse = await withRetry(() =>
      axios.get(`${YOUTUBE_API_BASE}/search`, {
        params: {
          part: 'snippet',
          q: handle,
          type: 'channel',
          key: API_KEY,
          maxResults: 1,
        },
      })
    );

    if (searchResponse.data.items && searchResponse.data.items.length > 0) {
      const item = searchResponse.data.items[0];
      return {
        id: item.id.channelId,
        title: item.snippet.title || item.snippet.channelTitle,
        handle: handle,
        thumbnail: item.snippet.thumbnails?.default?.url,
      };
    }

    return null;
  } catch (error) {
    console.error('API Error:', error.response?.data?.error?.message || error.message);
    throw error;
  }
}

/**
 * Gets the uploads playlist ID for a channel
 * @param {string} channelId - YouTube channel ID
 * @returns {Promise<string>} Uploads playlist ID
 */
export async function getChannelUploadsPlaylist(channelId) {
  const response = await withRetry(() =>
    axios.get(`${YOUTUBE_API_BASE}/channels`, {
      params: {
        part: 'contentDetails',
        id: channelId,
        key: API_KEY,
      },
    })
  );

  if (!response.data.items || response.data.items.length === 0) {
    throw new Error('Channel not found');
  }

  return response.data.items[0].contentDetails.relatedPlaylists.uploads;
}

/**
 * Fetches videos from a playlist
 * @param {string} playlistId - Playlist ID
 * @param {number} maxResults - Maximum results to fetch
 * @returns {Promise<Array>} Array of playlist items
 */
export async function fetchPlaylistItems(playlistId, maxResults = 20) {
  const response = await withRetry(() =>
    axios.get(`${YOUTUBE_API_BASE}/playlistItems`, {
      params: {
        part: 'snippet',
        playlistId: playlistId,
        maxResults: maxResults,
        key: API_KEY,
      },
    })
  );

  return response.data.items || [];
}

/**
 * Creates user-friendly error message from API error
 * @param {Error} error - Error object
 * @returns {string} User-friendly error message
 */
export function getApiErrorMessage(error) {
  if (error.response?.status === 403) {
    return 'API quota exceeded. Please try again later or check your API key.';
  }

  if (error.response?.status === 404) {
    return 'Channel not found on YouTube.';
  }

  if (error.response?.status === 400) {
    return 'Invalid request. Please check the channel URL or handle.';
  }

  if (error.response?.data?.error?.message) {
    return error.response.data.error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}
