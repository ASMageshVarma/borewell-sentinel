import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Borewell Sentinel — Groundwater Intelligence System',
  description: 'Season-aware AI for trustworthy groundwater anomaly detection.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
