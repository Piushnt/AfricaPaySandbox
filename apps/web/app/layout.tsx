import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '../components/sidebar';

export const metadata: Metadata = { title: 'Payment Sandbox Africa', description: 'Console développeur de simulation des paiements Mobile Money — aucun transfert réel.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body><div className="shell"><Sidebar /><main className="main">{children}</main></div></body></html>;
}
