import fs from 'fs';
import path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';
import readline from 'readline';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHANNELS_FILE = path.join(__dirname, '../src/data/channels.json');
const YOUTUBE_API_KEY = process.env.VITE_YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const loadChannels = () => {
  if (fs.existsSync(CHANNELS_FILE)) {
    return JSON.parse(fs.readFileSync(CHANNELS_FILE, 'utf-8'));
  }
  return [];
};

const saveChannels = (channels) => {
  fs.writeFileSync(CHANNELS_FILE, JSON.stringify(channels, null, 2), 'utf-8');
  console.log('✅ Channels list updated!');
};

const findChannelId = async (handle) => {
  try {
    console.log(`Searching for channel: ${handle}...`);
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: handle,
        type: 'channel',
        key: YOUTUBE_API_KEY,
        maxResults: 1
      }
    });

    if (response.data.items && response.data.items.length > 0) {
      const item = response.data.items[0];
      return {
        id: item.snippet.channelId,
        title: item.snippet.channelTitle,
        handle: handle
      };
    }
    return null;
  } catch (error) {
    if (error.response && error.response.status === 403) {
      console.error('❌ API Error: 403 Forbidden (Quota exceeded or API not enabled).');
      console.log('👉 To fix: Enable YouTube Data API v3 in Google Cloud Console.');
    } else {
      console.error('❌ Error finding channel:', error.message);
    }
    return null;
  }
};

const addChannel = async () => {
  rl.question('\nEnter Channel Handle (e.g., @toesahanappa): ', async (handle) => {
    if (!handle.startsWith('@')) {
       console.log('⚠️  Handle usually starts with @. Proceeding anyway...');
    }
    
    // API Call
    const channelInfo = await findChannelId(handle);
    
    if (channelInfo) {
      console.log(`\nFound: [${channelInfo.title}] (ID: ${channelInfo.id})`);
      rl.question('Is this correct? (y/n): ', (answer) => {
        if (answer.toLowerCase() === 'y') {
          const channels = loadChannels();
          // Check duplicate
          if (channels.find(c => c.id === channelInfo.id)) {
            console.log('⚠️  Channel already exists in the list.');
          } else {
            channels.push(channelInfo);
            saveChannels(channels);
          }
          showMenu();
        } else {
          console.log('❌ Cancelled.');
          showMenu();
        }
      });
    } else {
      console.log('❌ Could not find channel. Please check the API Key or Handle.');
      
      // Manual Fallback
      rl.question('Would you like to enter Channel ID manually? (y/n): ', (ans) => {
          if (ans.toLowerCase() === 'y') {
               rl.question('channelId: ', (cid) => {
                   rl.question('Channel Name: ', (cname) => {
                        const channels = loadChannels();
                        channels.push({ id: cid, title: cname, handle: handle });
                        saveChannels(channels);
                        showMenu();
                   });
               });
          } else {
              showMenu();
          }
      });
    }
  });
};

const listChannels = () => {
  const channels = loadChannels();
  console.log('\n=== 📺 Subscribed Channels ===');
  if (channels.length === 0) {
    console.log('(No channels added yet)');
  } else {
    channels.forEach((c, i) => {
      console.log(`${i + 1}. ${c.title} (${c.handle})`);
    });
  }
  console.log('==============================');
  showMenu();
};

const removeChannel = () => {
    const channels = loadChannels();
    listChannels(); // Show list first (but it calls showMenu, so we need to be careful not to loop)
    // Actually listChannels calls showMenu, so we print manually here to avoid recursion loop in logic
    
    rl.question('\nEnter number to remove (or 0 to cancel): ', (numStr) => {
        const num = parseInt(numStr);
        if (num > 0 && num <= channels.length) {
            const removed = channels.splice(num - 1, 1);
            saveChannels(channels);
            console.log(`Placed in trash: ${removed[0].title}`);
        }
        showMenu();
    });
};

const showMenu = () => {
  console.log('\n--- Channel Manager ---');
  console.log('1. Add Channel (@handle)');
  console.log('2. List Channels');
  console.log('3. Remove Channel');
  console.log('4. Start Fetching Videos (Exit & Run)');
  console.log('5. Exit');
  
  rl.question('Select option: ', (opt) => {
    switch (opt) {
      case '1': addChannel(); break;
      case '2': listChannels(); break;
      case '3': removeChannel(); break;
      case '4': 
        console.log('Starting fetch...');
        process.exit(0); // Exit with success code 0
        break;
      case '5': 
        console.log('Bye!');
        process.exit(1); // Exit with code 1 (skip fetch)
        break;
      default: showMenu();
    }
  });
};

// Start
console.log('Welcome to AI Channel Manager');
showMenu();
