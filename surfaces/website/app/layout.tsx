import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Countdown to Diffuse Personal AI',
  description: 'A two-gate projection for the diffusion of Personal AI: model–harness capability and U.S. inference supply.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
