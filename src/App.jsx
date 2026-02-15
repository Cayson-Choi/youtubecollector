import React, { useMemo, useState } from 'react';
import { Grid3X3, Layers, ExternalLink, Search, Play } from 'lucide-react';
import videosData from './data/videos.json';
import VideoPlayer from './components/VideoPlayer';

import { CATEGORIES } from './data/categories';

export default function AICollectorApp() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Infinite Scroll State
  const [visibleCount, setVisibleCount] = useState(24);
  const observerTarget = React.useRef(null);

  // Safety Check: Ensure videosData is an array
  const safeVideosData = useMemo(() => Array.isArray(videosData) ? videosData : [], []);

  const filteredVideos = useMemo(() => {
    return safeVideosData.filter((v) => {
      // Check if selectedCategory is in the video's categories array
      // Fallback: If 'categories' is missing, use old 'category' field for backward compatibility
      const videoCats = v.categories || [v.category];
      
      const matchCategory = selectedCategory === 'All' || videoCats.includes(selectedCategory);
      const sq = searchQuery.trim().toLowerCase();
      
      // Also search within categories
      const matchSearch =
        !sq ||
        (v.title || '').toLowerCase().includes(sq) ||
        (v.channelTitle || '').toLowerCase().includes(sq) ||
        videoCats.some(c => c.toLowerCase().includes(sq));
      
      return matchCategory && matchSearch;
    });
  }, [selectedCategory, searchQuery, safeVideosData]);

  // Reset visible count when filter/category changes
  React.useEffect(() => {
    setVisibleCount(24);
  }, [selectedCategory, searchQuery]);

  const visibleVideos = useMemo(() => {
    return filteredVideos.slice(0, visibleCount);
  }, [filteredVideos, visibleCount]);

  // Intersection Observer for Infinite Scroll
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
            setVisibleCount((prev) => Math.min(prev + 24, filteredVideos.length));
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [filteredVideos]);

  const categoryCount = useMemo(() => {
    const counts = {};
    CATEGORIES.forEach((c) => {
      counts[c] = 0;
    });
    counts['All'] = safeVideosData.length;
    
    safeVideosData.forEach((v) => {
       const videoCats = v.categories || [v.category];
       videoCats.forEach(cat => {
           // Only count if it's one of our main tracked categories
           if (counts[cat] !== undefined) {
               counts[cat]++;
           }
       });
    });
    return counts;
  }, [safeVideosData]);

  const year = new Date().getFullYear();

  // Helper for relative time
  const getRelativeTime = (dateString) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (days > 0) return `${days}일 전`;
    if (hours > 0) return `${hours}시간 전`;
    return '방금 전';
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-indigo-500/30">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full blur-3xl opacity-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500" />
        <div className="absolute -bottom-48 -right-48 h-[640px] w-[640px] rounded-full blur-3xl opacity-15 bg-gradient-to-br from-emerald-400 via-blue-500 to-indigo-500" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#000_70%,transparent_100%)] opacity-40" />
      </div>

      {/* Top command bar */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="relative group cursor-pointer" onClick={() => setSelectedCategory('All')}>
              <div className="absolute -inset-1 rounded-2xl blur-md opacity-40 group-hover:opacity-70 transition-opacity bg-gradient-to-br from-indigo-500 to-fuchsia-500" />
              <div className="relative w-10 h-10 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center shadow-inner">
                <Layers className="w-5 h-5 text-indigo-300" />
              </div>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-black tracking-tight text-white/90">Trending AI Insights</div>
              <div className="text-[11px] text-white/50 font-medium">
                {safeVideosData.length} monthly updates · {CATEGORIES.length} topics
              </div>
            </div>
          </div>

          <div className="flex-1" />

          {/* Desktop Search */}
          <div className="hidden md:flex items-center gap-2">
            <div className="relative w-[340px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
              <input
                type="text"
                placeholder="Search videos, channels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 rounded-xl bg-white/5 border border-white/5 text-sm outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all font-medium placeholder:text-white/40"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Layout */}
      <div className="relative mx-auto max-w-7xl px-4 py-6 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8 z-10">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-[84px] h-fit space-y-6">
          <div className="rounded-3xl bg-zinc-900/50 border border-white/5 backdrop-blur-md overflow-hidden">
            <div className="p-5 border-b border-white/5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">Explore</div>
              <div className="text-lg font-extrabold tracking-tight text-white/90">Topics</div>
              
              {/* Mobile Search */}
              <div className="mt-3 md:hidden relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 rounded-xl bg-zinc-950/60 border border-white/10 text-sm outline-none focus:border-white/20 placeholder:text-white/40"
                />
              </div>
            </div>

            <div className="p-2 space-y-0.5 max-h-[60vh] overflow-y-auto overflow-x-hidden custom-scrollbar">
               <button
                  onClick={() => setSelectedCategory('All')}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    selectedCategory === 'All'
                      ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/10'
                      : 'text-zinc-200 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span>All Updates</span>
                   <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${selectedCategory === 'All' ? 'bg-white text-zinc-900' : 'bg-white/5 text-zinc-400'}`}>
                    {categoryCount['All']}
                  </span>
                </button>
                <div className="h-px bg-white/5 my-2 mx-2" />
              
              {CATEGORIES.map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? 'bg-indigo-600/20 text-indigo-300 ring-1 ring-indigo-500/30'
                        : 'text-zinc-200 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="truncate">{cat}</span>
                    {categoryCount[cat] > 0 && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${active ? 'bg-indigo-500 text-white' : 'bg-white/5 text-zinc-400'}`}>
                        {categoryCount[cat]}
                        </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="px-4 text-[11px] text-zinc-400 leading-relaxed text-center">
             Data is automatically collected daily via YouTube API.
          </div>
        </aside>

        {/* Main Content */}
        <main>
          {/* Hero Stats */}
          <div className="rounded-3xl bg-gradient-to-r from-indigo-900/20 to-fuchsia-900/20 border border-white/5 p-6 mb-8 relative overflow-hidden group">
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
            <div className="relative z-10">
                <div className="inline-flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider text-indigo-300 mb-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                    Live Repository
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">
                    This Month in <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-400">Trending AI</span>
                </h1>
                <p className="text-zinc-300 max-w-xl text-sm leading-relaxed">
                    A curated feed of the latest tutorials, news, and demos from the Korean AI community.
                    Updated daily to keep you ahead of the curve.
                </p>
            </div>
          </div>

          {/* Results Header */}
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Latest Uploads
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 font-normal">
                    {filteredVideos.length}
                </span>
            </h2>

             <div className="text-xs text-zinc-300 font-medium">
                Sorted by Recency
             </div>
          </div>

          {/* Video Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {visibleVideos.map((video) => (
              <div
                key={video.id}
                onClick={() => setSelectedVideo(video)}
                className="group relative flex flex-col gap-3 p-3 rounded-2xl bg-zinc-900/40 border border-white/5 hover:border-white/10 hover:bg-zinc-800/60 transition-all cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/5"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-950 shadow-inner">
                    <img 
                        src={video.thumbnailUrl} 
                        alt={video.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                        loading="lazy"
                    />
                    
                    {/* Category Badges */}
                    <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                        {(video.categories || [video.category]).map((cat, idx) => (
                             <div key={idx} className="px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[10px] font-bold text-white border border-white/10">
                                {cat}
                            </div>
                        ))}
                    </div>

                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20 group-hover:backdrop-blur-[1px]">
                         <div className="w-12 h-12 rounded-full bg-white/90 text-zinc-950 flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                            <Play className="w-5 h-5 fill-current ml-1" />
                         </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex flex-col gap-1 px-1">
                    <h3 className="text-sm font-bold text-zinc-100 leading-snug line-clamp-2 group-hover:text-indigo-300 transition-colors">
                        {video.title}
                    </h3>
                    <div className="flex items-center justify-between gap-2 text-[11px] text-zinc-400 mt-1">
                        <span className="font-medium text-zinc-300 truncate">{video.channelTitle}</span>
                        <span className="whitespace-nowrap">{getRelativeTime(video.publishedAt)}</span>
                    </div>
                </div>
              </div>
            ))}
          </div>

          {/* Loader / End of List Observer */}
          {filteredVideos.length > visibleCount && (
             <div ref={observerTarget} className="flex justify-center py-8">
                 <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
             </div>
          )}

          {/* Empty State */}
          {filteredVideos.length === 0 && (
            <div className="mt-12 text-center py-20 rounded-3xl border border-dashed border-white/10 bg-white/5">
              <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <Grid3X3 className="w-8 h-8 text-zinc-500" />
              </div>
              <h3 className="text-lg font-bold text-white">No videos found</h3>
              <p className="text-zinc-400 text-sm mt-1">Try selecting a different category or change your search.</p>
            </div>
          )}
          
                  {/* Footer */}
          <footer className="mt-16 pb-8 border-t border-white/5 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
                <div>
                     <div className="text-sm font-bold text-white mb-1">Trending AI Insights</div>
                     <div className="text-xs text-zinc-400">Automated curation for AI engineers & designers.</div>
                </div>
                <div className="text-right">
                    <div className="text-[11px] text-zinc-400 font-medium">
                        © {year} Cayson Tech. All rights reserved.
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">
                        Powered by YouTube Data API & Vercel
                    </div>
                </div>
            </div>
          </footer>

        </main>
      </div>

      {/* Video Player Modal */}
      {selectedVideo && (
        <VideoPlayer 
            video={selectedVideo} 
            onClose={() => setSelectedVideo(null)} 
        />
      )}
    </div>
  );
}
