(() => {
  // Pengaturan: ubah ke false untuk menyembunyikan bagian ini di situs publik.
  const CONFIG = {
    tampilkanPeluang: true, // kolom "Peluang untuk Dopa" di tabel acara GOR
    tampilkanCelah: true    // bagian "Yang masih kosong"
  };

  // Sumber data: Google Sheets yang dipublikasikan sebagai CSV.
  // Kalau sebuah link gagal dimuat, situs otomatis memakai file cadangan di folder data/.
  const SUMBER = {
    organisasi: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTHFP5cy7LShoEHwAfkEDFeECLqPDvVaVCqlHP3nBdnnEQunctUpqvLNK3why2jC07HvnTiOkkYV0DM/pub?gid=1217287984&single=true&output=csv',
    mahasiswa: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTHFP5cy7LShoEHwAfkEDFeECLqPDvVaVCqlHP3nBdnnEQunctUpqvLNK3why2jC07HvnTiOkkYV0DM/pub?gid=312049306&single=true&output=csv',
    acara_gor: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTHFP5cy7LShoEHwAfkEDFeECLqPDvVaVCqlHP3nBdnnEQunctUpqvLNK3why2jC07HvnTiOkkYV0DM/pub?gid=1593920444&single=true&output=csv',
    celah: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTHFP5cy7LShoEHwAfkEDFeECLqPDvVaVCqlHP3nBdnnEQunctUpqvLNK3why2jC07HvnTiOkkYV0DM/pub?gid=1338886241&single=true&output=csv'
  };

  const nf = new Intl.NumberFormat('id-ID');
  const pctf = new Intl.NumberFormat('id-ID', {style: 'percent', maximumFractionDigits: 1});
  const deltaf = new Intl.NumberFormat('id-ID', {style: 'percent', maximumFractionDigits: 1, signDisplay: 'always'});
  const $ = (s) => document.querySelector(s);
  const mk = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };
  const safeUrl = (u) => (typeof u === 'string' && /^https:\/\//.test(u) ? u : null);
  const setText = (sel, v) => { const e = $(sel); if (e) e.textContent = v; };

  // Pembaca CSV sederhana (mendukung tanda kutip dan koma di dalam sel).
  function parseCSV(text) {
    text = text.replace(/^﻿/, '');
    const rows = [];
    let row = [], f = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; }
        else f += c;
      } else if (c === '"') q = true;
      else if (c === ',') { row.push(f); f = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(f); f = ''; rows.push(row); row = [];
      } else f += c;
    }
    if (f !== '' || row.length) { row.push(f); rows.push(row); }
    const head = rows.shift().map((h) => h.trim());
    return rows.filter((r) => r.some((x) => x.trim() !== ''))
      .map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] == null ? '' : r[i]).trim()])));
  }

  const fetchRows = async (url, minCols) => {
    const res = await fetch(url, {cache: 'no-cache'});
    if (!res.ok) throw new Error('Gagal memuat ' + url);
    const rows = parseCSV(await res.text());
    if (!rows.length || Object.keys(rows[0]).length < minCols || !('id' in rows[0])) throw new Error('Isi tidak sesuai: ' + url);
    return rows;
  };

  const load = async (name) => {
    if (SUMBER[name]) {
      try { return await fetchRows(SUMBER[name], 4); } catch (e) { /* pakai cadangan */ }
    }
    return fetchRows('data/' + name + '.csv', 4);
  };

  function buildHead(table, cols) {
    const tr = mk('tr');
    cols.forEach((c) => { const th = mk('th', null, c.label); th.dataset.k = c.key; tr.append(th); });
    table.tHead.replaceChildren(tr);
  }

  function fillBody(table, cols, rows) {
    const body = table.tBodies[0];
    body.replaceChildren(...rows.map((r) => {
      const tr = mk('tr');
      cols.forEach((c) => {
        const td = mk('td', 'c-' + c.key);
        const v = r[c.key] == null ? '' : String(r[c.key]);
        const href = c.link ? safeUrl(r[c.link]) : null;
        if (c.chip && v) {
          const cls = v === 'Terverifikasi' || v === 'Selesai' ? 'ok' : v === 'Belum terverifikasi' || v === 'Belum' ? 'warn' : 'none';
          td.append(mk('span', 'chip ' + cls, v));
        } else if (href && v) {
          const a = mk('a', null, v);
          a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer';
          td.append(a);
        } else td.textContent = v;
        tr.append(td);
      });
      return tr;
    }));
  }

  function bars(box, rows, hlMode) {
    const max = Math.max(...rows.map((r) => r.jumlah));
    const hl = hlMode === 'last' ? rows.length - 1 : rows.reduce((m, r, i) => (r.jumlah > rows[m].jumlah ? i : m), 0);
    box.replaceChildren(...rows.map((r, i) => {
      const row = mk('div', 'bar-row' + (i === hl ? ' hl' : ''));
      row.title = r.label + ' · ' + r.periode + ': ' + nf.format(r.jumlah) + ' orang';
      const track = mk('div', 'track');
      const fill = mk('div', 'fill');
      fill.style.width = Math.max(1, (r.jumlah / max) * 100) + '%';
      track.append(fill);
      row.append(mk('span', 'name', r.label), track, mk('span', 'val', nf.format(r.jumlah)));
      return row;
    }));
  }

  async function main() {
    let org, mhs, gor, celah, prodi, dir;
    try {
      [org, mhs, gor, celah, prodi, dir] = await Promise.all([load('organisasi'), load('mahasiswa'), load('acara_gor'), load('celah'), load('prodi'), load('direktorat')]);
      // link situs prodi: tambahkan https:// otomatis
      prodi.forEach((r) => { r.website_url = r.website ? 'https://' + r.website.replace(/^https?:\/\//, '') : ''; });
    } catch (e) {
      const g = $('#galat');
      g.hidden = false;
      g.textContent = 'Data belum bisa dimuat. Buka situs ini lewat alamat web (misalnya GitHub Pages), bukan dengan klik dua kali file index.html.';
      return;
    }
    mhs.forEach((r) => { r.jumlah = Number(r.jumlah); });
    const by = (id) => mhs.find((r) => r.id === id);

    // daftar yang bisa disaring: organisasi dan prodi
    const ok = (r) => r.status_ig === 'Terverifikasi';
    setText('#lede-org', nf.format(org.length));
    setText('#lede-ig', nf.format(org.filter(ok).length));
    const m02 = by('m02');
    if (m02) { setText('#lede-mhs', nf.format(m02.jumlah)); setText('#lede-periode', m02.periode); }

    // Kalau satu bagian gagal, bagian lain tetap tampil dan pesan galat muncul di bagian itu.
    const safe = (fn, sel) => {
      try { fn(); } catch (e) {
        console.error(e);
        const s = $(sel);
        if (s) s.append(mk('p', 'galat', 'Bagian ini gagal dimuat: ' + e.message));
      }
    };

    function filterable(o) {
      const state = {grup: 'Semua', q: ''};
      const tilesBox = $(o.tiles), cariEl = $(o.cari), semuaEl = $(o.semua), emptyEl = $(o.kosong), table = $(o.table);
      const tileEls = o.grup.map((g) => {
        const rows = o.data.filter((r) => r[o.key] === g);
        const b = mk('button', 'tile');
        b.type = 'button';
        b.setAttribute('aria-pressed', 'false');
        b.append(mk('span', 'lab', (o.labels && o.labels[g]) || g), mk('span', 'big', nf.format(rows.length)));
        if (o.sub) b.append(mk('span', 'sub', o.sub(rows)));
        b.addEventListener('click', () => { state.grup = state.grup === g ? 'Semua' : g; render(); });
        tilesBox.append(b);
        return [g, b];
      });
      buildHead(table, o.cols);
      function render() {
        const q = state.q.trim().toLowerCase();
        const rows = o.data.filter((r) => (state.grup === 'Semua' || r[o.key] === state.grup) &&
          (!q || o.cari_di.map((k) => r[k]).join(' ').toLowerCase().includes(q)));
        fillBody(table, o.cols, rows);
        emptyEl.hidden = rows.length > 0;
        tileEls.forEach(([g, b]) => b.setAttribute('aria-pressed', String(g === state.grup)));
        semuaEl.hidden = state.grup === 'Semua' && !q;
      }
      cariEl.addEventListener('input', () => { state.q = cariEl.value; render(); });
      semuaEl.addEventListener('click', () => { state.grup = 'Semua'; state.q = ''; cariEl.value = ''; render(); });
      render();
    }

    safe(() => filterable({
      data: org, key: 'kelompok', grup: ['Fakultas', 'Himpunan Prodi', 'LEM', 'UKM Universitas', 'UKM Fakultas', 'Organisasi Eksternal'],
      labels: {'Himpunan Prodi': 'Himpunan prodi', 'UKM Universitas': 'UKM universitas', 'UKM Fakultas': 'UKM fakultas', 'Organisasi Eksternal': 'Organisasi eksternal'},
      sub: (rows) => nf.format(rows.filter(ok).length) + ' IG terverifikasi',
      tiles: '#tiles', cari: '#cari', semua: '#semua', kosong: '#org-kosong', table: '#tabel-org',
      cari_di: ['nama', 'kelompok', 'kategori', 'fakultas', 'ig_handle', 'catatan'],
      cols: [
        {key: 'id', label: 'ID'}, {key: 'kelompok', label: 'Kelompok'}, {key: 'nama', label: 'Nama'},
        {key: 'kategori', label: 'Jenis'}, {key: 'fakultas', label: 'Fakultas'},
        {key: 'ig_handle', label: 'Instagram', link: 'ig_url'}, {key: 'status_ig', label: 'Status IG', chip: true},
        {key: 'sumber', label: 'Sumber', link: 'sumber_url'}, {key: 'catatan', label: 'Catatan'}
      ]
    }), '#organisasi');

    safe(() => filterable({
      data: prodi, key: 'jenjang', grup: ['Sarjana', 'Sarjana Terapan', 'Diploma Tiga', 'Profesi', 'Magister', 'Doktor'],
      labels: {'Sarjana Terapan': 'Sarjana terapan', 'Diploma Tiga': 'Diploma tiga'},
      tiles: '#tiles-prodi', cari: '#cari-prodi', semua: '#semua-prodi', kosong: '#prodi-kosong', table: '#tabel-prodi',
      cari_di: ['fakultas', 'jenjang', 'prodi', 'catatan'],
      cols: [
        {key: 'id', label: 'ID'}, {key: 'fakultas', label: 'Fakultas'}, {key: 'jenjang', label: 'Jenjang'},
        {key: 'prodi', label: 'Program studi'}, {key: 'program_internasional', label: 'Program internasional'},
        {key: 'website', label: 'Situs', link: 'website_url'},
        {key: 'ig_handle', label: 'Instagram', link: 'ig_url'}, {key: 'status_ig', label: 'Status IG', chip: true},
        {key: 'sumber', label: 'Sumber', link: 'sumber_url'}, {key: 'catatan', label: 'Catatan'}
      ]
    }), '#prodi');
    setText('#prodi-tercatat', nf.format(prodi.length));
    const m12p = by('m12');
    if (m12p) setText('#prodi-resmi', nf.format(m12p.jumlah));

    // direktorat
    const dirCols = [
      {key: 'id', label: 'ID'}, {key: 'nama', label: 'Direktorat'}, {key: 'peran', label: 'Fungsi'}, {key: 'kontak', label: 'Kontak'},
      {key: 'ig_handle', label: 'Instagram', link: 'ig_url'}, {key: 'status_ig', label: 'Status IG', chip: true},
      {key: 'peran_untuk_dopa', label: 'Kegunaan untuk Dopa'}, {key: 'sumber', label: 'Sumber', link: 'sumber_url'}, {key: 'catatan', label: 'Catatan'}
    ];
    safe(() => {
      const tDir = $('#tabel-dir');
      buildHead(tDir, dirCols);
      fillBody(tDir, dirCols, dir);
    }, '#direktorat');

    // mahasiswa
    const m11 = by('m11'), m10 = by('m10'), m05 = by('m05'), m12 = by('m12'), m13 = by('m13');
    if (m02) { setText('#st-aktif', nf.format(m02.jumlah)); setText('#st-aktif-periode', m02.periode); }
    if (m11) { setText('#st-maba', nf.format(m11.jumlah)); setText('#st-maba-label', m11.label); }
    if (m11 && m10) setText('#st-maba-delta', deltaf.format(m11.jumlah / m10.jumlah - 1));
    if (m05 && m02) setText('#st-s1', pctf.format(m05.jumlah / m02.jumlah));
    if (m12) setText('#st-prodi', nf.format(m12.jumlah));
    if (m13) setText('#st-unggul', nf.format(m13.jumlah));
    bars($('#grafik-jenjang'), mhs.filter((r) => r.kelompok === 'Jenjang').sort((a, b) => b.jumlah - a.jumlah), 'max');
    bars($('#grafik-maba'), mhs.filter((r) => r.kelompok === 'Mahasiswa baru'), 'last');

    // acara GOR
    const gorCols = [
      {key: 'id', label: 'ID'}, {key: 'tanggal', label: 'Tanggal'}, {key: 'acara', label: 'Acara'},
      {key: 'jenis', label: 'Jenis'}, {key: 'peserta', label: 'Peserta'}
    ];
    if (CONFIG.tampilkanPeluang) {
      gorCols.push({key: 'peluang_dopa', label: 'Peluang untuk Dopa'});
      setText('#note-gor', 'Rekap awal dari berita dan situs UII, belum dari data peminjaman GOR. Kolom peluang adalah saran tim, bukan data.');
    }
    gorCols.push({key: 'status_data', label: 'Status data'}, {key: 'sumber', label: 'Sumber', link: 'sumber_url'});
    const tGor = $('#tabel-gor');
    buildHead(tGor, gorCols);
    fillBody(tGor, gorCols, gor.slice().sort((a, b) => a.tanggal_mulai.localeCompare(b.tanggal_mulai)));

    // data yang masih kosong
    if (CONFIG.tampilkanCelah) {
      const celahCols = [
        {key: 'id', label: 'ID'}, {key: 'bidang', label: 'Bidang'}, {key: 'kebutuhan', label: 'Yang dibutuhkan'},
        {key: 'cara_memperoleh', label: 'Cara mendapatkan'}, {key: 'prioritas', label: 'Prioritas'}, {key: 'status', label: 'Status', chip: true}
      ];
      const tCelah = $('#tabel-celah');
      buildHead(tCelah, celahCols);
      fillBody(tCelah, celahCols, celah);
    } else {
      $('#celah').hidden = true;
      $('#nav-celah').hidden = true;
    }
  }

  main().catch((e) => {
    console.error(e);
    const g = $('#galat');
    g.hidden = false;
    g.textContent = 'Terjadi galat saat menampilkan data: ' + e.message;
  });
})();
