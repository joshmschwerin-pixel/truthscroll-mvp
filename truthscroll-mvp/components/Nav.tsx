"use client";
import Link from 'next/link';
import SupabaseAuth from './SupabaseAuth';

const modules = [
  ['Read', '/read'],
  ['Search', '/search'],
  ['Study', '/study'],
  ['Ask', '/ask'],
  ['Explore', '/explore'],
  ['Family', '/family']
];

export default function Nav() {
  return (
    <>
      <nav className="nav top-nav" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div style={{display:'flex', gap:12, alignItems:'center'}}>
          <Link href="/">TruthScroll</Link>
          {modules.map(([label, href]) => (
            <Link key={label} href={href}>{label}</Link>
          ))}
        </div>
        <SupabaseAuth />
      </nav>
      <nav className="nav bottom-tabs">
        {modules.map(([label, href]) => (
          <Link key={label} href={href} className="tab">{label}</Link>
        ))}
      </nav>
    </>
  );
}
