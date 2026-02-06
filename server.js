import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { exec, execSync } from 'child_process';
import open from 'open';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

// Paths
const CHANNELS_FILE = path.join(__dirname, 'src/data/channels.json');
const YOUTUBE_API_KEY = process.env.VITE_YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY;

// 1. Get Channels
app.get('/api/channels', (req, res) => {
  if (fs.existsSync(CHANNELS_FILE)) {
    const data = fs.readFileSync(CHANNELS_FILE, 'utf-8');
    res.json(JSON.parse(data));
  } else {
    res.json([]);
  }
});

// 2. Add Channel
app.post('/api/channels', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  // Decode URL (for Korean handles)
  // e.g. @%EB%9D%BC... -> @라핀_AI_자동화
  const decodedUrl = decodeURIComponent(url);

  // Parse Handle from URL
  let handle = '';
  if (decodedUrl.includes('@')) {
    handle = '@' + decodedUrl.split('@')[1].split('/')[0].split('?')[0];
  } else {
    handle = decodedUrl; // Fallback if user just sends handle
  }

  console.log(`Processing Handle: ${handle}`); // Log for debugging

  console.log(`Processing Handle: ${handle}`);

  try {
    // 1. Try 'forHandle' Lookup (Most Accurate)
    let response = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
      params: {
        part: 'snippet',
        forHandle: handle,
        key: YOUTUBE_API_KEY
      }
    });

    // 2. Fallback to Search if forHandle fails (sometimes API requires exact match without @ or vice versa)
    if (!response.data.items || response.data.items.length === 0) {
       console.log('forHandle lookup failed, retrying with Search...');
       const query = handle; 
       response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          part: 'snippet',
          q: query,
          type: 'channel',
          key: YOUTUBE_API_KEY,
          maxResults: 1
        }
      });
    }

    if (response.data.items && response.data.items.length > 0) {
      const item = response.data.items[0];
      // Search API returns 'id.channelId', Channels API returns 'id' directly
      const channelId = item.id?.channelId || item.id; 
      
      const newChannel = {
        id: channelId,
        title: item.snippet.title || item.snippet.channelTitle,
        handle: handle,
        thumbnail: item.snippet.thumbnails?.default?.url
      };

      // Save to file
      let channels = [];
      if (fs.existsSync(CHANNELS_FILE)) {
        channels = JSON.parse(fs.readFileSync(CHANNELS_FILE, 'utf-8'));
      }
      
      if (!channels.find(c => c.id === newChannel.id)) {
        channels.push(newChannel);
        fs.writeFileSync(CHANNELS_FILE, JSON.stringify(channels, null, 2));
        res.json(newChannel);
      } else {
        res.status(409).json({ error: 'Channel already exists' });
      }

    } else {
      res.status(404).json({ error: 'Channel not found on YouTube' });
    }
  } catch (error) {
    console.error(error);
    const status = error.response?.status || 500;
    
    // Mock Fallback for 403 (Demo)
    if(status === 403){
         const mockChannel = {
            id: `mock-${Date.now()}`,
            title: `Mock Channel (${handle})`,
            handle: handle,
            thumbnail: ''
         };
         let channels = [];
         if (fs.existsSync(CHANNELS_FILE)) {
            channels = JSON.parse(fs.readFileSync(CHANNELS_FILE, 'utf-8'));
         }
         channels.push(mockChannel);
         fs.writeFileSync(CHANNELS_FILE, JSON.stringify(channels, null, 2));
         return res.json(mockChannel);
    }
    res.status(status).json({ error: error.message });
  }
});

