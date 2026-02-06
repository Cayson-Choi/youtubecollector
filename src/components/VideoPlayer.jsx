import React, { useRef, useEffect } from 'react';
import { X, Calendar, User, ExternalLink } from 'lucide-react';

export default function VideoPlayer({ video, onClose }) {
  const modalRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  if (!video) return null;

  const formattedDate = new Date(video.publishedAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        ref={modalRef}
        className="w-full max-w-4xl bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[85vh] md:h-auto"
      >
        {/* Left: Video Player */}
        <div className="md:w-2/3 bg-black flex items-center justify-center aspect-video md:aspect-auto">
          <div className="w-full h-full aspect-video relative group">
            {video.id.startsWith('mock-') ? (
                // Mock Data: Show Thumbnail + Overlay because embedding mock ID fails
                <>
                 <img 
                    src={video.thumbnailUrl} 
                    className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity" 
                    alt={video.title} 
                 />
                 <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                     <div className="text-zinc-300 text-sm font-medium bg-black/50 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
                        Preview Mode (Mock Data)
                     </div>
                     <a
                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(video.title)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-3 rounded-full bg-white text-black font-bold hover:scale-105 transition-transform flex items-center gap-2"
                     >
                        <ExternalLink className="w-4 h-4" />
                        Search on YouTube
                     </a>
                 </div>
                </>
            ) : (
                // Real Video: Show Iframe
                <iframe
                src={`https://www.youtube.com/embed/${video.id}?autoplay=1`}
                title={video.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                />
            )}
          </div>
        </div>

        {/* Right: Info Panel */}
        <div className="md:w-1/3 flex flex-col h-full bg-zinc-950 border-l border-white/10 relative">
            {/* Close Button Mobile */}
             <button
            onClick={onClose}
            className="md:hidden absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-bold border border-indigo-500/20">
                  {video.category}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <Calendar className="w-3.5 h-3.5" />
                  {formattedDate}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white leading-snug">
                {video.title}
              </h2>
            </div>

            {/* Channel Info */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-lg">
                {video.channelTitle.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-white truncate">{video.channelTitle}</div>
                <div className="text-[11px] text-zinc-500">YouTube Channel</div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Description</h3>
              <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                {video.description || "No description available."}
              </p>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-5 border-t border-white/10 bg-zinc-950">
             <div className="flex gap-3">
                 <a
                href={`https://www.youtube.com/watch?v=${video.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Watch on YouTube
              </a>
                <button
                    onClick={onClose}
                    className="hidden md:flex items-center justify-center w-12 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10"
                >
                    <X className="w-5 h-5" />
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
