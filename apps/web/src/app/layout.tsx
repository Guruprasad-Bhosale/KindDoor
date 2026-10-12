import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'KindDoor - Adaptive, Accessible, Secure Home Entry Agent',
  description: 'The front door that adapts to you. Amazon Developer Hackathon 2026.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-amber-500 selection:text-slate-950">
        {children}
      </body>
    </html>
  );
}
