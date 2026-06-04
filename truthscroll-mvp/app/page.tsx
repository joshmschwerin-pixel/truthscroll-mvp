import Link from 'next/link';

const modules = [
  ['Read', 'Bible reader with public-domain text, notes, and highlights.', '/read'],
  ['Search', 'Find verses, names, and phrases across the Bible.', '/search'],
  ['Study', 'Original-language transparency, literal rendering, and cross references.', '/study'],
  ['Ask', 'AI Bible scholar for careful verse and doctrine questions.', '/ask'],
  ['Explore', 'Browse books and chapters to discover scripture connections.', '/explore'],
  ['Family', 'Age-based discipleship lessons for home and small groups.', '/family']
];

export default function Home() {
  return (
    <main className="container">
      <section className="hero">
        <span className="badge">MVP</span>
        <h1>TruthScroll</h1>
        <p className="muted">A transparent Bible study platform combining reading, original-language tools, AI commentary, visual exploration, pattern discovery, and family discipleship.</p>
      </section>
      <section className="grid">
        {modules.map(([title, desc, href]) => (
          <Link className="card" href={href} key={title}>
            <h2>{title}</h2>
            <p className="muted">{desc}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
