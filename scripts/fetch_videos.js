import fs from 'fs';
import path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const YOUTUBE_API_KEY = process.env.VITE_YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY;
const OUTPUT_FILE = path.join(__dirname, '../src/data/videos.json');
const CHANNELS_FILE = path.join(__dirname, '../src/data/channels.json');

const CATEGORY_KEYWORDS = {
  'NanoBanana': ['나노바나나', 'nanobanana', 'nano banana', '나노', 'nano'],
  'Gemini': ['gemini', '제미나이', 'gemini pro', 'gemini flash', 'gemini 2.0', '구글 ai', 'deepmind'],
  'ChatGPT': ['chatgpt', 'chat gpt', 'gpt', 'gpt-4', 'gpt-3', '챗gpt', '챗지피티', 'openai', 'o1', 'o3', 'o4'],
  'Claude': ['claude', '클로드', 'claude sonnet', 'claude opus', 'anthropic', '앤스로픽'],
  'NotebookLM': ['notebooklm', 'notebook lm', '노트북lm', '노트북엘엠'],
  'Antigravity': ['antigravity', '안티그래비티', '앤티그래비티'],
  'Midjourney': ['midjourney', 'mid journey', '미드저니', '미드저니'],
  'Runway': ['runway', 'runway ml', '런웨이', '런에이', 'gen-2', 'gen-3', 'gen 2', 'gen 3'],
  'Sora': ['sora', '소라', 'openai sora', 'openai video'],
  'DeepSeek': ['deepseek', 'deep seek', '딥시크'],
  'Perplexity': ['perplexity', '퍼플렉시티', '퍼플렉시티', 'perplexity ai'],
  'Windsurf': ['windsurf', 'wind surf', '윈드서프', '윈드서퍼'],
  'Cursor': ['cursor', 'cursor ai', '커서', 'cursor ide'],
  'Grok': ['grok', 'grok ai', '그록', 'xai', 'x ai'],
  'Llama': ['llama', '라마', 'llama 3', 'llama 4', 'meta ai', 'meta llama'],
  'Suno': ['suno', 'suno ai', '수노'],
  'OpenClaw': ['openclaw', 'open claw', '오픈클로', '오픈클로우', '몰트봇', 'moltbot', '클로드봇'],
  'ZenSpark': ['zenspark', 'zen spark', '젠스파크'],
  'Flow': ['flow', 'flow ai', '플로우', '플로']
};

const getOneWeekAgoDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - 7); // 1 week (changed from 90 days)
  return date.toISOString();
};

const determineCategories = (title, description) => {
  const text = (title + ' ' + description).toLowerCase();
  const matchedCategories = new Set();

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(k => text.includes(k))) {
      matchedCategories.add(cat);
    }
  }

  return Array.from(matchedCategories);
};

// Get channel's uploads playlist ID - Uses 1 quota (vs 100 for search)
const getChannelUploadsPlaylistId = async (channelId) => {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
        params: {
            part: 'contentDetails',
            id: channelId,
            key: YOUTUBE_API_KEY
        }
    });

    if (!response.data.items || response.data.items.length === 0) {
        throw new Error('Channel not found');
    }

    return response.data.items[0].contentDetails.relatedPlaylists.uploads;
};

// Fetch videos from playlist - Uses 1 quota (vs 100 for search)
const fetchChannelVideos = async (channelId, handle) => {
    try {
        console.log(`🔍 Scanning Channel: ${handle}...`);

        // Step 1: Get uploads playlist ID (1 quota)
        const uploadsPlaylistId = await getChannelUploadsPlaylistId(channelId);

        // Step 2: Get videos from playlist (1 quota) - MUCH more efficient!
        const response = await axios.get('https://www.googleapis.com/youtube/v3/playlistItems', {
            params: {
                part: 'snippet',
                playlistId: uploadsPlaylistId,
                maxResults: 20, // Get more videos since quota is cheaper
                key: YOUTUBE_API_KEY
            }
        });

        if (!response.data.items || response.data.items.length === 0) {
            console.log(`   ⚠️  No videos found for ${handle}`);
            return [];
        }

        // Filter by date and map to our format
        const oneWeekAgo = new Date(getOneWeekAgoDate());
        const videos = response.data.items
            .filter(item => {
                const publishedDate = new Date(item.snippet.publishedAt);
                return publishedDate >= oneWeekAgo;
            })
            .map(item => {
                const categories = determineCategories(
                    item.snippet.title,
                    item.snippet.description
                );
                if (categories.length === 0) categories.push('General');

                return {
                    id: item.snippet.resourceId.videoId, // PlaylistItems uses resourceId.videoId
                    title: item.snippet.title,
                    description: item.snippet.description,
                    thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
                    channelTitle: item.snippet.channelTitle,
                    publishedAt: item.snippet.publishedAt,
                    category: categories[0],
                    categories: categories
                };
            });

        console.log(`   ✅ Found ${videos.length} videos from last 7 days`);
        return videos;

    } catch (error) {
        const errorMsg = error.response?.data?.error?.message || error.message;
        console.error(`   ❌ Error fetching ${handle}: ${errorMsg}`);
        return [];
    }
};

const main = async () => {
  console.log('\n🚀 AI Insight Collector - Video Fetcher\n');

  if (!YOUTUBE_API_KEY) {
      console.error('❌ YouTube API Key not found in .env file!');
      console.error('   Please add VITE_YOUTUBE_API_KEY=your_key_here to .env');
      return;
  }

  if (!fs.existsSync(CHANNELS_FILE)) {
      console.error('❌ Channels file not found!');
      return;
  }

  const channels = JSON.parse(fs.readFileSync(CHANNELS_FILE, 'utf-8'));
  console.log(`📡 Fetching videos from ${channels.length} channels (last 7 days)...`);
  console.log(`⚡ Using efficient PlaylistItems API (2 quota per channel vs 100 with Search API)\n`);

  let allVideos = [];
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < channels.length; i++) {
      const channel = channels[i];
      console.log(`[${i + 1}/${channels.length}] ${channel.handle || channel.title}`);

      const videos = await fetchChannelVideos(channel.id, channel.handle || channel.title);

      if (videos.length > 0) {
          successCount++;
          allVideos = [...allVideos, ...videos];
      } else {
          errorCount++;
      }

      // Small delay to be nice to API
      await new Promise(r => setTimeout(r, 200));
  }

  // Deduplicate by ID
  const uniqueVideos = Array.from(new Map(allVideos.map(item => [item.id, item])).values());

  // Sort by Date (newest first)
  uniqueVideos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  // Calculate category distribution
  const categoryStats = {};
  uniqueVideos.forEach(video => {
      video.categories.forEach(cat => {
          categoryStats[cat] = (categoryStats[cat] || 0) + 1;
      });
  });

  // Save to file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(uniqueVideos, null, 2), 'utf-8');

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary:');
  console.log('='.repeat(60));
  console.log(`✅ Total videos collected: ${uniqueVideos.length}`);
  console.log(`✅ Successful channels: ${successCount}/${channels.length}`);
  if (errorCount > 0) {
      console.log(`⚠️  Failed channels: ${errorCount}`);
  }
  console.log(`\n📂 Saved to: ${OUTPUT_FILE}`);

  if (Object.keys(categoryStats).length > 0) {
      console.log('\n📈 Category Distribution:');
      Object.entries(categoryStats)
          .sort((a, b) => b[1] - a[1])
          .forEach(([cat, count]) => {
              console.log(`   ${cat}: ${count} videos`);
          });
  }
  console.log('='.repeat(60) + '\n');
};

main();
