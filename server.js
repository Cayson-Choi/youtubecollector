import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { execFile, execSync } from 'child_process';
import { promisify } from 'util';

// Import utilities
import { PORT, ALLOWED_ORIGINS, GIT_EXEC_OPTIONS } from './src/config/constants.js';
import { validateEnvironment } from './src/config/env.js';
import { validateYouTubeUrl, validateDays, extractHandle } from './src/utils/validation.js';
import { loadChannels, saveChannels, addChannel, removeChannel } from './src/utils/fileUtils.js';
import { fetchChannelByHandle, getApiErrorMessage } from './src/utils/api.js';

// Validate environment on startup
try {
  validateEnvironment();
} catch (error) {
  console.error('❌ Environment validation failed:');
  console.error(error.message);
  process.exit(1);
}

const app = express();
const execFileAsync = promisify(execFile);

// CORS configuration with allowed origins
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    if (ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
app.use(bodyParser.json());

// 1. Get Channels
app.get('/api/channels', (req, res) => {
  try {
    const channels = loadChannels();
    res.json(channels);
  } catch (error) {
    console.error('Error loading channels:', error);
    res.status(500).json({ error: 'Failed to load channels' });
  }
});

// 2. Add Channel
app.post('/api/channels', async (req, res) => {
  const { url } = req.body;

  // Validate input
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  if (!validateYouTubeUrl(url)) {
    return res.status(400).json({ error: 'Invalid YouTube URL or handle format' });
  }

  const handle = extractHandle(url);
  console.log(`Processing Handle: ${handle}`);

  try {
    // Fetch channel data using shared API utility
    const channelData = await fetchChannelByHandle(handle);

    if (!channelData) {
      return res.status(404).json({ error: 'Channel not found on YouTube' });
    }

    // Add channel to file (with deduplication)
    const added = addChannel(channelData);

    if (!added) {
      return res.status(409).json({ error: 'Channel already exists' });
    }

    res.json(channelData);

  } catch (error) {
    console.error('Error adding channel:', error.message);

    const status = error.response?.status || 500;

    // Mock Fallback for 403 (Demo/Development)
    if (status === 403 && process.env.NODE_ENV !== 'production') {
      console.log('⚠️  Using mock channel (quota exceeded)');
      const mockChannel = {
        id: `mock-${Date.now()}`,
        title: `Mock Channel (${handle})`,
        handle: handle,
        thumbnail: '',
      };

      addChannel(mockChannel);
      return res.json(mockChannel);
    }

    // Return user-friendly error message
    const errorMessage = getApiErrorMessage(error);
    res.status(status).json({ error: errorMessage });
  }
});

// 3. Delete Channel
app.delete('/api/channels/:id', (req, res) => {
  const { id } = req.params;

  try {
    const removed = removeChannel(id);

    if (!removed) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error removing channel:', error);
    res.status(500).json({ error: 'Failed to remove channel' });
  }
});

// 4. Trigger Fetch Script
app.post('/api/fetch', async (req, res) => {
  try {
    const days = validateDays(req.body.days || 7);
    console.log(`🚀 Triggering Fetch Video Script (last ${days} days)...`);

    // Use execFile to prevent shell injection
    const { stdout, stderr } = await execFileAsync(
      'node',
      ['scripts/fetch_videos.js', days.toString()],
      { maxBuffer: 10 * 1024 * 1024 } // 10MB buffer
    );

    console.log('Fetch output:', stdout);

    if (stderr) {
      console.warn('Fetch warnings:', stderr);
    }

    res.json({ success: true, message: 'Fetch completed' });

  } catch (error) {
    console.error('Fetch error:', error.message);
    res.status(500).json({
      error: 'Fetch failed',
      message: error.code === 'ENOENT'
        ? 'Fetch script not found'
        : 'An error occurred while fetching videos'
    });
  }
});

// 5. Deploy: Fetch + Commit + Push
app.post('/api/deploy', async (req, res) => {
  try {
    const days = validateDays(req.body.days || 7);
    console.log(`🚀 Starting Deployment: Fetch (${days} days) → Commit → Push`);

    let deployLog = [];

    // Step 1: Fetch videos (continue even if this fails due to quota)
    deployLog.push(`Step 1: Fetching videos (last ${days} days)...`);
    console.log(`Step 1: Fetching videos (last ${days} days)...`);

    try {
      const { stdout } = await execFileAsync(
        'node',
        ['scripts/fetch_videos.js', days.toString()],
        GIT_EXEC_OPTIONS
      );
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
      // Check only the files we care about - using array arguments to prevent injection
      const statusOutput = execSync(
        'git status --porcelain src/data/videos.json src/data/channels.json',
        GIT_EXEC_OPTIONS
      );
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
        log: deployLog,
      });
    }

    // Step 3: Git add (only specific files)
    deployLog.push('Step 3: Adding files to git...');
    console.log('Step 3: Git add...');
    execSync('git add src/data/videos.json src/data/channels.json', GIT_EXEC_OPTIONS);
    deployLog.push('✅ Files staged');

    // Step 4: Git commit
    deployLog.push('Step 4: Committing changes...');
    console.log('Step 4: Git commit...');
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const commitMsg = `Auto-update content: ${timestamp}`;

    try {
      // Safe commit message (no user input in commit message)
      const commitOutput = execSync(
        `git commit -m "Auto-update content: ${timestamp}"`,
        GIT_EXEC_OPTIONS
      );
      console.log('✅ Committed:', commitOutput.toString());
      deployLog.push(`✅ Committed: ${commitMsg}`);
    } catch (commitError) {
      const errorMsg =
        commitError.message +
        (commitError.stderr?.toString() || '') +
        (commitError.stdout?.toString() || '');

      // Check various "nothing to commit" messages
      if (
        errorMsg.includes('nothing to commit') ||
        errorMsg.includes('nothing added to commit') ||
        errorMsg.includes('no changes added to commit')
      ) {
        console.log('⚠️ Nothing to commit (files unchanged)');
        deployLog.push('⚠️ No actual changes in files (already up to date)');
        return res.json({
          success: true,
          message: 'No changes to deploy - files are already up to date',
          log: deployLog,
        });
      }

      console.error('Commit error details:', errorMsg);
      throw commitError;
    }

    // Step 5: Git push
    deployLog.push('Step 5: Pushing to GitHub...');
    console.log('Step 5: Git push...');
    const pushOutput = execSync('git push', GIT_EXEC_OPTIONS);

    console.log('✅ Deployed to GitHub');
    console.log(pushOutput.toString());
    deployLog.push('✅ Successfully pushed to GitHub');

    res.json({
      success: true,
      message: 'Deployed successfully to GitHub!',
      output: pushOutput.toString(),
      log: deployLog,
    });
  } catch (error) {
    console.error('❌ Deployment error:', error.message);

    // Don't expose internal error details to client in production
    const errorMessage =
      process.env.NODE_ENV === 'production'
        ? 'Deployment failed. Please check server logs.'
        : error.message;

    res.status(500).json({
      error: 'Deployment failed',
      message: errorMessage,
    });
  }
});

app.listen(PORT, () => {
  console.log(`\n✅ API Server running at http://localhost:${PORT}`);
  console.log(`📋 Allowed origins:`, ALLOWED_ORIGINS);
  console.log(`\nEndpoints:`);
  console.log(`  GET    /api/channels`);
  console.log(`  POST   /api/channels`);
  console.log(`  DELETE /api/channels/:id`);
  console.log(`  POST   /api/fetch`);
  console.log(`  POST   /api/deploy\n`);
});
