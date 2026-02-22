'use client';

interface VideoSmokeProps {
  videoSrc?: string;
}

export function VideoSmoke({ videoSrc = '/smoke.mp4' }: VideoSmokeProps) {
  return (
    <div aria-hidden="true" className="fixed bottom-0 left-0 right-0 pointer-events-none overflow-hidden" style={{ height: '70%', zIndex: 1 }}>
      {/* Video container with fade mask */}
      <div
        className="absolute inset-0"
        style={{
          maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 20%, rgba(0,0,0,0.8) 35%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.2) 70%, rgba(0,0,0,0) 100%)',
          WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 20%, rgba(0,0,0,0.8) 35%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.2) 70%, rgba(0,0,0,0) 100%)',
        }}
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="none"
          className="absolute bottom-0 left-0 w-full h-full object-cover opacity-30"
          style={{
            mixBlendMode: 'screen',
            filter: 'contrast(0.9) brightness(0.5) blur(1px)',
          }}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      </div>
    </div>
  );
}
