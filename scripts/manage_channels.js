import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import axios from 'axios';
import dotenv from 'dotenv';

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
};

const askQuestion = (query) => {
    return new Promise(resolve => rl.question(query, resolve));
};

const listChannels = () => {
    const channels = loadChannels();
    console.log('\n📺 Current Channels:');
    if (channels.length === 0) {
        console.log('   (No channels registered)');
    } else {
        channels.forEach((ch, index) => {
            console.log(`   ${index + 1}. ${ch.title} (${ch.handle || 'No Handle'})`);
        });
    }
    console.log('');
};

const handleUrl = async (inputUrl) => {
    // 1. Decode URL (Fix %EC%... -> Korean)
    const url = decodeURIComponent(inputUrl.trim());
    
    let handle = url;
    if (url.includes('youtube.com/') || url.includes('youtu.be/')) {
        const parts = url.split('/');
        handle = parts[parts.length - 1].split('?')[0]; // Remove query params
    }
    if (!handle.startsWith('@')) handle = '@' + handle; 

    console.log(`🔍 Searching for ${handle}...`);

    try {
        // Try exact handle lookup first
        let response = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
            params: {
                part: 'snippet',
                forHandle: handle,
                key: YOUTUBE_API_KEY
            }
        });

        // Fallback to Search
        if (!response.data.items || response.data.items.length === 0) {
             console.log('   (Exact match not found, trying broad search...)');
             response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
                params: {
                    part: 'snippet',
                    q: handle,
                    type: 'channel',
                    maxResults: 1,
                    key: YOUTUBE_API_KEY
                }
             });
        }

        if (response.data.items && response.data.items.length > 0) {
            const item = response.data.items[0];
            const channelId = item.id?.channelId || item.id;
            const title = item.snippet.title || item.snippet.channelTitle;

            const channels = loadChannels();
            
            if (channels.find(c => c.id === channelId)) {
                console.log(`⚠️  Already exists: ${title}`);
                return;
            }

            const newChannel = {
                id: channelId,
                title: title,
                handle: handle,
                thumbnail: item.snippet.thumbnails?.default?.url
            };

            channels.push(newChannel);
            saveChannels(channels);
            console.log(`✅ Added: ${title}`);
        } else {
            console.log('❌ Channel not found!');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
};

const addChannel = async () => {
    const url = await askQuestion('🔗 Enter YouTube Channel URL or Handle (e.g., @jocoding): ');
    if (!url.trim()) return;
    await handleUrl(url);
};

const removeChannel = async () => {
    listChannels();
    const channels = loadChannels();
    if (channels.length === 0) return;

    const numStr = await askQuestion('🗑️  Enter Number to Delete (or 0 to cancel): ');
    const num = parseInt(numStr);

    if (num > 0 && num <= channels.length) {
        const removed = channels.splice(num - 1, 1);
        saveChannels(channels);
        console.log(`✅ Removed: ${removed[0].title}`);
    } else {
        console.log('❌ Invalid number.');
    }
};

const main = async () => {
    // CLI Argument Mode (e.g., node manage_channels.js https://youtube.com/@...)
    if (process.argv.length > 2) {
        const arg = process.argv[2];
        console.log(`\n🚀 Direct Add Mode: ${arg}`);
        await handleUrl(arg);
        process.exit(0);
    }

    console.log('\n===========================================');
    console.log('   📢 Channel Manager CLI');
    console.log('===========================================');

    while (true) {
        console.log('\n1. List Channels');
        console.log('2. Add Channel');
        console.log('3. Remove Channel');
        console.log('4. Back to Main Menu');
        
        const choice = await askQuestion('\nSelect an option (1-4): ');

        if (choice === '1') {
            listChannels();
        } else if (choice === '2') {
            await addChannel();
        } else if (choice === '3') {
            await removeChannel();
        } else if (choice === '4') {
            break;
        } else {
            console.log('Invalid option.');
        }
    }
    rl.close();
};

main();
