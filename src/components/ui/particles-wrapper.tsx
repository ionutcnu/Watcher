'use client';

import { ParticlesBackground } from './particles-background';

export function ParticlesWrapper() {
  return (
    <div className="fixed inset-0 z-0" key="particles-container">
      <ParticlesBackground key="particles-instance" />
    </div>
  );
}
