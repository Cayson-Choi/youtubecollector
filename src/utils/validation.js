/**
 * Validates YouTube URL or handle format
 * @param {string} input - URL or handle to validate
 * @returns {boolean} True if valid
 */
export function validateYouTubeUrl(input) {
  if (!input || typeof input !== 'string') {
    return false;
  }

  const trimmed = input.trim();

  // Allow direct handles like @channelname
  if (trimmed.startsWith('@')) {
    return /^@[\w가-힣_-]+$/.test(trimmed);
  }

  // Allow YouTube URLs
  const urlPattern = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/;
  return urlPattern.test(trimmed);
}

/**
 * Sanitizes user input to prevent injection attacks
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove dangerous characters for shell commands
  // Allow: alphanumeric, @, -, _, /, :, ., Korean characters
  return input.replace(/[;&|`$(){}[\]<>\\'"]/g, '');
}

/**
 * Validates and sanitizes the 'days' parameter
 * @param {number|string} days - Number of days
 * @returns {number} Validated days (1-365)
 */
export function validateDays(days) {
  const parsed = parseInt(days);

  if (isNaN(parsed) || parsed < 1 || parsed > 365) {
    throw new Error('Days must be a number between 1 and 365');
  }

  return parsed;
}

/**
 * Validates channel ID format
 * @param {string} channelId - Channel ID to validate
 * @returns {boolean} True if valid
 */
export function validateChannelId(channelId) {
  if (!channelId || typeof channelId !== 'string') {
    return false;
  }

  // YouTube channel IDs are 24 characters starting with UC
  // Also allow mock IDs for testing
  return /^(UC[\w-]{22}|mock-\d+)$/.test(channelId);
}

/**
 * Extracts handle from URL or returns sanitized handle
 * @param {string} input - URL or handle
 * @returns {string} Extracted handle
 */
export function extractHandle(input) {
  const decoded = decodeURIComponent(input.trim());

  let handle = '';
  if (decoded.includes('@')) {
    // Extract from URL: https://youtube.com/@handle/... -> @handle
    handle = '@' + decoded.split('@')[1].split('/')[0].split('?')[0];
  } else {
    handle = decoded;
  }

  // Ensure it starts with @
  if (!handle.startsWith('@')) {
    handle = '@' + handle;
  }

  return sanitizeInput(handle);
}
