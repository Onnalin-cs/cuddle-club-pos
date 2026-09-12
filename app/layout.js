import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'Cuddle Club - Service Management',
  description: 'ระบบจองและจัดการบริการ Cuddle Club',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>
        <header>
          <h1>Cuddle Club 🐾</h1>
          <nav>
            <Link href="/">จัดการบริการ</Link>
            <Link href="/sell">บันทึกการจอง</Link>
            <Link href="/history">ประวัติการจอง</Link>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
