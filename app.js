// ZuuXNote — logic
(function(){
  const LOCAL_KEY = 'zuuxnote-notes-local';
  const CODE_KEY = 'zuuxnote-sync-code';

  let notes = [];
  let activeId = null;
  let saveTimer = null;
  let pushTimer = null;

  // Firebase (loaded lazily, only if configured)
  let fb = { app:null, db:null, ready:false, code:null, unsub:null };

  const notesListEl = document.getElementById('notesList');
  const editorPane = document.getElementById('editorPane');
  const searchInput = document.getElementById('searchInput');
  const newNoteBtn = document.getElementById('newNoteBtn');
  const syncPill = document.getElementById('syncPill');
  const syncLabel = document.getElementById('syncLabel');

  function uid(){
    return 'n_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,8);
  }
  function genCode(){
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let out = '';
    for (let i=0;i<6;i++) out += chars[Math.floor(Math.random()*chars.length)];
    return out;
  }
  function fmtTime(ts){
    const d = new Date(ts);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'});
    if (sameDay) return time;
    return d.toLocaleDateString('id-ID', {day:'2-digit', month:'short'}) + ' · ' + time;
  }
  function escapeHtml(str){
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function escapeAttr(str){
    return escapeHtml(str).replace(/"/g,'&quot;');
  }

  function setSyncState(state){
    syncPill.classList.remove('offline','local');
    if (state === 'synced'){
      syncLabel.textContent = 'Tersinkron · ' + (fb.code || '');
    } else if (state === 'syncing'){
      syncLabel.textContent = 'Menyinkronkan…';
    } else if (state === 'offline'){
      syncPill.classList.add('offline');
      syncLabel.textContent = 'Tidak terhubung';
    } else {
      syncPill.classList.add('local');
      syncLabel.textContent = 'Hanya di perangkat ini';
    }
  }

  // ---------- Local storage (always on, offline-first) ----------
  function loadLocal(){
    try{
      const raw = localStorage.getItem(LOCAL_KEY);
      notes = raw ? JSON.parse(raw) : [];
    }catch(e){ notes = []; }
    notes.sort((a,b) => b.updatedAt - a.updatedAt);
    if (notes.length && !activeId) activeId = notes[0].id;
  }
  function saveLocal(){
    localStorage.setItem(LOCAL_KEY, JSON.stringify(notes));
  }

  // ---------- Firebase sync (optional) ----------
  async function initSync(){
    const cfg = window.ZUUXNOTE_FIREBASE_CONFIG;
    const configured = cfg && cfg.apiKey && !cfg.apiKey.startsWith('GANTI');
    if (!configured){
      setSyncState('local');
      return;
    }
    try{
      const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');
      const { getFirestore, doc, setDoc, onSnapshot } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');

      fb.app = initializeApp(cfg);
      fb.db = getFirestore(fb.app);
      fb._doc = doc; fb._setDoc = setDoc; fb._onSnapshot = onSnapshot;

      fb.code = localStorage.getItem(CODE_KEY) || genCode();
      localStorage.setItem(CODE_KEY, fb.code);
      document.getElementById('syncCodeDisplay').textContent = fb.code;

      setSyncState('syncing');
      subscribeRemote();
      fb.ready = true;
    }catch(e){
      console.error('ZuuXNote sync init failed:', e);
      setSyncState('offline');
    }
  }

  function subscribeRemote(){
    const ref = fb._doc(fb.db, 'zuuxnote_spaces', fb.code);
    if (fb.unsub) fb.unsub();
    fb.unsub = fb._onSnapshot(ref, (snap) => {
      if (!snap.exists()){
        setSyncState('synced');
        pushRemote(); // seed remote with local notes
        return;
      }
      const remoteNotes = snap.data().notes || [];
      mergeNotes(remoteNotes);
      setSyncState('synced');
    }, (err) => {
      console.error('ZuuXNote listen error:', err);
      setSyncState('offline');
    });
  }

  function mergeNotes(remoteNotes){
    const byId = new Map();
    notes.forEach(n => byId.set(n.id, n));
    remoteNotes.forEach(rn => {
      const local = byId.get(rn.id);
      if (!local || rn.updatedAt > local.updatedAt) byId.set(rn.id, rn);
    });
    // keep locally-deleted-but-not-yet-pushed notes out: simplest model = union,
    // deletions propagate via tombstone flag
    notes = Array.from(byId.values()).filter(n => !n.deleted);
    notes.sort((a,b) => b.updatedAt - a.updatedAt);
    if (!getNote(activeId) && notes.length) activeId = notes[0].id;
    saveLocal();
    render();
  }

  function pushRemote(){
    if (!fb.ready && !fb._setDoc) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(async () => {
      try{
        setSyncState('syncing');
        const ref = fb._doc(fb.db, 'zuuxnote_spaces', fb.code);
        await fb._setDoc(ref, { notes, updatedAt: Date.now() });
        setSyncState('synced');
      }catch(e){
        console.error('ZuuXNote push failed:', e);
        setSyncState('offline');
      }
    }, 400);
  }

  function persist(){
    saveLocal();
    if (fb.code) pushRemote();
  }
  function scheduleSave(){
    clearTimeout(saveTimer);
    saveTimer = setTimeout(persist, 500);
  }

  // ---------- Note CRUD ----------
  function getNote(id){ return notes.find(n => n.id === id); }

  function createNote(){
    const note = { id: uid(), title:'', content:'', updatedAt: Date.now(), deleted:false };
    notes.unshift(note);
    activeId = note.id;
    persist();
    render();
    setTimeout(() => { const t = document.getElementById('titleInput'); if (t) t.focus(); }, 30);
  }

  function deleteNote(id){
    const note = getNote(id);
    if (note){ note.deleted = true; note.updatedAt = Date.now(); }
    notes = notes.filter(n => n.id !== id);
    if (activeId === id) activeId = notes.length ? notes[0].id : null;
    persist();
    render();
  }

  function updateActiveNote(field, value){
    const note = getNote(activeId);
    if (!note) return;
    note[field] = value;
    note.updatedAt = Date.now();
    notes.sort((a,b) => b.updatedAt - a.updatedAt);
    scheduleSave();
    renderList();
  }

  // ---------- Render ----------
  function renderList(){
    const query = searchInput.value.trim().toLowerCase();
    const filtered = notes.filter(n =>
      !query || n.title.toLowerCase().includes(query) || n.content.toLowerCase().includes(query)
    );
    if (!filtered.length){
      notesListEl.innerHTML = `<div class="empty-list">${notes.length ? 'Tidak ada catatan yang cocok.' : 'Belum ada catatan.<br>Mulai tulis yang pertama.'}</div>`;
      return;
    }
    notesListEl.innerHTML = filtered.map(n => {
      const title = (n.title||'').trim() || 'Tanpa judul';
      const preview = (n.content||'').trim().slice(0, 80) || 'Belum ada isi…';
      const active = n.id === activeId ? 'active' : '';
      return `<li class="${active}" data-id="${n.id}">
        <div class="n-title">${escapeHtml(title)}</div>
        <div class="n-preview">${escapeHtml(preview)}</div>
        <div class="n-meta">${fmtTime(n.updatedAt)}</div>
      </li>`;
    }).join('');
    notesListEl.querySelectorAll('li').forEach(li => {
      li.addEventListener('click', () => { activeId = li.dataset.id; render(); });
    });
  }

  function renderEditor(){
    const note = getNote(activeId);
    if (!note){
      editorPane.innerHTML = `
        <div class="no-note">
          <div class="big">// tidak ada catatan terpilih</div>
          <div>Pilih catatan di sebelah kiri, atau buat yang baru.</div>
        </div>`;
      return;
    }
    editorPane.innerHTML = `
      <div class="editor-head">
        <input type="text" id="titleInput" placeholder="Judul catatan" value="${escapeAttr(note.title)}">
        <button class="icon-btn" id="deleteBtn" title="Hapus catatan" aria-label="Hapus catatan">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
      <div class="editor-body">
        <textarea id="contentInput" placeholder="Mulai menulis…">${escapeHtml(note.content)}</textarea>
      </div>
      <div class="editor-foot">
        <div class="save-state"><div class="save-dot"></div><span>Diperbarui ${fmtTime(note.updatedAt)}</span></div>
        <div id="charCount">${(note.content||'').length} karakter</div>
      </div>`;

    const titleInput = document.getElementById('titleInput');
    const contentInput = document.getElementById('contentInput');
    const deleteBtn = document.getElementById('deleteBtn');
    const charCount = document.getElementById('charCount');

    titleInput.addEventListener('input', e => updateActiveNote('title', e.target.value));
    contentInput.addEventListener('input', e => {
      updateActiveNote('content', e.target.value);
      charCount.textContent = e.target.value.length + ' karakter';
    });
    deleteBtn.addEventListener('click', () => {
      if (confirm('Hapus catatan ini?')) deleteNote(note.id);
    });
  }

  function render(){ renderList(); renderEditor(); }

  newNoteBtn.addEventListener('click', createNote);
  searchInput.addEventListener('input', renderList);

  window.addEventListener('online', () => setSyncState(fb.code ? 'synced' : 'local'));
  window.addEventListener('offline', () => setSyncState('offline'));

  // ---------- Install prompt ----------
  let deferredPrompt = null;
  const installBtn = document.getElementById('installBtn');
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.classList.add('show');
  });
  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installBtn.classList.remove('show');
  });
  window.addEventListener('appinstalled', () => installBtn.classList.remove('show'));

  // ---------- Sync code panel ----------
  const syncCodeBtn = document.getElementById('syncCodeBtn');
  const syncPanel = document.getElementById('syncPanel');
  if (syncCodeBtn){
    syncCodeBtn.addEventListener('click', () => {
      syncPanel.classList.toggle('open');
    });
  }
  const joinBtn = document.getElementById('joinCodeBtn');
  if (joinBtn){
    joinBtn.addEventListener('click', () => {
      const input = document.getElementById('joinCodeInput');
      const code = (input.value || '').trim().toUpperCase();
      if (code.length < 4) return;
      localStorage.setItem(CODE_KEY, code);
      location.reload();
    });
  }

  // ---------- Init ----------
  if ('serviceWorker' in navigator){
    navigator.serviceWorker.register('./sw.js').catch(()=>{});
  }
  loadLocal();
  render();
  initSync();
})();
