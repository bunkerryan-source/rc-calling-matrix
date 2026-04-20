import type { Metadata } from 'next';
import { Source_Serif_4, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const serif = Source_Serif_4({ subsets: ['latin'], variable: '--font-serif', display: 'swap' });
const sans = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  title: 'Calling Matrix — Rancho Carrillo Ward',
  description: 'Bishopric calling management',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-white text-black font-sans antialiased">{children}</body>
    </html>
  );
}
