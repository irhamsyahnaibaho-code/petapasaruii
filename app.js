(() => {
  // Pengaturan: ubah ke false untuk menyembunyikan bagian ini di situs publik.
  const CONFIG = {
    tampilkanPeluang: true, // kolom "Peluang untuk Dopa" di tabel acara GOR
    tampilkanCelah: true    // bagian "Yang masih kosong"
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

  const load = async (name) => {
    const res = await fetch('data/' + name + '.csv', {cache: 'no-cache'});
    if (!res.ok) throw new Error('Gagal memuat ' + name);
    return parseCSV(await res.text());
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
    let org, mhs, gor, celah;
    try {
      [org, mhs, gor, celah] = await Promise.all([load('organisasi'), load('mahasiswa'), load('acara_gor'), load('celah')]);
    } catch (e) {
      const g = $('#galat');
      g.hidden = false;
      g.textContent = 'Data belum bisa dimuat. Buka situs ini lewat alamat web (misalnya GitHub Pages), bukan dengan klik dua kali file index.html.';
      return;
    }
    mhs.forEach((r) => { r.jumlah = Number(r.jumlah); });
    const by = (id) => mhs.find((r) => r.id === id);

    // ringkasan organisasi
    const kelompok = ['Fakultas', 'Himpunan Prodi', 'LEM', 'UKM Universitas', 'UKM Fakultas', 'Organisasi Eksternal'];
    const labels = {'Himpunan Prodi': 'Himpunan prodi', 'UKM Universitas': 'UKM universitas', 'UKM Fakultas': 'UKM fakultas', 'Organisasi Eksternal': 'Organisasi eksternal'};
    const ok = (r) => r.status_ig === 'Terverifikasi';
    setText('#lede-org', nf.format(org.length));
    setText('#lede-ig', nf.format(org.filter(ok).length));
    const m02 = by('m02');
    if (m02) { setText('#lede-mhs', nf.format(m02.jumlah)); setText('#lede-periode', m02.periode); }

    const state = {kel: 'Semua', q: ''};
    const tiles = $('#tiles');
    const tileEls = kelompok.map((k) => {
      const rows = org.filter((r) => r.kelompok === k);
      const b = mk('button', 'tile');
      b.type = 'button';
      b.setAttribute('aria-pressed', 'false');
      b.append(mk('span', 'lab', labels[k] || k), mk('span', 'big', nf.format(rows.length)), mk('span', 'sub', nf.format(rows.filter(ok).length) + ' IG terverifikasi'));
      b.addEventListener('click', () => { state.kel = state.kel === k ? 'Semua' : k; renderOrg(); });
      tiles.append(b);
      return [k, b];
    });

    const orgCols = [
      {key: 'id', label: 'ID'}, {key: 'kelompok', label: 'Kelompok'}, {key: 'nama', label: 'Nama'},
      {key: 'kategori', label: 'Jenis'}, {key: 'fakultas', label: 'Fakultas'},
      {key: 'ig_handle', label: 'Instagram', link: 'ig_url'}, {key: 'status_ig', label: 'Status IG', chip: true},
      {key: 'sumber', label: 'Sumber', link: 'sumber_url'}, {key: 'catatan', label: 'Catatan'}
    ];
    const tOrg = $('#tabel-org');
    buildHead(tOrg, orgCols);
    const semua = $('#semua'), cari = $('#cari');
    function renderOrg() {
      const q = state.q.trim().toLowerCase();
      const rows = org.filter((r) => (state.kel === 'Semua' || r.kelompok === state.kel) &&
        (!q || [r.nama, r.kelompok, r.kategori, r.fakultas, r.ig_handle, r.catatan].join(' ').toLowerCase().includes(q)));
      fillBody(tOrg, orgCols, rows);
      $('#org-kosong').hidden = rows.length > 0;
      tileEls.forEach(([k, b]) => b.setAttribute('aria-pressed', String(k === state.kel)));
      semua.hidden = state.kel === 'Semua' && !q;
    }
    cari.addEventListener('input', () => { state.q = cari.value; renderOrg(); });
    semua.addEventListener('click', () => { state.kel = 'Semua'; state.q = ''; cari.value = ''; renderOrg(); });
    renderOrg();

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

  main();
})();
