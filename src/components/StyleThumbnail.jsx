import React from 'react';

const StyleThumbnail = ({ template }) => {
  const { style, id } = template;

  const renderElements = () => {
    switch (id) {
      case 'minimal':
        return (
          <>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-px" style={{ backgroundColor: style.accent }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-3 text-[8px]" style={{ color: style.text }}>
              Less is More
            </div>
          </>
        );
      case 'monochrome':
        return (
          <>
            <div className="absolute inset-3 border" style={{ borderColor: `${style.text}40` }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold" style={{ color: style.text }}>
              B&W
            </div>
          </>
        );
      case 'cyberpunk':
        return (
          <>
            <div className="absolute inset-2 border" style={{ borderColor: style.accent }} />
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[9px] font-mono"
              style={{ color: style.text, textShadow: `0 0 10px ${style.text}` }}
            >
              CYBER
            </div>
          </>
        );
      case 'luxury':
        return (
          <>
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-px" style={{ backgroundColor: style.accent }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px] tracking-widest" style={{ color: style.accent }}>
              LUXE
            </div>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs" style={{ color: style.accent }}>
              ◆
            </div>
          </>
        );
      default:
        return (
          <>
            <div className="absolute top-4 left-4 right-8 h-2 rounded" style={{ backgroundColor: style.text, opacity: 0.75 }} />
            <div className="absolute top-8 left-4 right-12 h-1 rounded" style={{ backgroundColor: style.text, opacity: 0.35 }} />
            <div className="absolute bottom-3 left-4 right-4 h-1 rounded" style={{ backgroundColor: style.accent, opacity: 0.55 }} />
          </>
        );
    }
  };

  return (
    <div className="aspect-video rounded-lg overflow-hidden relative pointer-events-none" style={{ backgroundColor: style.bg }}>
      {renderElements()}
    </div>
  );
};

export default StyleThumbnail;
