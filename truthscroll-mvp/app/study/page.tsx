import greek from "../../data/greekSamples.json";

export default function StudyPage() {
  return (
    <main className="page">
      <h1>Original Language Study</h1>
      <p>See Greek/Hebrew phrasing, literal rendering, and textual notes for key verses.</p>

      <section className="grid">
        {greek.map((item) => (
          <article className="card" key={item.reference}>
            <h2>{item.reference}</h2>
            <p><strong>Greek:</strong> {item.greek}</p>
            <p><strong>Literal:</strong> {item.literal}</p>
            <p><strong>Notes:</strong> {item.notes}</p>
          </article>
        ))}
      </section>

      <section className="card" style={{ marginTop: 24 }}>
        <h2>Transparent translation layer</h2>
        <p className="muted">This MVP shows the original-language text, literal sense, and explanatory notes. Later versions will add word-by-word parsing, alternate translations, manuscript data, and confidence indicators.</p>
      </section>
    </main>
  );
}
