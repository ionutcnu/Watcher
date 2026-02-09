import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Header } from "@/components/layout/header";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/layout/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WoT Clan Watcher",
  description: "Monitor clan activity, track member changes, and analyze clan statistics in real-time",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://cdn.jsdelivr.net/npm/particles.js@2.0.0/particles.min.js"
          strategy="beforeInteractive"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background`}
      >
        {/* Global particles background - pure DOM, outside React */}
        <div id="particles-js" className="fixed inset-0 z-0"></div>

        {/* Page content */}
        <Providers>
          <div className="relative z-10">
            <Header />
            {children}
          </div>
          <Toaster />
        </Providers>

        {/* Initialize particles after DOM loads */}
        <Script id="particles-init" strategy="afterInteractive">
          {`
            if (typeof particlesJS !== 'undefined') {
              console.log('Initializing particles.js (ONCE)');
              particlesJS('particles-js', {
                particles: {
                  number: {
                    value: 40,
                    density: {
                      enable: true,
                      value_area: 1000
                    }
                  },
                  color: {
                    value: '#ffffff'
                  },
                  shape: {
                    type: 'circle'
                  },
                  opacity: {
                    value: 0.3,
                    random: true
                  },
                  size: {
                    value: 2,
                    random: true
                  },
                  line_linked: {
                    enable: true,
                    distance: 150,
                    color: '#ffffff',
                    opacity: 0.15,
                    width: 0.5
                  },
                  move: {
                    enable: true,
                    speed: 1,
                    direction: 'none',
                    random: false,
                    straight: false,
                    out_mode: 'out',
                    bounce: false
                  }
                },
                interactivity: {
                  detect_on: 'canvas',
                  events: {
                    onhover: {
                      enable: true,
                      mode: 'grab'
                    },
                    onclick: {
                      enable: false
                    },
                    resize: true
                  },
                  modes: {
                    grab: {
                      distance: 120,
                      line_linked: {
                        opacity: 0.4
                      }
                    }
                  }
                },
                retina_detect: true
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
