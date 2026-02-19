import { fileURLToPath } from "url";
import path from "path";

// Import utilities
import { validateEnvironment } from "../src/config/env.js";
import { DEFAULT_DAYS, API_DELAY_MS } from "../src/config/constants.js";
import { loadChannels, saveVideos } from "../src/utils/fileUtils.js";
import { getChannelUploadsPlaylist, fetchPlaylistItems } from "../src/utils/api.js";
import { CATEGORY_KEYWORDS } from "../src/data/categories.js";

// Validate environment on startup
validateEnvironment();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getDateByDays = (days = 7) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

const determineCategories = (title, description) => {
  // Only check Title as requested (ignore description)
  const text = title.toLowerCase();
  const matchedCategories = new Set();

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    // Check strict word boundary for short English words (to avoid Flow vs TensorFlow)
    const isMatch = keywords.some((k) => {
      // If keyword is Korean or multi-word, use simple includes
      if (/[가-힣]/.test(k) || k.includes(" ")) {
        return text.includes(k);
      }
      // If single English word, use Regex for word boundary
      try {
        const regex = new RegExp(`\\b${k}\\b`, "i");
        return regex.test(text);
      } catch (e) {
        return text.includes(k); // Fallback
      }
    });

    if (isMatch) matchedCategories.add(cat);
  }

  return Array.from(matchedCategories);
};

// Fetch videos from a channel's uploads playlist
const fetchChannelVideos = async (channelId, handle, days = DEFAULT_DAYS) => {
  try {
    console.log(`🔍 Scanning Channel: ${handle}...`);

    // Step 1: Get uploads playlist ID (1 quota) - using shared utility
    const uploadsPlaylistId = await getChannelUploadsPlaylist(channelId);

    // Step 2: Get videos from playlist (1 quota) - using shared utility
    const items = await fetchPlaylistItems(uploadsPlaylistId, 20);

    if (items.length === 0) {
      console.log(`   ⚠️  No videos found for ${handle}`);
      return [];
    }

    // Filter by date and map to our format
    const targetDate = new Date(getDateByDays(days));
    const videos = items
      .filter((item) => {
        const publishedDate = new Date(item.snippet.publishedAt);
        return publishedDate >= targetDate;
      })
      .map((item) => {
        const categories = determineCategories(
          item.snippet.title,
          item.snippet.description,
        );

        // If no categories match, return null (to be filtered out later)
        if (categories.length === 0) return null;

        return {
          id: item.snippet.resourceId.videoId, // PlaylistItems uses resourceId.videoId
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnailUrl:
            item.snippet.thumbnails.high?.url ||
            item.snippet.thumbnails.medium?.url,
          channelTitle: item.snippet.channelTitle,
          publishedAt: item.snippet.publishedAt,
          category: categories[0],
          categories: categories,
        };
      })
      .filter((item) => item !== null); // Filter out non-matching videos

    console.log(`   ✅ Found ${videos.length} videos from last ${days} days`);
    return videos;
  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || error.message;
    console.error(`   ❌ Error fetching ${handle}: ${errorMsg}`);
    return [];
  }
};

const main = async () => {
  const startTime = Date.now();

  // Get days from command line argument (default: 7)
  const days = parseInt(process.argv[2]) || DEFAULT_DAYS;

  console.log("\n🚀 Trending AI Insights - Video Fetcher\n");

  const channels = loadChannels();

  if (channels.length === 0) {
    console.error("❌ No channels found!");
    console.error("   Add channels using the Channel Manager or server API");
    return;
  }

  console.log(
    `📡 Fetching videos from ${channels.length} channels (last ${days} days)...`,
  );
  console.log(
    `⚡ Using efficient PlaylistItems API (2 quota per channel vs 100 with Search API)`,
  );
  console.log(`⚡ Parallel processing enabled for optimal performance\n`,
  );

  // **PERFORMANCE OPTIMIZATION: Parallel API calls**
  // Instead of sequential for-loop, fetch all channels in parallel
  const fetchPromises = channels.map((channel, i) => {
    console.log(
      `[${i + 1}/${channels.length}] ${channel.handle || channel.title}`,
    );

    return fetchChannelVideos(
      channel.id,
      channel.handle || channel.title,
      days,
    );
  });

  // Wait for all fetches to complete
  const results = await Promise.all(fetchPromises);
  const allVideos = results.flat();

  // Count successes and failures
  const successCount = results.filter((r) => r.length > 0).length;
  const errorCount = channels.length - successCount;

  // Deduplicate by ID
  const uniqueVideos = Array.from(
    new Map(allVideos.map((item) => [item.id, item])).values(),
  );

  // Sort by Date (newest first)
  uniqueVideos.sort(
    (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt),
  );

  // Calculate category distribution
  const categoryStats = {};
  uniqueVideos.forEach((video) => {
    video.categories.forEach((cat) => {
      categoryStats[cat] = (categoryStats[cat] || 0) + 1;
    });
  });

  // Save to file using utility
  saveVideos(uniqueVideos);

  // Calculate elapsed time
  const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 Summary:");
  console.log("=".repeat(60));
  console.log(`✅ Total videos collected: ${uniqueVideos.length}`);
  console.log(`✅ Successful channels: ${successCount}/${channels.length}`);
  if (errorCount > 0) {
    console.log(`⚠️  Failed channels: ${errorCount}`);
  }
  console.log(`⏱️  Time elapsed: ${elapsedTime}s`);
  console.log(`\n📂 Saved to: src/data/videos.json`);

  if (Object.keys(categoryStats).length > 0) {
    console.log("\n📈 Category Distribution:");
    Object.entries(categoryStats)
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, count]) => {
        console.log(`   ${cat}: ${count} videos`);
      });
  }
  console.log("=".repeat(60) + "\n");
};

main();
