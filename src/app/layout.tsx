import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { LeadsProvider } from '@/context/LeadsContext';
import { PinProvider } from '@/context/PinContext';
import { PinGate } from '@/components/auth/PinGate';
import { Sidebar } from '@/components/layout/Sidebar';
import { SetupBanner } from '@/components/setup/SetupBanner';
import { FloatingAssistant } from '@/components/assistant/FloatingAssistant';

export const metadata: Metadata = {
  title: 'Client Finder | Discover Real Business Leads & Website Opportunities',
  description:
    'Find real local businesses using Google Places API, identify prospective clients missing a modern website, and track outreach in Supabase.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-neutral-50 text-neutral-900 antialiased min-h-screen selection:bg-neutral-900 selection:text-white">
        <div className="min-h-screen">
          <PinProvider>
            <PinGate>
              <AuthProvider>
                <LeadsProvider>
                  <div className="flex flex-col md:flex-row min-h-screen">
                    <Sidebar />
                    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                      <SetupBanner />
                      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
                        {children}
                      </main>
                    </div>
                  </div>
                  <FloatingAssistant />
                </LeadsProvider>
              </AuthProvider>
            </PinGate>
          </PinProvider>
        </div>
      </body>
    </html>
  );
}
