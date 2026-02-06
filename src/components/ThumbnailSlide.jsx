import React from 'react';
import SlideExample from './SlideExample';

const ThumbnailSlide = ({ template }) => {
  // 실제 슬라이드(SlideExample)를 4배 크기(400%)의 컨테이너에 렌더링한 뒤,
  // CSS transform을 사용해 1/4(0.25) 크기로 축소하여 보여줍니다.
  // 이렇게 하면 SlideExample 내부의 폰트, 여백, 레이아웃이 비율을 유지한 채 썸네일에 딱 맞게 들어갑니다.
  // 텍스트가 깨지거나 짤리지 않고 원본 비율 그대로 축소됩니다.
  const scale = 0.25; 
  const percent = 100 / scale; // 400%

  return (
    <div className="w-full aspect-video relative overflow-hidden rounded-xl bg-zinc-900 pointer-events-none select-none isolate">
      <div 
        className="absolute top-0 left-0 origin-top-left w-full h-full"
        style={{ 
          width: `${percent}%`, 
          height: `${percent}%`, 
          transform: `scale(${scale})` 
        }}
      >
        <SlideExample template={template} />
      </div>
    </div>
  );
};

export default ThumbnailSlide;
