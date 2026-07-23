import { useState, useEffect } from 'react';

const CATEGORIES = ['All', 'Cursor & Click', 'Scrolling & Navigation', 'Zoom', 'Window Management', 'System'];

const CAT_COLORS = {
  'Cursor & Click':          { bg: 'rgba(140,192,235,0.18)', border: 'rgba(140,192,235,0.40)', tag: '#5A9ED6' },
  'Scrolling & Navigation':  { bg: 'rgba(191,221,240,0.22)', border: 'rgba(191,221,240,0.50)', tag: '#7AB8E0' },
  'Zoom':                    { bg: 'rgba(255,235,204,0.40)', border: 'rgba(255,210,150,0.45)', tag: '#c0824a' },
  'Window Management':       { bg: 'rgba(255,249,210,0.60)', border: 'rgba(255,235,150,0.40)', tag: '#b0962c' },
  'System':                  { bg: 'rgba(140,192,235,0.12)', border: 'rgba(140,192,235,0.28)', tag: '#8fa8bf' },
};

const GesturesPage = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [gestures, setGestures] = useState([]);
  
  useEffect(() => {
    fetch('http://localhost:8000/api/all-gestures')
      .then(r => r.json())
      .then(data => setGestures(data))
      .catch(e => console.error("Failed to fetch gestures:", e));
  }, []);

  const filtered = gestures.filter(g => {
    const matchCat = activeCategory === 'All' || g.category === activeCategory;
    const q = search.toLowerCase();
    const matchSearch = !q || g.name.toLowerCase().includes(q) || g.action.toLowerCase().includes(q) || g.desc.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  return (
    <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 28px 60px', width: '100%' }}>
      <div className="section-header" style={{ marginBottom: '28px' }}>
        <div className="section-icon" aria-hidden="true">🤚</div>
        <div>
          <h1>Gesture Library</h1>
          <p style={{ margin: 0 }}>All {gestures.length} built-in and custom DEXTRA gestures.</p>
        </div>
      </div>

      {/* Search + Category Filters */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px', alignItems: 'center' }}>
        <input
          type="search"
          className="form-input"
          placeholder="🔍  Search gestures…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: '280px' }}
          aria-label="Search gestures"
          id="gesture-search"
        />
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`btn ${activeCategory === cat ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '0.80rem', padding: '6px 14px' }}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div style={{ marginBottom: '16px', fontSize: '0.82rem', color: '#8fa8bf' }}>
        Showing {filtered.length} gesture{filtered.length !== 1 ? 's' : ''}
        {activeCategory !== 'All' ? ` in "${activeCategory}"` : ''}
        {search ? ` matching "${search}"` : ''}
      </div>

      {/* Gesture Cards Grid */}
      {filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center', color: '#8fa8bf' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🤷</div>
          <div>No gestures match your search. Try a different term.</div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
          gap: '16px',
        }}>
          {filtered.map((g, i) => {
            const colors = CAT_COLORS[g.category] || CAT_COLORS['System'];
            return (
              <div
                key={i}
                className="glass-card"
                style={{ padding: '20px 22px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}
              >
                <div style={{
                  width: 52, height: 52, flexShrink: 0,
                  borderRadius: 14,
                  background: colors.bg,
                  border: `1.5px solid ${colors.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.6rem',
                }}>
                  {g.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#2c3e50', marginBottom: '3px' }}>
                    {g.name}
                  </div>
                  <div style={{ fontSize: '0.77rem', color: '#8fa8bf', marginBottom: '8px', lineHeight: 1.5 }}>
                    {g.desc}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '0.75rem', fontWeight: 700,
                      background: 'rgba(140,192,235,0.20)',
                      color: '#5A9ED6',
                      padding: '3px 9px', borderRadius: '50px',
                      border: '1px solid rgba(140,192,235,0.35)',
                    }}>
                      ⚡ {g.action}
                    </span>
                    <span style={{
                      fontSize: '0.68rem', fontWeight: 600,
                      color: colors.tag,
                      padding: '2px 7px', borderRadius: '50px',
                      background: colors.bg,
                      border: `1px solid ${colors.border}`,
                    }}>
                      {g.category}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
};

export default GesturesPage;
