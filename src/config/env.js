import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Validates and retrieves the YouTube API key
 * @returns {string} YouTube API key
 * @throws {Error} If API key is not found
 */
export function getYouTubeApiKey() {
  const apiKey = process.env.VITE_YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    throw new Error(
      'YouTube API Key not found!\n' +
      'Please add VITE_YOUTUBE_API_KEY=your_key_here to your .env file'
    );
  }

  return apiKey;
}

/**
 * Validates all required environment variables
 * @throws {Error} If any required variables are missing
 */
export function validateEnvironment() {
  const errors = [];

  if (!process.env.VITE_YOUTUBE_API_KEY && !process.env.YOUTUBE_API_KEY) {
    errors.push('VITE_YOUTUBE_API_KEY or YOUTUBE_API_KEY is required');
  }

  if (errors.length > 0) {
    throw new Error(
      'Environment validation failed:\n' +
      errors.map(e => `  - ${e}`).join('\n') +
      '\n\nPlease check your .env file'
    );
  }
}

/**
 * Gets environment with debug flag
 * @returns {boolean}
 */
export function isDebugMode() {
  return process.env.DEBUG === 'true';
}
