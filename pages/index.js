import { useState, useEffect } from 'react';
import Head from 'next/head';

const STORAGE_KEY = 'gsd_english_diary_v1';

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[m - 1]} ${d}, ${y}`;
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function nowTimeStr() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

// ── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ entries, selectedId, onSelect, onNew }) {
  return (
    <div className="sidebar">
      <div className="sidebar-logo">English<br />Journal</div>
      <div className="sidebar-sub">GSD Preparation</div>
      {entries.length > 0 && (
        <>
          <div className="sidebar-label">Entries</div>
          <div style={{flex: 1, overflowY: 'auto'}}>
            {[...entries].reverse().map(e => (
              <div
                key={e.id}
                className={`sidebar-entry${selectedId === e.id ? ' active' : ''}`}
                onClick={() => onSelect(e)}
              >
                <div className="sidebar-entry-date">{formatDate(e.date)} · {e.time}</div>
                <div className="sidebar-entry-preview">
                  {e.english ? e.english.slice(0, 48) + '…' : e.korean.slice(0, 30) + '…'}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      <button className="new-btn" onClick={onNew} style={{marginTop: entries.length === 0 ? 'auto' : '16px'}}>
        <span className="new-btn-icon">＋</span>
        New Entry
      </button>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState({ onNew }) {
  return (
    <div className="empty">
      <div className="empty-glyph">✦</div>
      <div className="empty-title">첫 번째 일기를 시작하세요</div>
      <div className="empty-sub">
        한글로 자유롭게 쓰면<br />
        영어로 번역하고 어휘도 배울 수 있어요.<br />
        타이핑 연습까지 한 번에.
      </div>
      <button className="btn btn-primary" style={{marginTop: '8px'}} onClick={onNew}>
        ＋ &nbsp; New Entry
      </button>
    </div>
  );
}

// ── Write View ────────────────────────────────────────────────────────────────

function WriteView({ onSave, onCancel }) {
  const [date, setDate] = useState(todayStr());
  const [time, setTime] = useState(nowTimeStr());
  const [korean, setKorean] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTranslate = async () => {
    if (!korean.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ korean }),
      });
      if (!res.ok) throw new Error('Failed');
      const result = await res.json();
      onSave({ date, time, korean, english: result.english, vocabulary: result.vocabulary });
    } catch {
      setError('번역에 실패했습니다. 잠시 후 다시 시도해주세요.');
      setLoading(false);
    }
  };

  return (
    <div className="main">
      <div className="page-header">
        <div className="page-title">New Entry</div>
        <div className="page-meta">한글로 쓰면 영어로 번역됩니다</div>
      </div>

      <div className="date-row">
        <div className="input-wrap">
          <label className="form-label">Date</label>
          <input className="field" type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div className="input-wrap">
          <label className="form-label">Time</label>
          <input className="field" type="time" value={time} onChange={e => setTime(e.target.value)} />
        </div>
      </div>

      <div style={{marginBottom: '28px'}}>
        <label className="form-label" style={{marginBottom: '8px'}}>한글 원문 · Korean</label>
        <textarea
          className="textarea-ko"
          value={korean}
          onChange={e => setKorean(e.target.value)}
          placeholder={"오늘 하루 있었던 일, 생각, 느낌을 자유롭게 써주세요.\n건축, 일상, 감정, 아이디어 — 무엇이든 좋아요."}
          autoFocus
        />
        <div className="char-count">{korean.length} 자</div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {loading ? (
        <div className="loading">
          <div className="dots">
            <div className="dot" /><div className="dot" /><div className="dot" />
          </div>
          <div className="loading-text">번역 중… 잠시만 기다려주세요.</div>
        </div>
      ) : (
        <div className="btn-row">
          <button className="btn btn-primary" onClick={handleTranslate} disabled={!korean.trim()}>
            Translate &amp; Save →
          </button>
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        </div>
      )}
    </div>
  );
}

// ── Entry View ────────────────────────────────────────────────────────────────

function EntryView({ entry, onType, onDelete }) {
  const [tab, setTab] = useState('translation');
  return (
    <div className="main">
      <div className="page-header" style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
        <div>
          <div className="page-title">{formatDate(entry.date)}</div>
          <div className="page-meta">{entry.time} &nbsp;·&nbsp; {entry.vocabulary?.length || 0} vocabulary items</div>
        </div>
        <div className="btn-row">
          <button className="btn btn-primary btn-sm" onClick={onType}>Typing Practice →</button>
          <button className="btn btn-ghost btn-sm" onClick={onDelete}>Delete</button>
        </div>
      </div>

      <div className="tab-row">
        <button className={`tab${tab==='translation'?' active':''}`} onClick={()=>setTab('translation')}>Translation</button>
        <button className={`tab${tab==='vocabulary'?' active':''}`} onClick={()=>setTab('vocabulary')}>Vocabulary</button>
      </div>

      {tab === 'translation' && (
        <>
          <div className="section-tag">Original · 한국어</div>
          <div className="block-ko">{entry.korean}</div>
          <div className="section-tag">English Translation</div>
          <div className="block-en">{entry.english}</div>
        </>
      )}
      {tab === 'vocabulary' && (
        <>
          <div className="section-tag">Key Vocabulary &amp; Expressions</div>
          <div className="vocab-list">
            {entry.vocabulary?.map((v, i) => (
              <div key={i} className="vocab-row">
                <div>
                  <div className="vocab-word">{v.word}</div>
                  <div style={{marginTop:'4px'}}><span className="vocab-type">{v.type}</span></div>
                </div>
                <div>
                  <div className="vocab-meaning">{v.meaning}</div>
                  <div className="vocab-example">"{v.example}"</div>
                  {v.note && <div className="vocab-note">↳ {v.note}</div>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Typing View ───────────────────────────────────────────────────────────────

function TypingView({ entry, onBack }) {
  const [typed, setTyped] = useState('');
  const [finished, setFinished] = useState(false);
  const target = entry.english || '';

  const correct = typed.split('').filter((c, i) => c === target[i]).length;
  const accuracy = typed.length > 0 ? Math.round((correct / typed.length) * 100) : 100;
  const progress = Math.min(100, Math.round((typed.length / target.length) * 100));

  const handleChange = (e) => {
    const val = e.target.value;
    if (val.length <= target.length + 5) {
      setTyped(val);
      if (val.length >= target.length) setFinished(true);
    }
  };

  return (
    <div className="main">
      <div className="page-header" style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
        <div>
          <div className="page-title">Typing Practice</div>
          <div className="page-meta">{formatDate(entry.date)} · 아래 영문을 보면서 타이핑하세요</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>← Back</button>
      </div>

      <div className="section-tag">Reference Text</div>
      <div className="typing-source">{target}</div>
      <div className="section-tag">타이핑 영역</div>

      {finished ? (
        <div className="done-state">
          <div className="done-glyph">✦</div>
          <div className="done-title">Well done.</div>
          <div className="done-acc">Final accuracy: {accuracy}%</div>
          <div className="btn-row" style={{justifyContent:'center'}}>
            <button className="btn" onClick={() => { setTyped(''); setFinished(false); }}>Try Again</button>
            <button className="btn btn-ghost" onClick={onBack}>Back to Entry</button>
          </div>
        </div>
      ) : (
        <>
          <textarea
            className="typing-area"
            value={typed}
            onChange={handleChange}
            placeholder="위 영문을 보면서 여기에 타이핑하세요…"
            autoFocus
          />
          <div className="stats-row">
            <div className="stat-block">
              <div className="stat-num">{accuracy}%</div>
              <div className="stat-label">Accuracy</div>
            </div>
            <div className="prog-track">
              <div className="prog-fill" style={{width:`${progress}%`}} />
            </div>
            <div className="stat-block" style={{textAlign:'right'}}>
              <div className="stat-num">{typed.length}<span style={{fontSize:'18px',color:'var(--text2)'}}>/{target.length}</span></div>
              <div className="stat-label">Characters</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── App Root ──────────────────────────────────────────────────────────────────

export default function Home() {
  const [entries, setEntries] = useState([]);
  const [view, setView] = useState('empty');
  const [selected, setSelected] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const list = JSON.parse(stored);
        setEntries(list);
        if (list.length > 0) {
          setSelected(list[list.length - 1]);
          setView('entry');
        }
      }
    } catch {}
    setReady(true);
  }, []);

  const persist = (list) => {
    setEntries(list);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  };

  const handleSave = ({ date, time, korean, english, vocabulary }) => {
    const entry = { id: Date.now(), date, time, korean, english, vocabulary };
    const updated = [...entries, entry];
    persist(updated);
    setSelected(entry);
    setView('entry');
  };

  const handleDelete = () => {
    const updated = entries.filter(e => e.id !== selected.id);
    persist(updated);
    setSelected(updated.length > 0 ? updated[updated.length - 1] : null);
    setView(updated.length > 0 ? 'entry' : 'empty');
  };

  if (!ready) return null;

  return (
    <>
      <Head>
        <title>English Journal · GSD Prep</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="app">
        <Sidebar
          entries={entries}
          selectedId={selected?.id}
          onSelect={e => { setSelected(e); setView('entry'); }}
          onNew={() => { setSelected(null); setView('write'); }}
        />
        {view === 'empty' && <div className="main"><EmptyState onNew={() => setView('write')} /></div>}
        {view === 'write' && (
          <WriteView
            onSave={handleSave}
            onCancel={() => setView(entries.length > 0 ? 'entry' : 'empty')}
          />
        )}
        {view === 'entry' && selected && (
          <EntryView entry={selected} onType={() => setView('type')} onDelete={handleDelete} />
        )}
        {view === 'type' && selected && (
          <TypingView entry={selected} onBack={() => setView('entry')} />
        )}
      </div>
    </>
  );
}
