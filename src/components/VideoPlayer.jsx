import React, { useRef, useEffect, useState } from 'react';
import { X, Calendar, User, ExternalLink, Play } from 'lucide-react';

export default function VideoPlayer({ video, onClose }) {
  const modalRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        ref={modalRef}
        className="w-full max-w-5xl bg-zinc-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[85vh] md:h-[80vh]"
      >
        {/* Left: Video Player */}
        <div className="md:w-2/3 bg-black flex items-center justify-center aspect-video md:aspect-auto h-1/2 md:h-full">
          <div className="w-full h-full relative group">
            {video.id.startsWith('mock-') ? (
                // Mock Data
                <>
                 <img 
                    src={video.thumbnailUrl} 
                    className="w-full h-full object-cover opacity-50" 
                    alt={video.title} 
                 />
                 <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                     <span className="px-4 py-2 rounded-full bg-white/10 backdrop-blur text-sm font-medium text-white border border-white/10">Preview Mode</span>
                 </div>
                </>
            ) : (
                // Real Video
                <iframe
                src={`https://www.youtube.com/embed/${video.id}?autoplay=1&mute=1&origin=${window.location.origin}`}
                title={video.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                />
            )}
          </div>
        </div>

        {/* Right: Info Panel */}
        <div className="md:w-1/3 flex flex-col h-1/2 md:h-full bg-zinc-950 border-l border-white/10 relative">
            
            {/* Header (Sticky) */}
            <div className="p-6 border-b border-white/5 bg-zinc-950 sticky top-0 z-10">
                <div className="flex justify-between items-start gap-4">
                     <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/20">
                            {video.category}
                            </span>
                            <span className="text-[11px] text-zinc-500">{formattedDate}</span>
                        </div>
                        <h2 className="text-base font-bold text-white leading-snug line-clamp-2">
                            {video.title}
                        </h2>
                     </div>
                     
                     <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                     >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {/* Channel Info */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-sm shadow-inner">
                {video.channelTitle.charAt(0)}
              </div>
              <div>
                <div className="text-sm font-bold text-white">{video.channelTitle}</div>
                <div className="text-[11px] text-zinc-500">YouTube Channel</div>
              </div>
            </div>

            {/* Description (Truncated) */}
            <div className="space-y-2">
              <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">About this video</h3>
              <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed line-clamp-[12]">
                {video.description || "No description available."}
              </p>
            </div>
          </div>

          {/* Action Footer (Sticky Bottom) */}
          <div className="p-5 border-t border-white/10 bg-zinc-950 sticky bottom-0 z-10">
             <a
                href={`https://www.youtube.com/watch?v=${video.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#FF0000] hover:bg-[#CC0000] text-white font-bold text-sm transition-colors shadow-lg shadow-red-900/20"
              >
                <ExternalLink className="w-4 h-4" />
                Watch on YouTube
              </a>
          </div>
        </div>
      </div>
    </div>
  );
}
