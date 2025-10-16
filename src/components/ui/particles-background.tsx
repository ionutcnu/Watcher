'use client';

import { useEffect, useMemo, useState } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { Engine, ISourceOptions } from '@tsparticles/engine';

// Global singleton promise - ensures initialization happens only once
let initPromise: Promise<void> | null = null;

export function ParticlesBackground() {
  const [init, setInit] = useState(false);

  useEffect(() => {
    // Create initialization promise only once globally
    if (!initPromise) {
      console.log('Creating initialization promise (should only happen ONCE)');
      initPromise = initParticlesEngine(async (engine: Engine) => {
        console.log('Loading particles engine...');
        await loadSlim(engine);
        console.log('Particles engine loaded!');
      });
    }

    // Wait for the promise to resolve
    initPromise.then(() => {
      console.log('Particles ready, enabling render');
      setInit(true);
    });
  }, []); // Empty deps - only run once per component mount

  const options: ISourceOptions = useMemo(
    () => ({
      background: {
        color: {
          value: 'transparent',
        },
      },
      fpsLimit: 120,
      interactivity: {
        events: {
          onClick: {
            enable: true,
            mode: 'push',
          },
          onHover: {
            enable: true,
            mode: 'grab',
          },
        },
        modes: {
          push: {
            quantity: 4,
          },
          grab: {
            distance: 140,
            links: {
              opacity: 1,
            },
          },
        },
      },
      particles: {
        color: {
          value: '#ffffff',
        },
        links: {
          color: '#ffffff',
          distance: 150,
          enable: true,
          opacity: 0.5,
          width: 1,
        },
        move: {
          direction: 'none',
          enable: true,
          outModes: {
            default: 'bounce',
          },
          random: false,
          speed: 2,
          straight: false,
        },
        number: {
          density: {
            enable: true,
          },
          value: 80,
        },
        opacity: {
          value: 0.8,
        },
        shape: {
          type: 'circle',
        },
        size: {
          value: { min: 1, max: 3 },
        },
      },
      detectRetina: true,
    }),
    []
  );

  if (!init) {
    return null;
  }

  return (
    <Particles
      id="tsparticles"
      options={options}
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
      }}
    />
  );
}
