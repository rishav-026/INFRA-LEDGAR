import type { ReactNode } from 'react';
import { TopBar } from './TopBar';
import { Footer } from './Footer';

interface PageLayoutProps {
  children: ReactNode;
  maxWidth?: string;
}

export function PageLayout({ children, maxWidth = 'max-w-7xl' }: PageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-surface-secondary">
      <TopBar />
      <main className={`flex-1 w-full ${maxWidth} mx-auto px-4 sm:px-6 py-6`}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
