import type { Metadata } from "next";
import { SmoothScroll } from "@/components/SmoothScroll";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL('https://avatars.outpace.systems'),
  title: {
    default: '50 beautifully handcrafted gradients - by Outpace Studios',
    template: '%s - Outpace Studios'
  },
  description: '50 beautifully handcrafted gradient avatars, free to use. Colorful profile pictures for social media, apps, and projects. Licensed under CC BY 4.0.',
  keywords: ['gradient avatars', 'free avatars', 'profile pictures', 'colorful avatars', 'gradient pfp', 'free profile pics', 'abstract avatars'],
  authors: [{ name: 'Outpace Studios', url: 'https://outpacestudios.com' }],
  creator: 'Outpace Studios',
  publisher: 'Outpace Studios',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://avatars.outpace.systems',
    siteName: 'Outpace Studios',
    title: '50 beautifully handcrafted gradients - by Outpace Studios',
    description: '50 beautifully handcrafted gradient avatars, free to use. Beautiful colorful profile pictures for social media, apps, and projects.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: '50 beautifully handcrafted gradients by Outpace Studios' }]
  },
  twitter: {
    card: 'summary_large_image',
    title: '50 beautifully handcrafted gradients - by Outpace Studios',
    description: '50 beautifully handcrafted gradient avatars, free to use.',
    images: ['/og-image.jpg']
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    }
  },
  alternates: {
    canonical: 'https://avatars.outpace.systems'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
