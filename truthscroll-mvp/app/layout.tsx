import './globals.css';
import Nav from '../components/Nav';

export const metadata = {
  title: 'TruthScroll MVP',
  description: 'AI-powered transparent Bible study platform'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        {children}
      </body>
    </html>
  );
}
