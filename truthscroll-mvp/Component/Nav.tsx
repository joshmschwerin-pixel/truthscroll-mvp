import Link from "next/link";

export default function Nav() {
  return (
    <nav className="nav">
      <Link href="/">TruthScroll</Link>
      <Link href="/read">Read</Link>
      <Link href="/study">Study</Link>
      <Link href="/ask">Ask</Link>
      <Link href="/explore">Explore</Link>
      <Link href="/family">Family</Link>
    </nav>
  );
}