// 3. Delete Channel
app.delete('/api/channels/:id', (req, res) => {
  const { id } = req.params;
  if (fs.existsSync(CHANNELS_FILE)) {
    let channels = JSON.parse(fs.readFileSync(CHANNELS_FILE, 'utf-8'));
    channels = channels.filter(c => c.id !== id);
    fs.writeFileSync(CHANNELS_FILE, JSON.stringify(channels, null, 2));
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

// 4. Trigger Fetch Script
app.post('/api/fetch', (req, res) => {
  console.log('🚀 Triggering Fetch Video Script...');
  exec('node scripts/fetch_videos.js', (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return res.status(500).json({ error: 'Fetch failed', details: stderr });
    }
    console.log(`stdout: ${stdout}`);
    res.json({ success: true, message: 'Fetch completed' });
  });
});

// 5. Deploy: Fetch + Commit + Push
app.post('/api/deploy', async (req, res) => {
  console.log('🚀 Starting Deployment: Fetch → Commit → Push');

  const execOptions = {
    cwd: __dirname,
    encoding: 'utf-8',
    maxBuffer: 50 * 1024 * 1024 // 50MB buffer to handle large outputs
  };

  let deployLog = [];

  try {
    // Step 1: Fetch videos (continue even if this fails due to quota)
    deployLog.push('Step 1: Fetching videos...');
    console.log('Step 1: Fetching videos...');

    try {
      const fetchOutput = execSync('node scripts/fetch_videos.js', execOptions);
      console.log('✅ Videos fetched');
      deployLog.push('✅ Videos fetched successfully');
    } catch (fetchError) {
      console.log('⚠️ Fetch failed (continuing anyway):', fetchError.message);
      deployLog.push('⚠️ Video fetch failed, but continuing with existing data');
    }

    // Step 2: Check if there are changes in video/channel data
    deployLog.push('Step 2: Checking for changes...');
    console.log('Step 2: Checking for changes...');

    let hasChanges = false;
    try {
      // Check only the files we care about
      const statusOutput = execSync('git status --porcelain src/data/videos.json src/data/channels.json', execOptions);
      hasChanges = statusOutput.trim().length > 0;
      console.log('Git status for data files:', statusOutput.toString());
      deployLog.push(`Changes in data files: ${hasChanges ? 'Yes' : 'No'}`);
    } catch (statusError) {
      console.error('Git status error:', statusError.message);
      throw new Error('Failed to check git status');
    }

    if (!hasChanges) {
      console.log('⚠️ No changes in videos.json or channels.json');
      deployLog.push('⚠️ No changes to deploy (data files unchanged)');
      return res.json({
        success: true,
        message: 'No changes to deploy - video and channel data unchanged',
        log: deployLog
      });
    }

    // Step 3: Git add (only specific files)
    deployLog.push('Step 3: Adding files to git...');
    console.log('Step 3: Git add...');
    execSync('git add src/data/videos.json src/data/channels.json', execOptions);
    deployLog.push('✅ Files staged');

    // Step 4: Git commit
    deployLog.push('Step 4: Committing changes...');
    console.log('Step 4: Git commit...');
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const commitMsg = `Auto-update content: ${timestamp}`;

    try {
      const commitOutput = execSync(`git commit -m "${commitMsg}"`, execOptions);
      console.log('✅ Committed:', commitOutput.toString());
      deployLog.push(`✅ Committed: ${commitMsg}`);
    } catch (commitError) {
      const errorMsg = commitError.message + (commitError.stderr?.toString() || '') + (commitError.stdout?.toString() || '');

      // Check various "nothing to commit" messages
      if (errorMsg.includes('nothing to commit') ||
          errorMsg.includes('nothing added to commit') ||
          errorMsg.includes('no changes added to commit')) {
        console.log('⚠️ Nothing to commit (files unchanged)');
        deployLog.push('⚠️ No actual changes in files (already up to date)');
        return res.json({
          success: true,
          message: 'No changes to deploy - files are already up to date',
          log: deployLog
        });
      }

      console.error('Commit error details:', errorMsg);
      throw commitError;
    }

    // Step 5: Git push
    deployLog.push('Step 5: Pushing to GitHub...');
    console.log('Step 5: Git push...');
    const pushOutput = execSync('git push', execOptions);

    console.log('✅ Deployed to GitHub');
    console.log(pushOutput.toString());
    deployLog.push('✅ Successfully pushed to GitHub');

    res.json({
      success: true,
      message: 'Deployed successfully to GitHub!',
      output: pushOutput.toString(),
      log: deployLog
    });

  } catch (error) {
    console.error('❌ Deployment error:', error.message);
    console.error('Error details:', error);
    deployLog.push(`❌ Error: ${error.message}`);

    res.status(500).json({
      error: 'Deployment failed',
      details: error.message,
      stderr: error.stderr?.toString() || error.stdout?.toString() || '',
      log: deployLog
    });
  }
});

app.listen(PORT, () => {
  console.log(`API Server running at http://localhost:${PORT}`);
});
