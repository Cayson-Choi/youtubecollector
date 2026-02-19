import readline from 'readline';
import { fileURLToPath } from 'url';
import path from 'path';

// Import utilities
import { validateEnvironment } from '../src/config/env.js';
import { validateYouTubeUrl, extractHandle } from '../src/utils/validation.js';
import { loadChannels, saveChannels, addChannel as addChannelToFile, removeChannel as removeChannelFromFile } from '../src/utils/fileUtils.js';
import { fetchChannelByHandle } from '../src/utils/api.js';

// Validate environment on startup
validateEnvironment();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

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
    // Validate URL format
    if (!validateYouTubeUrl(inputUrl)) {
        console.log('❌ Invalid YouTube URL or handle format!');
        console.log('   Examples: https://youtube.com/@channelname or @channelname');
        return;
    }

    const handle = extractHandle(inputUrl);
    console.log(`🔍 Searching for ${handle}...`);

    try {
        // Use shared API utility
        const channelData = await fetchChannelByHandle(handle);

        if (!channelData) {
            console.log('❌ Channel not found on YouTube!');
            return;
        }

        // Check if already exists
        const channels = loadChannels();
        if (channels.find(c => c.id === channelData.id)) {
            console.log(`⚠️  Already exists: ${channelData.title}`);
            return;
        }

        // Add channel using utility
        const added = addChannelToFile(channelData);
        if (added) {
            console.log(`✅ Added: ${channelData.title}`);
        } else {
            console.log(`⚠️  Failed to add channel`);
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
        const channelToRemove = channels[num - 1];
        const removed = removeChannelFromFile(channelToRemove.id);

        if (removed) {
            console.log(`✅ Removed: ${channelToRemove.title}`);
        } else {
            console.log('❌ Failed to remove channel');
        }
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
