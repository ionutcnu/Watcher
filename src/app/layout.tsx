import type { Metadata, Viewport } from "next";
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

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://clanspy.win';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'ClanSpy — WoT Clan Intelligence',
    template: '%s | ClanSpy',
  },
  description: 'Track World of Tanks clan member movements in real-time. Monitor joins, leaves, and player migrations across clans. Intel for competitive players.',
  keywords: [
    'World of Tanks', 'WoT', 'clan tracker', 'clan spy', 'member tracking',
    'clan intelligence', 'player movements', 'WoT clans', 'clan monitoring',
    'clanspy', 'wot clan watcher',
  ],
  authors: [{ name: 'ClanSpy' }],
  creator: 'ClanSpy',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: {
    icon: [
      { url: '/icons/favicon.ico', sizes: 'any' },
      { url: '/icons/favicon.svg', type: 'image/svg+xml' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/icons/safari-pinned-tab.svg', color: '#f58a00' },
    ],
  },
  manifest: '/icons/site.webmanifest',
  openGraph: {
    type: 'website',
    url: APP_URL,
    siteName: 'ClanSpy',
    title: 'ClanSpy — WoT Clan Intelligence',
    description: 'Track World of Tanks clan member movements in real-time. Monitor joins, leaves, and player migrations across clans.',
    locale: 'en_US',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ClanSpy — WoT Clan Intelligence Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ClanSpy — WoT Clan Intelligence',
    description: 'Track World of Tanks clan member movements in real-time.',
    images: ['/twitter-card.png'],
  },
  alternates: {
    canonical: APP_URL,
  },
  other: {
    'msapplication-TileColor': '#0b0d10',
    'msapplication-config': '/icons/browserconfig.xml',
  },
};

export const viewport: Viewport = {
  themeColor: '#0b0d10',
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
