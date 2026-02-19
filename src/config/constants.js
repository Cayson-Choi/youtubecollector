import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Server Configuration
export const PORT = parseInt(process.env.PORT || '3002');
export const VITE_PORT = parseInt(process.env.VITE_PORT || '5176');

// CORS Configuration
const defaultOrigins = [
  'http://localhost:5176',
  'http://localhost:5173',
  'http://127.0.0.1:5176',
  'http://127.0.0.1:5173'
];

export const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : defaultOrigins;

// File Paths
const projectRoot = path.resolve(__dirname, '../..');
export const FILE_PATHS = {
  CHANNELS: path.join(projectRoot, 'src/data/channels.json'),
  VIDEOS: path.join(projectRoot, 'src/data/videos.json'),
  CATEGORIES: path.join(projectRoot, 'src/data/categories.js'),
};

// API Configuration
export const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

// Fetch Configuration
export const DEFAULT_DAYS = 7;
export const MAX_RESULTS = 20;
export const API_DELAY_MS = 200;

// Git Configuration
export const GIT_EXEC_OPTIONS = {
  encoding: 'utf-8',
  maxBuffer: 50 * 1024 * 1024, // 50MB buffer
};
