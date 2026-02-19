import fs from 'fs';
import { FILE_PATHS } from '../config/constants.js';

/**
 * Loads channels from JSON file
 * @returns {Array} Array of channel objects
 */
export function loadChannels() {
  try {
    if (fs.existsSync(FILE_PATHS.CHANNELS)) {
      const data = fs.readFileSync(FILE_PATHS.CHANNELS, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading channels:', error.message);
  }
  return [];
}

/**
 * Saves channels to JSON file
 * @param {Array} channels - Array of channel objects
 */
export function saveChannels(channels) {
  try {
    fs.writeFileSync(
      FILE_PATHS.CHANNELS,
      JSON.stringify(channels, null, 2),
      'utf-8'
    );
  } catch (error) {
    console.error('Error saving channels:', error.message);
    throw error;
  }
}

/**
 * Loads videos from JSON file
 * @returns {Array} Array of video objects
 */
export function loadVideos() {
  try {
    if (fs.existsSync(FILE_PATHS.VIDEOS)) {
      const data = fs.readFileSync(FILE_PATHS.VIDEOS, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading videos:', error.message);
  }
  return [];
}

/**
 * Saves videos to JSON file
 * @param {Array} videos - Array of video objects
 */
export function saveVideos(videos) {
  try {
    fs.writeFileSync(
      FILE_PATHS.VIDEOS,
      JSON.stringify(videos, null, 2),
      'utf-8'
    );
  } catch (error) {
    console.error('Error saving videos:', error.message);
    throw error;
  }
}

/**
 * Adds a channel to the channels file (with deduplication)
 * @param {Object} channel - Channel object to add
 * @returns {boolean} True if added, false if already exists
 */
export function addChannel(channel) {
  const channels = loadChannels();

  if (channels.find(c => c.id === channel.id)) {
    return false;
  }

  channels.push(channel);
  saveChannels(channels);
  return true;
}

/**
 * Removes a channel by ID
 * @param {string} channelId - Channel ID to remove
 * @returns {boolean} True if removed, false if not found
 */
export function removeChannel(channelId) {
  const channels = loadChannels();
  const initialLength = channels.length;
  const filtered = channels.filter(c => c.id !== channelId);

  if (filtered.length === initialLength) {
    return false;
  }

  saveChannels(filtered);
  return true;
}
