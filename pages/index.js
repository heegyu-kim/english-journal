import { useState, useEffect } from 'react';
import Head from 'next/head';

const STORAGE_KEY = 'gsd_english_diary_v1';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[m-1]} ${d}, ${y}`;
}
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function nowTimeStr() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

// ── Print Sheet ───────────────────────────────────────────────────────────────
function PrintSheet({ entry }) {
  if (!entry) return null;
  const displayEnglish = entry.feedback?.revised || entry.english;
  const isRevised = !!entry.feedback?.revised;
  return (
    <div id="print-sheet" style={{display:'none'}}>
      <div className="print-header">
        <div className="print-title">{formatDate(entry.date)}</div>
        <div className="print-meta">English Journal &nbsp;·&nbsp; GSD Preparation &nbsp;·&nbsp; {entry.time}</div>
      </div>
      <div className="print-section-label">Original · 한국어</div>
      <div className="print-ko">{entry.korean}</div>
      <div className="print-section-label">{isRevised ? 'Revised English · 최종본' : 'English Translation'}</div>
      <div className="print-en">{displayEnglish}</div>
      <hr className="print-divider" />
      <div className="print-practice-label">Handwriting Practice · 필사 공간</div>
      <div className="print-lines">
        {Array.from({length: 10}).map((_,i) => <div key={i} className="print-line" />)}
      </div>
      <div className="print-footer">English Journal · GSD Prep · {formatDate(entry.date)}</div>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ entries, selectedId, onSelect, onNew, onExport, onImport }) {
  return (
    <div className="sidebar">
      <div className="sidebar-logo">English<br />Journal</div>
      <div className="sidebar-sub">GSD Preparation</div>
      {entries.length > 0 && (
        <>
          <div className="sidebar-label">Entries</div>
          <div style={{flex:1, overflowY:'auto'}}>
            {[...entries].reverse().map(e => (
              <div key={e.id} className={`sidebar-entry${selectedId===e.id?' active':''}`} onClick={() => onSelect(e)}>
                <div className="sidebar-entry-date">{formatDate(e.date)} · {e.time}</div>
                <div className="sidebar-entry-preview">
                  {e.english ? e.english.slice(0,48)+'…' : e.korean.slice(0,30)+'…'}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      <div style={{marginTop:'auto', display:'flex', flexDirection:'column'}}>
        <button className="new-btn" onClick={onNew} style={{paddingTop:'24px', borderTop:'1px solid #2E2C29', marginTop:'0'}}>
          <span className="new-btn-icon">＋</span>
          New Entry
        </button>
        <div style={{display:'flex', alignItems:'center', borderTop:'1px solid #2E2C29', marginTop:'10px', paddingTop:'10px', gap:'4px'}}>
          <button onClick={onExport}
            style={{flex:1, background:'none', border:'none', cursor:'pointer', fontFamily:"'JetBrains Mono',monospace", fontSize:'9px', letterSpacing:'0.12em', textTransform:'uppercase', color:'#5A5550', padding:'4px 0', textAlign:'center', transition:'color 0.15s'}}
            onMouseEnter={e=>e.currentTarget.style.color='#C8C4BC'} onMouseLeave={e=>e.currentTarget.style.color='#5A5550'}>
            ↓ Backup
          </button>
          <span style={{color:'#2E2C29'}}>|</span>
          <label style={{flex:1, cursor:'pointer', fontFamily:"'JetBrains Mono',monospace", fontSize:'9px', letterSpacing:'0.12em', textTransform:'uppercase', color:'#5A5550', padding:'4px 0', textAlign:'center', transition:'color 0.15s'}}
            onMouseEnter={e=>e.currentTarget.style.color='#C8C4BC'} onMouseLeave={e=>e.currentTarget.style.color='#5A5550'}>
            ↑ Restore
            <input type="file" accept=".json" onChange={onImport} style={{display:'none'}} />
          </label>
        </div>
      </div>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ onNew }) {
  return (
    <div className="empty">
      <div className="empty-glyph">✦</div>
      <div className="empty-title">첫 번째 일기를 시작하세요</div>
      <div className="empty-sub">한글로 자유롭게 쓰면<br />영어로 번역하고 어휘도 배울 수 있어요.<br />타이핑 연습까지 한 번에.</div>
      <button className="btn btn-primary" style={{marginTop:'8px'}} onClick={onNew}>＋ &nbsp; New Entry</button>
    </div>
  );
}

// ── Write / Edit View ─────────────────────────────────────────────────────────
function WriteView({ onSave, onCancel, editEntry }) {
  const isEdit = !!editEntry;
  const [date, setDate] = useState(isEdit ? editEntry.date : todayStr());
  const [time, setTime] = useState(isEdit ? editEntry.time : nowTimeStr());
  const [korean, setKorean] = useState(isEdit ? editEntry.korean : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTranslate = async () => {
    if (!korean.trim()) return;
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ korean }),
      });
      if (!res.ok) throw new Error('Failed');
      const result = await res.json();
      onSave({
        ...(isEdit ? editEntry : {}),
        date, time, korean,
        english: result.english,
        vocabulary: result.vocabulary,
        feedback: isEdit ? undefined : undefined, // reset feedback on re-translate
      });
    } catch {
      setError('번역에 실패했습니다. 잠시 후 다시 시도해주세요.');
      setLoading(false);
    }
  };

  return (
    <div className="main">
      <div className="page-header">
        <div className="page-title">{isEdit ? 'Edit Entry' : 'New Entry'}</div>
        <div className="page-meta">{isEdit ? '한글을 수정하고 다시 번역하세요' : '한글로 쓰면 영어로 번역됩니다'}</div>
      </div>
      <div className="date-row">
        <div className="input-wrap">
          <label className="form-label">Date</label>
          <input className="field" type="date" value={date} onChange={e=>setDate(e.target.value)} />
        </div>
        <div className="input-wrap">
          <label className="form-label">Time</label>
          <input className="field" type="time" value={time} onChange={e=>setTime(e.target.value)} />
        </div>
      </div>
      <div style={{marginBottom:'28px'}}>
        <label className="form-label" style={{marginBottom:'8px'}}>한글 원문 · Korean</label>
        <textarea className="textarea-ko" value={korean} onChange={e=>setKorean(e.target.value)}
          placeholder={"오늘 하루 있었던 일, 생각, 느낌을 자유롭게 써주세요.\n건축, 일상, 감정, 아이디어 — 무엇이든 좋아요."} autoFocus />
        <div className="char-count">{korean.length} 자</div>
      </div>
      {error && <div className="error-msg">{error}</div>}
      {loading ? (
        <div className="loading">
          <div className="dots"><div className="dot"/><div className="dot"/><div className="dot"/></div>
          <div className="loading-text">{isEdit ? '재번역 중…' : '번역 중…'} 잠시만 기다려주세요.</div>
        </div>
      ) : (
        <div className="btn-row">
          <button className="btn btn-primary" onClick={handleTranslate} disabled={!korean.trim()}>
            {isEdit ? '재번역 & 저장 →' : 'Translate & Save →'}
          </button>
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        </div>
      )}
    </div>
  );
}

// ── Stars ─────────────────────────────────────────────────────────────────────
function Stars({ count }) {
  return (
    <div style={{display:'flex', gap:'4px', margin:'10px 0 16px'}}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{fontSize:'22px', color: i<=count ? '#B56B3F' : '#D8D4CB'}}>★</span>
      ))}
    </div>
  );
}

// ── Claude's Thoughts Tab ─────────────────────────────────────────────────────
function ThoughtsTab({ entry, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const feedback = entry.feedback;

  const handleFetch = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ korean: entry.korean, english: entry.english }),
      });
      if (!res.ok) throw new Error('Failed');
      const result = await res.json();
      onUpdate({ ...entry, feedback: result });
    } catch {
      setError('피드백을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
    }
    setLoading(false);
  };

  if (!feedback && !loading) return (
    <div style={{paddingTop:'16px'}}>
      <p style={{fontFamily:"'Noto Sans KR', sans-serif", fontSize:'14px', color:'var(--text2)', lineHeight:'1.8', marginBottom:'24px'}}>
        Claude가 이 일기 영문을 읽고 별점, 전반적인 코멘트, 그리고 구체적인 표현 개선 제안을 드려요.
      </p>
      {error && <div className="error-msg">{error}</div>}
      <button className="btn btn-primary" onClick={handleFetch}>✦ &nbsp; Claude의 생각 보기</button>
    </div>
  );

  if (loading) return (
    <div className="loading" style={{paddingTop:'48px'}}>
      <div className="dots"><div className="dot"/><div className="dot"/><div className="dot"/></div>
      <div className="loading-text">Claude가 글을 읽고 있어요…</div>
    </div>
  );

  return (
    <div>
      <div className="section-tag">전반적인 평가</div>
      <div style={{background:'var(--white)', padding:'24px 28px', borderLeft:'3px solid var(--warm)', boxShadow:'2px 2px 0 var(--bg3)', marginBottom:'28px'}}>
        <Stars count={feedback.stars} />
        <p style={{fontFamily:"'Noto Sans KR', sans-serif", fontSize:'15px', lineHeight:'1.9', color:'var(--text)'}}>{feedback.comment}</p>
      </div>
      <div className="section-tag">표현 개선 제안</div>
      <div style={{display:'flex', flexDirection:'column', gap:'16px', marginBottom:'28px'}}>
        {feedback.suggestions?.map((s, i) => (
          <div key={i} style={{background:'var(--bg2)', padding:'20px 22px', borderLeft:'2px solid var(--line)'}}>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'10px'}}>
              <div>
                <div style={{fontSize:'9px', letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--text2)', marginBottom:'6px'}}>Original</div>
                <div style={{fontFamily:"'EB Garamond', Georgia, serif", fontSize:'16px', color:'var(--text2)', lineHeight:'1.6', textDecoration:'line-through', textDecorationColor:'var(--error)', textDecorationThickness:'1px'}}>"{s.original}"</div>
              </div>
              <div>
                <div style={{fontSize:'9px', letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--accent)', marginBottom:'6px'}}>Improved</div>
                <div style={{fontFamily:"'EB Garamond', Georgia, serif", fontSize:'16px', color:'var(--text)', lineHeight:'1.6'}}>"{s.improved}"</div>
              </div>
            </div>
            <div style={{fontSize:'11px', color:'var(--warm)', fontFamily:"'Noto Sans KR', sans-serif"}}>↳ {s.reason}</div>
          </div>
        ))}
      </div>
      <button className="btn btn-ghost btn-sm" onClick={handleFetch}>↺ &nbsp; 다시 분석하기</button>
    </div>
  );
}

// ── Entry View ────────────────────────────────────────────────────────────────
function EntryView({ entry, onType, onDelete, onUpdate, onEdit }) {
  const [tab, setTab] = useState('translation');
  const handlePrint = () => window.print();

  return (
    <div className="main">
      <div className="page-header" style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
        <div>
          <div className="page-title">{formatDate(entry.date)}</div>
          <div className="page-meta">{entry.time} &nbsp;·&nbsp; {entry.vocabulary?.length||0} vocabulary items</div>
        </div>
        <div className="btn-row">
          <button className="btn btn-ghost btn-sm" onClick={handlePrint}>⬇ &nbsp; PDF</button>
          <button className="btn btn-ghost btn-sm" onClick={onEdit}>✎ &nbsp; 수정</button>
          <button className="btn btn-primary btn-sm" onClick={onType}>Typing Practice →</button>
          <button className="btn btn-ghost btn-sm" onClick={onDelete}>Delete</button>
        </div>
      </div>

      <div className="tab-row">
        <button className={`tab${tab==='translation'?' active':''}`} onClick={()=>setTab('translation')}>Translation</button>
        <button className={`tab${tab==='vocabulary'?' active':''}`} onClick={()=>setTab('vocabulary')}>Vocabulary</button>
        <button className={`tab${tab==='thoughts'?' active':''}`} onClick={()=>setTab('thoughts')}>
          ✦ Claude의 생각{entry.feedback ? ` ★${entry.feedback.stars}` : ''}
        </button>
        {entry.feedback?.revised && (
          <button className={`tab${tab==='revised'?' active':''}`} onClick={()=>setTab('revised')}>
            최종본
          </button>
        )}
      </div>

      {tab==='translation' && (
        <>
          <div className="section-tag">Original · 한국어</div>
          <div className="block-ko">{entry.korean}</div>
          <div className="section-tag">English Translation</div>
          <div className="block-en">{entry.english}</div>
        </>
      )}
      {tab==='vocabulary' && (
        <>
          <div className="section-tag">Key Vocabulary &amp; Expressions</div>
          <div className="vocab-list">
            {entry.vocabulary?.map((v,i) => (
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
      {tab==='thoughts' && <ThoughtsTab entry={entry} onUpdate={onUpdate} />}
      {tab==='revised' && entry.feedback?.revised && (
        <>
          <div className="section-tag">Original · 한국어</div>
          <div className="block-ko" style={{marginBottom:'28px'}}>{entry.korean}</div>
          <div className="section-tag">Revised English · 최종본</div>
          <div className="block-en" style={{borderLeftColor:'var(--warm)'}}>
            {entry.feedback.revised}
          </div>
          <div style={{marginTop:'16px', fontSize:'11px', color:'var(--text2)', fontFamily:"'Noto Sans KR', sans-serif", lineHeight:'1.7'}}>
            ↳ Claude의 피드백을 반영하여 다듬어진 최종 영문입니다.
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
  const target = entry.feedback?.revised || entry.english || '';
  const isRevised = !!entry.feedback?.revised;
  const correct = typed.split('').filter((c,i)=>c===target[i]).length;
  const accuracy = typed.length>0 ? Math.round((correct/typed.length)*100) : 100;
  const progress = Math.min(100, Math.round((typed.length/target.length)*100));

  const handleChange = (e) => {
    const val = e.target.value;
    if (val.length <= target.length+5) { setTyped(val); if(val.length>=target.length) setFinished(true); }
  };

  return (
    <div className="main">
      <div className="page-header" style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
        <div>
          <div className="page-title">Typing Practice</div>
          <div className="page-meta">
            {formatDate(entry.date)} · {isRevised ? '최종본 기준' : '번역본 기준'} · 아래 영문을 보면서 타이핑하세요
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>← Back</button>
      </div>
      <div className="section-tag">{isRevised ? 'Revised English · 최종본' : 'Reference Text'}</div>
      <div className="typing-source">{target}</div>
      <div className="section-tag">타이핑 영역</div>
      {finished ? (
        <div className="done-state">
          <div className="done-glyph">✦</div>
          <div className="done-title">Well done.</div>
          <div className="done-acc">Final accuracy: {accuracy}%</div>
          <div className="btn-row" style={{justifyContent:'center'}}>
            <button className="btn" onClick={()=>{setTyped('');setFinished(false);}}>Try Again</button>
            <button className="btn btn-ghost" onClick={onBack}>Back to Entry</button>
          </div>
        </div>
      ) : (
        <>
          <textarea className="typing-area" value={typed} onChange={handleChange}
            placeholder="위 영문을 보면서 여기에 타이핑하세요…" autoFocus />
          <div className="stats-row">
            <div className="stat-block">
              <div className="stat-num">{accuracy}%</div>
              <div className="stat-label">Accuracy</div>
            </div>
            <div className="prog-track"><div className="prog-fill" style={{width:`${progress}%`}}/></div>
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
        if (list.length>0) { setSelected(list[list.length-1]); setView('entry'); }
      }
    } catch {}
    setReady(true);
  }, []);

  const persist = (list) => {
    setEntries(list);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  };

  // 새 일기 저장
  const handleSave = ({ date, time, korean, english, vocabulary }) => {
    const entry = { id: Date.now(), date, time, korean, english, vocabulary };
    const updated = [...entries, entry];
    persist(updated);
    setSelected(entry);
    setView('entry');
  };

  // 기존 일기 수정 저장 (id 유지)
  const handleEditSave = (updatedFields) => {
    const updatedEntry = { ...selected, ...updatedFields, id: selected.id, feedback: undefined };
    const updated = entries.map(e => e.id===selected.id ? updatedEntry : e);
    persist(updated);
    setSelected(updatedEntry);
    setView('entry');
  };

  const handleUpdate = (updatedEntry) => {
    const updated = entries.map(e => e.id===updatedEntry.id ? updatedEntry : e);
    persist(updated);
    setSelected(updatedEntry);
  };

  const handleDelete = () => {
    const updated = entries.filter(e => e.id!==selected.id);
    persist(updated);
    setSelected(updated.length>0 ? updated[updated.length-1] : null);
    setView(updated.length>0 ? 'entry' : 'empty');
  };

  // 백업 — JSON 파일로 다운로드
  const handleExport = () => {
    const json = JSON.stringify(entries, null, 2);
    const blob = new Blob([json], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `english-journal-backup-${todayStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 복원 — JSON 파일에서 불러오기
  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const list = JSON.parse(ev.target.result);
        if (!Array.isArray(list)) throw new Error('Invalid format');
        persist(list);
        if (list.length > 0) { setSelected(list[list.length-1]); setView('entry'); }
        alert(`${list.length}개의 일기를 불러왔습니다.`);
      } catch {
        alert('파일을 불러오지 못했습니다. 올바른 백업 파일인지 확인해주세요.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (!ready) return null;

  return (
    <>
      <Head>
        <title>English Journal · GSD Prep</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <PrintSheet entry={selected} />

      <div className="app">
        <Sidebar entries={entries} selectedId={selected?.id}
          onSelect={e=>{setSelected(e);setView('entry');}}
          onNew={()=>{setSelected(null);setView('write');}}
          onExport={handleExport}
          onImport={handleImport} />

        {view==='empty' && <div className="main"><EmptyState onNew={()=>setView('write')} /></div>}

        {view==='write' && (
          <WriteView
            onSave={handleSave}
            onCancel={()=>setView(entries.length>0?'entry':'empty')}
          />
        )}

        {view==='edit' && selected && (
          <WriteView
            editEntry={selected}
            onSave={handleEditSave}
            onCancel={()=>setView('entry')}
          />
        )}

        {view==='entry' && selected && (
          <EntryView
            entry={selected}
            onType={()=>setView('type')}
            onDelete={handleDelete}
            onUpdate={handleUpdate}
            onEdit={()=>setView('edit')}
          />
        )}

        {view==='type' && selected && (
          <TypingView entry={selected} onBack={()=>setView('entry')} />
        )}
      </div>
    </>
  );
}
