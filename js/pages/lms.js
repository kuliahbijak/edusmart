/* Modul D — LMS: daftar kelas, ruang kelas (materi, tugas, koreksi), buku nilai terpadu; tampilan siswa & wali. */
(function () {
  const x = ES.x, ic = ES.ic;
  const IKON_MATERI = { Video: 'smart_display', PDF: 'picture_as_pdf', Slide: 'slideshow', Tautan: 'link', Teks: 'article' };
  const WARNA_KELAS = ['#2563eb', '#0d9488', '#7c3aed', '#db2777', '#ea580c', '#0891b2', '#4f46e5', '#16a34a'];
  function warna(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return WARNA_KELAS[h % WARNA_KELAS.length]; }

  // ---------------- daftar kelas (guru) ----------------
  ES.hal('lms', { judul: 'LMS & Kelas', peran: ['SUPER_ADMIN', 'KEPSEK', 'KURIKULUM', 'GURU', 'WALI_KELAS'], render: function (el, p, masih) {
    el.innerHTML = '<div class="jdl-hal"><div><h1>LMS & Kelas</h1><p>Ruang kelas digital, materi, tugas, dan buku nilai.</p></div></div><div id="lmTabs"></div><div id="lmIsi">' + ES.skeleton(3, 120) + '</div>';
    const tab = p[0] === 'koreksi' ? 'koreksi' : 'kelas';
    ES.tabs(ES.$('#lmTabs'), [['kelas', 'Kelas saya', 'school'], ['koreksi', 'Antrean koreksi', 'rate_review']], tab, function (t) { ES.buka('lms' + (t === 'koreksi' ? '/koreksi' : '')); });
    const isi = ES.$('#lmIsi');
    if (tab === 'koreksi') return ES.baca('lms.antrean', {}, function (d) {
      if (!masih()) return;
      isi.innerHTML = '<div class="kartu">' + ES.tabel([{ l: 'Siswa', f: function (r) { return '<b>' + x(r.nama) + '</b><div class="sub">' + x(r.kelas) + '</div>'; } }, { l: 'Tugas', f: function (r) { return x(r.judulTugas) + '<div class="sub">' + x(ES.namaMapel(r.mapel)) + '</div>'; } }, { l: 'Dikirim', f: function (r) { return ES.relatif(r.waktu_kirim) + (r.status === 'Terlambat' ? ' <span class="bdg kuning">Terlambat</span>' : ''); } }, { l: '', f: function (r) { return '<a class="btn p kc" href="#/kelas/' + r.idKelas + '/' + r.mapel + '/tugas/' + r.id_tugas + '">Beri nilai</a>'; } }], d, { kosong: 'Tidak ada pengumpulan yang menunggu nilai', kosongIkon: 'task_alt' }) + '</div>';
    });
    return ES.baca('lms.kelasSaya', {}, function (d) {
      if (!masih()) return;
      if (!d.length) { isi.innerHTML = '<div class="kartu">' + ES.kosong('Belum ada kelas', 'Minta Waka Kurikulum / admin menambahkan data pengampu (guru – mapel – kelas).', 'school') + '</div>'; return; }
      isi.innerHTML = '<div class="grid g3">' + d.map(function (k) { const w = warna(k.mapel + k.kelas); return '<a class="kartu klik" style="text-decoration:none;color:inherit;overflow:hidden" href="#/kelas/' + k.kelas + '/' + k.mapel + '"><div style="height:84px;background:linear-gradient(135deg,' + w + ',' + w + 'cc);color:#fff;padding:16px 20px;position:relative"><div class="label-sm" style="color:rgba(255,255,255,.8)">' + x(k.namaKelas) + (k.wali ? ' · perwalian' : '') + '</div><h3 style="color:#fff;margin-top:4px" class="trunc">' + x(k.namaMapel) + '</h3><div style="position:absolute;right:16px;bottom:-22px" class="av l">' + x(ES.inisial(k.guru)) + '</div></div><div class="kp" style="padding-top:28px"><div class="redup kecil">' + x(k.guru) + '</div><div class="baris mt-s"><span class="bdg biru">' + ic('library_books', 's') + k.materi + ' materi</span><span class="bdg ' + (k.tugasAktif ? 'kuning' : '') + '">' + ic('assignment', 's') + k.tugasAktif + ' tugas aktif</span></div></div></a>'; }).join('') + '</div>';
    }, { ttl: 30000 });
  } });

  // ---------------- ruang kelas ----------------
  ES.hal('kelas', { judul: 'Ruang Kelas', render: function (el, p, masih) {
    const kelas = p[0], mapel = p[1], tab = p[2] || 'materi', siswa = (ES.s.me || {}).tipe === 'siswa';
    if (p[2] === 'tugas' && p[3]) return detailTugas(el, kelas, mapel, p[3], masih);
    el.innerHTML = '<div class="remah"><a href="#/' + (siswa ? 'kelas-saya' : 'lms') + '">LMS & Kelas</a>' + ic('chevron_right', 's') + x(ES.namaMapel(mapel)) + ic('chevron_right', 's') + x(ES.namaKelas(kelas) || 'Kelas') + '</div><div id="rkIsi">' + ES.skeleton(4, 90) + '</div>';
    return ES.baca('lms.ruang', { kelas: kelas, mapel: mapel }, function (d) { if (masih()) gambar(d); }, { ttl: 15000 });
    function gambar(d) {
      const bisa = d.bisaUbah, aktif = d.tugas.filter(function (t) { return t.status !== 'Draf' && t.deadline >= new Date().toISOString().slice(0, 16); });
      const jml = {}; d.materi.forEach(function (m) { jml[m.tipe] = (jml[m.tipe] || 0) + 1; });
      const kum = d.tugas.reduce(function (a, t) { return a + (t.terkumpul || 0); }, 0), harap = d.tugas.filter(function (t) { return t.status !== 'Draf'; }).length * d.nSiswa;
      let h = '<div class="jdl-hal"><div><h1>Ruang Kelas Digital: ' + x(ES.namaMapel(mapel)) + '</h1><p>' + ic('groups', 's') + ' ' + x(ES.namaKelas(kelas)) + ' · ' + d.nSiswa + ' siswa terdaftar</p></div><div class="aksi">' +
        (!siswa ? '<a class="btn s" href="#/nilai/' + kelas + '/' + mapel + '">' + ic('menu_book') + 'Buku Nilai</a>' : '') + (bisa ? '<button class="btn s" id="tbTugas">' + ic('add_task') + 'Buat Tugas</button><button class="btn p" id="tbMateri">' + ic('add') + 'Tambah Materi</button>' : '') + '</div></div>';
      if (!siswa) h += '<div class="grid g4 mb">' + [['library_books', 'w-biru', d.materi.length, 'Materi terbit', Object.keys(jml).map(function (k) { return jml[k] + ' ' + k; }).join(' · ')], ['pending_actions', 'w-kuning', aktif.length, 'Tugas aktif berjalan', d.tugas.length + ' total tugas'], ['assignment_turned_in', 'w-teal', harap ? Math.round(kum / harap * 100) + '%' : '–', 'Tingkat pengumpulan', kum + ' pengumpulan'], ['rate_review', 'w-merah', d.antrean.length, 'Antrean koreksi', d.rerataTugas !== null ? 'Rerata tugas ' + ES.fAngka(d.rerataTugas) : '']].map(function (k) { return '<div class="kartu kpi"><div class="ik ' + k[1] + '">' + ic(k[0]) + '</div><div><div class="l">' + k[3] + '</div><div class="v">' + k[2] + '</div><div class="t redup">' + x(k[4]) + '</div></div></div>'; }).join('') + '</div>';
      h += '<div id="rkTabs"></div><div id="rkPanel"></div>';
      ES.$('#rkIsi').innerHTML = h;
      const tabs = [['materi', 'Alur pembelajaran & materi', 'view_timeline'], ['tugas', 'Tugas & penugasan', 'assignment']]; if (!siswa) tabs.push(['koreksi', 'Antrean koreksi', 'bolt', d.antrean.length || '']);
      let t = tab; ES.tabs(ES.$('#rkTabs'), tabs, t, function (z) { t = z; panel(); });
      function panel() { const pn = ES.$('#rkPanel'); if (t === 'materi') pn.innerHTML = panelMateri(d, bisa); else if (t === 'tugas') pn.innerHTML = panelTugas(d, bisa, siswa); else pn.innerHTML = '<div class="kartu">' + ES.tabel([{ l: 'Siswa', f: function (r) { return '<b>' + x(r.nama) + '</b>'; } }, { l: 'Tugas', k: 'judulTugas' }, { l: 'Dikirim', f: function (r) { return ES.fTglJam(r.waktu_kirim) + (r.terlambat ? ' <span class="bdg kuning">Terlambat</span>' : ''); } }, { l: '', f: function (r) { return '<a class="btn p kc" href="#/kelas/' + kelas + '/' + mapel + '/tugas/' + r.id_tugas + '">Nilai</a>'; } }], d.antrean, { kosong: 'Semua sudah dinilai', kosongIkon: 'task_alt' }) + '</div>'; ikat(pn, d); }
      panel();
      if (bisa) { ES.$('#tbMateri').onclick = function () { formMateri(kelas, mapel, null, d); }; ES.$('#tbTugas').onclick = function () { formTugas(kelas, mapel, null); }; }
    }
    function ikat(pn, d) {
      ES.$$('[data-em]', pn).forEach(function (b) { b.onclick = function () { formMateri(kelas, mapel, d.materi.filter(function (m) { return m.id === b.dataset.em; })[0], d); }; });
      ES.$$('[data-hm]', pn).forEach(function (b) { b.onclick = function () { ES.konfirmasi('Hapus materi ini?', { bahaya: true }).then(function (ok) { if (ok) ES.tulisPesan('lms.materi.hapus', { id: b.dataset.hm }, { bersih: ['lms.'] }).then(ES.render); }); }; });
      ES.$$('[data-et]', pn).forEach(function (b) { b.onclick = function () { formTugas(kelas, mapel, d.tugas.filter(function (z) { return z.id === b.dataset.et; })[0]); }; });
      ES.$$('[data-ht]', pn).forEach(function (b) { b.onclick = function () { ES.konfirmasi('Hapus tugas beserta nilainya dari buku nilai?', { bahaya: true }).then(function (ok) { if (ok) ES.tulisPesan('lms.tugas.hapus', { id: b.dataset.ht }, { bersih: ['lms.', 'nilai.'] }).then(ES.render); }); }; });
      ES.$$('[data-unduh]', pn).forEach(function (b) { b.onclick = function () { ES.sibuk(b, function () { return ES.api('file.unduh', { id: b.dataset.unduh, konteks: { tabel: 'Materi', id: b.dataset.m } }).then(function (f) { if (f.besar) window.open(f.url, '_blank'); else ES.unduhB64(f.nama, f.mime, f.b64); }); }).catch(function (e) { ES.toast(e.message, 'err'); }); }; });
      ES.$$('[data-kumpul]', pn).forEach(function (b) { b.onclick = function () { formKumpul(d.tugas.filter(function (z) { return z.id === b.dataset.kumpul; })[0]); }; });
    }
  } });
  function panelMateri(d, bisa) {
    if (!d.materi.length) return '<div class="kartu">' + ES.kosong('Belum ada materi', bisa ? 'Klik "Tambah Materi" untuk menambahkan video YouTube, PDF, slide, atau tautan.' : 'Guru belum menerbitkan materi.', 'library_books') + '</div>';
    const unit = {}; d.materi.forEach(function (m) { const u = m.unit || 'Materi umum'; (unit[u] = unit[u] || []).push(m); });
    return Object.keys(unit).map(function (u, i) {
      return '<div class="kartu mb"><div class="kp-hd"><div class="baris"><span class="bdg biru">' + String(i + 1).padStart(2, '0') + '</span><h3>' + x(u) + '</h3></div><span class="redup kecil">' + unit[u].length + ' materi</span></div><div class="kp grid g2">' + unit[u].map(function (m) {
        const media = m.embed && (m.tipe === 'Video' || m.tipe === 'Slide' || m.tipe === 'PDF') ? '<div style="aspect-ratio:16/9;border-radius:10px;overflow:hidden;background:#000;margin-bottom:10px"><iframe src="' + x(m.embed) + '" loading="lazy" style="width:100%;height:100%;border:0" allow="encrypted-media; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>' : '';
        return '<div class="kartu" style="padding:14px">' + media + '<div class="baris" style="flex-wrap:nowrap;align-items:flex-start"><div class="ik w-biru" style="width:36px;height:36px;border-radius:10px;display:grid;place-items:center;flex:none">' + ic(IKON_MATERI[m.tipe] || 'article') + '</div><div style="flex:1;min-width:0"><b>' + x(m.judul) + '</b>' + (m.status === 'Draf' ? ' <span class="bdg">Draf</span>' : '') + '<div class="redup kecil">' + x(m.tipe) + '</div>' + (m.deskripsi ? '<p class="kecil" style="margin:6px 0 0;white-space:pre-wrap">' + x(m.deskripsi) + '</p>' : '') + '<div class="baris mt-s">' +
          (m.url_embed && m.tipe === 'Tautan' ? '<a class="btn s kc" href="' + x(m.url_embed) + '" target="_blank" rel="noopener">' + ic('open_in_new', 's') + 'Buka</a>' : '') + (m.id_drive ? '<button class="btn s kc" data-unduh="' + x(m.id_drive) + '" data-m="' + m.id + '">' + ic('download', 's') + 'Unduh</button>' : '') +
          (bisa ? '<button class="btn g kc ik-s" data-em="' + m.id + '" title="Ubah">' + ic('edit', 's') + '</button><button class="btn g kc ik-s" data-hm="' + m.id + '" title="Hapus">' + ic('delete', 's') + '</button>' : '') + '</div></div></div></div>';
      }).join('') + '</div></div>';
    }).join('');
  }
  function panelTugas(d, bisa, siswa) {
    if (!d.tugas.length) return '<div class="kartu">' + ES.kosong('Belum ada tugas', bisa ? 'Klik "Buat Tugas".' : '', 'assignment') + '</div>';
    const now = new Date().toISOString().slice(0, 16);
    return '<div class="kolom">' + d.tugas.map(function (t) {
      const lewat = t.deadline < now, s = t.saya;
      return '<div class="kartu"><div class="kp"><div class="baris antar" style="align-items:flex-start"><div style="min-width:0;flex:1"><div class="baris"><span class="bdg ' + (lewat ? '' : 'kuning') + '">' + ic('schedule', 's') + (lewat ? 'Ditutup ' : 'Tenggat ') + ES.fTglJam(t.deadline) + '</span><span class="bdg biru">' + x(t.komponen) + '</span>' + (t.status === 'Draf' ? '<span class="bdg">Draf</span>' : '') + '</div><h3 class="mt-s">' + x(t.judul) + '</h3>' + (t.instruksi ? '<p class="redup" style="white-space:pre-wrap;margin:6px 0 0">' + x(t.instruksi) + '</p>' : '') + '</div>' +
        (siswa ? '<div style="text-align:right;min-width:150px">' + (s ? ES.bdgStatus(s.status) + (s.status === 'Dinilai' ? '<div style="font:700 28px var(--f-judul)" class="mt-s">' + s.nilai + '</div>' + (s.feedback ? '<div class="redup kecil">“' + x(s.feedback) + '”</div>' : '') : '<div class="redup kecil mt-s">Dikirim ' + ES.relatif(s.waktu_kirim) + '</div>') : '<span class="bdg">Belum dikumpulkan</span>') + (!lewat && (!s || s.status !== 'Dinilai') ? '<div class="mt-s"><button class="btn p kc" data-kumpul="' + t.id + '">' + ic('upload', 's') + (s ? 'Kirim ulang' : 'Kumpulkan') + '</button></div>' : '') + '</div>'
          : '<div style="min-width:220px"><div class="baris antar kecil"><span>Terkumpul ' + t.terkumpul + '/' + (t.terkumpul + t.belum) + '</span><span>Dinilai ' + t.dinilai + '</span></div><div class="prog teal mt-s"><i style="width:' + ((t.terkumpul + t.belum) ? Math.round(t.terkumpul / (t.terkumpul + t.belum) * 100) : 0) + '%"></i></div><div class="baris mt-s"><a class="btn p kc" href="#/kelas/' + t.id_kelas + '/' + t.id_mapel + '/tugas/' + t.id + '">' + ic('rate_review', 's') + 'Pengumpulan</a>' + (bisa ? '<button class="btn g kc ik-s" data-et="' + t.id + '">' + ic('edit', 's') + '</button><button class="btn g kc ik-s" data-ht="' + t.id + '">' + ic('delete', 's') + '</button>' : '') + '</div></div>') +
        '</div></div></div>';
    }).join('') + '</div>';
  }
  function formMateri(kelas, mapel, m, d) {
    const unit = Array.from(new Set((d.materi || []).map(function (z) { return z.unit; }).filter(Boolean)));
    let berkas = null;
    ES.dialogForm({ judul: m ? 'Ubah materi' : 'Tambah materi', lebar: true, nilai: m || { tipe: 'Video', status: 'Terbit' },
      bidang: [{ k: 'unit', l: 'Unit / bab', ph: 'mis. Unit 1 · Teks Editorial', bantu: unit.length ? 'Unit yang ada: ' + unit.join(', ') : '' }, { k: 'tipe', l: 'Jenis materi', t: 'select', o: ['Video', 'PDF', 'Slide', 'Tautan', 'Teks'], kosong: false }, { k: 'judul', l: 'Judul', req: true, w: true }, { k: 'deskripsi', l: 'Deskripsi / petunjuk', t: 'textarea', w: true },
        { k: 'url_embed', l: 'Tautan (YouTube / Google Slides / Drive / web)', w: true, ph: 'https://…' }, { html: '<div class="fld"><label>Atau unggah berkas (PDF/PPT/DOC)</label><input type="file" class="inp" id="mtBerkas" style="padding-top:7px"><span class="bantu" id="mtProg">' + (m && m.nama_berkas ? 'Berkas saat ini: ' + x(m.nama_berkas) : '') + '</span></div>', w: true }, { k: 'status', l: 'Status', t: 'select', o: [['Terbit', 'Terbitkan ke siswa'], ['Draf', 'Simpan sebagai draf']], kosong: false }],
      setelah: function (lp) { const f = ES.$('#mtBerkas', lp); f.onchange = function () { berkas = f.files[0]; }; },
      simpan: function (v) {
        const kirim = function (up) { const o = Object.assign({}, v, { id: m ? m.id : '', id_kelas: kelas, id_mapel: mapel }); if (up) { o.id_drive = up.id; o.nama_berkas = up.nama; } else if (m) { o.id_drive = m.id_drive; o.nama_berkas = m.nama_berkas; } return ES.tulisPesan('lms.materi.save', o, { bersih: ['lms.'] }).then(function () { ES.render(); }); };
        if (berkas) return ES.unggah(berkas, 'materi', function (pr) { const e = ES.$('#mtProg'); if (e) e.textContent = 'Mengunggah ' + pr + '%…'; }).then(kirim, function (e) { ES.toast(e.message, 'err'); return false; });
        return kirim(null);
      } });
  }
  function formTugas(kelas, mapel, t) {
    const besok = ES.tambahHari(ES.hariIni(), 7) + 'T23:59';
    ES.dialogForm({ judul: t ? 'Ubah tugas' : 'Buat tugas', lebar: true, nilai: t || { deadline: besok, komponen: 'Tugas', tipe_pengumpulan: 'Berkas', bobot: 1 },
      bidang: [{ k: 'judul', l: 'Judul tugas', req: true, w: true }, { k: 'instruksi', l: 'Instruksi', t: 'textarea', w: true, rows: 5 }, { k: 'deadline', l: 'Tenggat', t: 'datetime-local', req: true }, { k: 'komponen', l: 'Komponen nilai', t: 'select', o: ['Tugas', 'UH', 'UTS', 'UAS', 'Proyek', 'Lainnya'], kosong: false }, { k: 'tipe_pengumpulan', l: 'Bentuk pengumpulan', t: 'select', o: [['Berkas', 'Unggah berkas'], ['Teks', 'Jawaban teks'], ['Tautan', 'Tautan (Drive/Docs/web)']], kosong: false }, { k: 'bobot', l: 'Bobot dalam komponen', t: 'number', min: 1, max: 100, bantu: 'Relatif terhadap tugas lain di komponen yang sama.' }, { k: 'status', l: 'Status', t: 'select', o: [['Terbit', 'Terbitkan & beri tahu siswa'], ['Draf', 'Draf']], kosong: false }],
      simpan: function (v) { return ES.tulisPesan('lms.tugas.save', Object.assign({}, v, { id: t ? t.id : '', id_kelas: kelas, id_mapel: mapel }), { bersih: ['lms.', 'nilai.', 'dash.'] }).then(function () { ES.render(); }); } });
  }
  function formKumpul(t) {
    let berkas = null;
    const bidang = t.tipe_pengumpulan === 'Teks' ? [{ k: 'teks', l: 'Jawaban', t: 'textarea', rows: 8, req: true, w: true }] : t.tipe_pengumpulan === 'Tautan' ? [{ k: 'tautan', l: 'Tautan jawaban', req: true, w: true, ph: 'https://docs.google.com/…' }, { k: 'teks', l: 'Catatan (opsional)', t: 'textarea', w: true }] : [{ html: '<div class="fld"><label>Berkas jawaban <span class="wajib">*</span></label><input type="file" class="inp" id="kmBerkas" style="padding-top:7px"><span class="bantu" id="kmProg">Maks. ' + t.maks_mb + ' MB</span></div>', w: true }, { k: 'teks', l: 'Catatan (opsional)', t: 'textarea', w: true }];
    ES.dialogForm({ judul: 'Kumpulkan: ' + t.judul, sub: 'Tenggat ' + ES.fTglJam(t.deadline), bidang: bidang, ok: 'Kirim', ikonOk: 'send', kelas: 'satu',
      setelah: function (lp) { const f = ES.$('#kmBerkas', lp); if (f) f.onchange = function () { berkas = f.files[0]; }; },
      simpan: function (v) {
        const kirim = function (up) { return ES.tulisPesan('lms.kumpul', { tugasId: t.id, teks: v.teks, tautan: v.tautan, fileId: up ? up.id : '', namaBerkas: up ? up.nama : '' }, { bersih: ['lms.', 'dash.'] }).then(function () { ES.render(); }); };
        if (t.tipe_pengumpulan === 'Berkas') { if (!berkas) { ES.toast('Pilih berkas terlebih dulu.', 'warn'); return false; } return ES.unggah(berkas, 'tugas', function (p) { const e = ES.$('#kmProg'); if (e) e.textContent = 'Mengunggah ' + p + '%…'; }).then(kirim, function (e) { ES.toast(e.message, 'err'); return false; }); }
        return kirim(null);
      } });
  }
  function detailTugas(el, kelas, mapel, tid, masih) {
    el.innerHTML = '<div class="remah"><a href="#/lms">LMS</a>' + ic('chevron_right', 's') + '<a href="#/kelas/' + kelas + '/' + mapel + '/tugas">' + x(ES.namaMapel(mapel)) + ' · ' + x(ES.namaKelas(kelas)) + '</a>' + ic('chevron_right', 's') + 'Pengumpulan</div><div id="dtIsi">' + ES.skeleton(6) + '</div>';
    return ES.api('lms.pengumpulan', { tugasId: tid }).then(function (d) {
      if (!masih()) return;
      const t = d.tugas, sudah = d.rows.filter(function (r) { return r.kumpul && r.kumpul.waktu_kirim; }).length;
      ES.$('#dtIsi').innerHTML = '<div class="jdl-hal"><div><h1>' + x(t.judul) + '</h1><p>Tenggat ' + ES.fTglJam(t.deadline) + ' · ' + x(t.komponen) + ' · ' + sudah + '/' + d.rows.length + ' terkumpul</p></div><div class="aksi"><button class="btn p" id="dtSimpan">' + ic('save') + 'Simpan nilai</button></div></div>' +
        '<div class="kartu">' + ES.tabel([{ l: 'Siswa', f: function (r) { return '<b>' + x(r.nama) + '</b><div class="sub">No. ' + r.absen + ' · ' + x(r.nis) + '</div>'; } },
          { l: 'Jawaban', f: function (r) { const k = r.kumpul; if (!k || !k.waktu_kirim) return '<span class="bdg">Belum mengumpulkan</span>'; return (k.id_berkas ? '<button class="btn s kc" data-ub="' + k.id_berkas + '" data-kid="' + k.id + '">' + ic('download', 's') + x(String(k.nama_berkas || 'berkas').slice(0, 26)) + '</button> ' : '') + (k.tautan ? '<a href="' + x(k.tautan) + '" target="_blank" rel="noopener">' + ic('link', 's') + 'Tautan</a> ' : '') + (k.teks ? '<button class="btn g kc" data-teks="' + r.siswaId + '">' + ic('article', 's') + 'Lihat teks</button>' : '') + '<div class="sub">' + ES.fTglJam(k.waktu_kirim) + (k.status === 'Terlambat' ? ' · <b style="color:var(--kuning-x)">terlambat</b>' : '') + '</div>'; } },
          { l: 'Nilai', f: function (r) { return '<input class="inp num" type="number" min="0" max="100" step="0.5" style="width:90px;text-align:right" data-n="' + r.siswaId + '" value="' + (r.kumpul && r.kumpul.nilai !== '' ? r.kumpul.nilai : '') + '">'; } },
          { l: 'Umpan balik', f: function (r) { return '<input class="inp" style="min-width:200px" data-fb="' + r.siswaId + '" value="' + x(r.kumpul ? r.kumpul.feedback || '' : '') + '" placeholder="Catatan untuk siswa">'; } }], d.rows, { reflow: true }) + '</div>';
      ES.$$('[data-ub]').forEach(function (b) { b.onclick = function () { ES.sibuk(b, function () { return ES.api('file.unduh', { id: b.dataset.ub, konteks: { tabel: 'Pengumpulan', id: b.dataset.kid, tugas: tid } }).then(function (f) { if (f.besar) window.open(f.url, '_blank'); else if (/pdf|image/.test(f.mime)) ES.bukaB64(f.mime, f.b64); else ES.unduhB64(f.nama, f.mime, f.b64); }); }).catch(function (e) { ES.toast(e.message, 'err'); }); }; });
      ES.$$('[data-teks]').forEach(function (b) { b.onclick = function () { const r = d.rows.filter(function (z) { return z.siswaId === b.dataset.teks; })[0]; ES.modal({ judul: 'Jawaban ' + r.nama, isi: '<div style="white-space:pre-wrap;line-height:22px">' + x(r.kumpul.teks) + '</div>' }); }; });
      ES.$$('[data-n]').forEach(function (i) { i.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); const all = ES.$$('[data-n]'), k = all.indexOf(i); if (all[k + 1]) all[k + 1].focus(); } }); });
      ES.$('#dtSimpan').onclick = function () {
        const items = []; let salah = '';
        ES.$$('[data-n]').forEach(function (i) { const sid = i.dataset.n, r = d.rows.filter(function (z) { return z.siswaId === sid; })[0], v = i.value, fb = ES.$('[data-fb="' + sid + '"]').value; const lama = r.kumpul ? r.kumpul.nilai : ''; if (String(v) !== String(lama === undefined ? '' : lama) || (r.kumpul && fb !== (r.kumpul.feedback || ''))) { if (v !== '' && (+v < 0 || +v > 100)) salah = 'Nilai harus 0–100.'; items.push({ tugasId: tid, siswaId: sid, nilai: v === '' ? '' : +v, feedback: fb }); } });
        if (salah) return ES.toast(salah, 'warn'); if (!items.length) return ES.toast('Tidak ada perubahan nilai.', 'info');
        ES.sibuk(this, function () { return ES.tulisPesan('lms.nilai', { items: items }, { bersih: ['lms.', 'nilai.', 'dash.'] }).then(function () { detailTugas(el, kelas, mapel, tid, masih); }); });
      };
    });
  }

  // ---------------- buku nilai ----------------
  ES.hal('nilai', { judul: 'Buku Nilai', peran: ['SUPER_ADMIN', 'KEPSEK', 'KURIKULUM', 'GURU', 'WALI_KELAS'], lebar: true, render: function (el, p, masih) {
    const amp = ES.ampuan(), kelas = p[0] || (amp[0] || {}).kelas || ((ES.s.me.kelasWali || [])[0]) || '', mapel = p[1] || (amp.filter(function (a) { return a.kelas === kelas; })[0] || {}).mapel || '';
    const kelasOps = ES.kelasSaya(), mapelOps = ES.master().mapel;
    el.innerHTML = '<div class="remah"><a href="#/lms">LMS & Kelas</a>' + ic('chevron_right', 's') + 'Buku Nilai Terpadu</div><div class="jdl-hal"><div><h1>Buku Nilai Siswa & Rekapitulasi</h1><p>Nilai tugas & CBT masuk otomatis · nilai akhir dihitung dari bobot kategori</p></div><div class="aksi"><button class="btn s" id="bnXls">' + ic('table_view') + 'Excel</button><button class="btn s" id="bnPdf">' + ic('picture_as_pdf') + 'PDF</button><button class="btn s" id="bnBobot">' + ic('tune') + 'Bobot & KKM</button><button class="btn p" id="bnKolom">' + ic('add') + 'Kolom nilai</button></div></div>' +
      '<div class="kartu mb"><div class="kp baris"><div class="fld"><label>Rombongan belajar</label><select class="inp" id="bnK">' + kelasOps.map(function (k) { return '<option value="' + k.id + '"' + (k.id === kelas ? ' selected' : '') + '>' + x(k.nama) + '</option>'; }).join('') + '</select></div><div class="fld"><label>Mata pelajaran</label><select class="inp" id="bnM">' + mapelOps.map(function (m) { return '<option value="' + m.id + '"' + (m.id === mapel ? ' selected' : '') + '>' + x(m.nama) + '</option>'; }).join('') + '</select></div><div class="fld" style="flex:1;min-width:200px"><label>Cari siswa</label><input class="inp" id="bnCari" placeholder="Nama / NIS"></div></div></div><div id="bnIsi">' + ES.skeleton(6) + '</div>';
    ES.$('#bnK').onchange = ES.$('#bnM').onchange = function () { ES.buka('nilai/' + ES.$('#bnK').value + '/' + ES.$('#bnM').value); };
    let D = null;
    const muat = function () { return ES.baca('nilai.buku', { kelas: kelas, mapel: mapel }, function (d) { if (masih()) { D = d; gambar(); } }); };
    function gambar() {
      const d = D, q = ES.$('#bnCari').value.toLowerCase(), akhir = d.siswa.filter(function (s) { return s.akhir !== null; }).map(function (s) { return s.akhir; });
      const rata = akhir.length ? akhir.reduce(function (a, b) { return a + b; }, 0) / akhir.length : null, tuntas = d.siswa.filter(function (s) { return s.tuntas; }).length;
      const maks = d.siswa.filter(function (s) { return s.akhir !== null; }).sort(function (a, b) { return b.akhir - a.akhir; });
      let h = '<div class="grid g4 mb">' + '<div class="kartu kpi"><div class="ik w-biru">' + ic('analytics') + '</div><div><div class="l">Rata-rata kelas</div><div class="v">' + (rata === null ? '–' : ES.fAngka(rata)) + '</div><div class="t redup">KKM ' + d.kkm + '</div></div></div>' +
        '<div class="kartu kpi"><div class="ik w-hijau">' + ic('verified') + '</div><div><div class="l">Tingkat ketuntasan</div><div class="v">' + (akhir.length ? ES.fAngka(tuntas / akhir.length * 100) + '%' : '–') + '</div><div class="t redup">' + tuntas + '/' + akhir.length + ' siswa · ' + (akhir.length - tuntas) + ' perlu remedial</div></div></div>' +
        '<div class="kartu kpi"><div class="ik w-kuning">' + ic('swap_vert') + '</div><div><div class="l">Sebaran</div><div class="t">Tertinggi <b>' + (maks[0] ? ES.fAngka(maks[0].akhir) + '</b> (' + x(maks[0].nama.split(' ')[0]) + ')' : '–</b>') + '</div><div class="t">Terendah <b>' + (maks.length ? ES.fAngka(maks[maks.length - 1].akhir) + '</b> (' + x(maks[maks.length - 1].nama.split(' ')[0]) + ')' : '–</b>') + '</div></div></div>' +
        '<div class="kartu kpi"><div class="ik w-teal">' + ic('pie_chart') + '</div><div><div class="l">Distribusi bobot</div><div class="t">' + Object.keys(d.bobot).map(function (k) { return x(k) + ' ' + d.bobot[k] + '%'; }).join(' · ') + '</div></div></div></div>';
      const rows = d.siswa.filter(function (s) { return !q || (s.nama + ' ' + s.nis).toLowerCase().indexOf(q) >= 0; });
      h += '<div class="kartu"><div class="kp-hd"><div><h3>Lembar penilaian komponen</h3><p>Klik sel untuk mengubah (kolom Manual & Tugas). Kolom CBT diubah lewat menu Ujian.</p></div><span class="bdg merah">Remedial &lt; ' + d.kkm + '</span></div><div class="tbl-w"><table class="tbl"><thead><tr><th>No</th><th>NIS</th><th>Nama siswa</th><th>L/P</th>' +
        d.kolom.map(function (k) { return '<th class="c" title="' + x(k.judul) + '">' + x(String(k.judul).slice(0, 18)) + '<div style="font-weight:400;text-transform:none">' + x(k.komponen) + (k.sumber !== 'Manual' ? ' · ' + x(k.sumber) : '') + (d.bisaUbah && k.sumber === 'Manual' ? ' <a href="#" data-hk="' + k.id + '" title="Hapus kolom">×</a>' : '') + '</div></th>'; }).join('') + '<th class="c">Nilai akhir</th><th class="c">Predikat</th><th class="c">Status</th></tr></thead><tbody>' +
        rows.map(function (s, i) { return '<tr><td class="num">' + (i + 1) + '</td><td class="num">' + x(s.nis) + '</td><td><div class="baris" style="flex-wrap:nowrap"><span class="av s">' + x(ES.inisial(s.nama)) + '</span><b>' + x(s.nama) + '</b></div></td><td>' + x(s.jk || '') + '</td>' + d.kolom.map(function (k) { const v = k.nilai[s.id]; const merah = v !== undefined && v !== '' && v < d.kkm; return '<td class="c num" ' + (d.bisaUbah && k.sumber !== 'CBT' ? 'contenteditable="true" data-k="' + k.id + '" data-s="' + s.id + '" inputmode="decimal"' : '') + ' style="' + (merah ? 'color:var(--merah);font-weight:600;' : '') + 'min-width:64px">' + (v === undefined || v === '' ? '' : v) + '</td>'; }).join('') + '<td class="c num"><b>' + (s.akhir === null ? '–' : ES.fAngka(s.akhir)) + '</b></td><td class="c">' + x(s.predikat || '–') + '</td><td class="c">' + (s.tuntas === null ? '' : s.tuntas ? '<span class="bdg hijau">TUNTAS</span>' : '<span class="bdg merah">REMEDIAL</span>') + '</td></tr>'; }).join('') + '</tbody></table></div>' + (!rows.length ? ES.kosong('Tidak ada siswa') : '') + '</div>';
      ES.$('#bnIsi').innerHTML = h;
      // sunting sel: simpan saat keluar (debounce per kolom → 1 permintaan)
      const tertunda = {};
      const kirim = ES.debounce(function () { Object.keys(tertunda).forEach(function (kid) { const nilai = tertunda[kid]; delete tertunda[kid]; ES.tulis('nilai.isi', { kolomId: kid, nilai: nilai }, { bersih: ['nilai.', 'lms.'] }).then(function (r) { const k = D.kolom.filter(function (z) { return z.id === kid; })[0]; if (k) k.nilai = r.nilai; ES.toast('Nilai tersimpan.', 'ok', 1500); muat(); }); }); }, 700);
      ES.$$('[data-k]').forEach(function (c) {
        c.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); c.blur(); const tr = c.parentElement.nextElementSibling; if (tr) { const n = tr.children[c.cellIndex]; if (n) n.focus(); } } });
        c.addEventListener('blur', function () { const v = c.textContent.trim().replace(',', '.'); const k = D.kolom.filter(function (z) { return z.id === c.dataset.k; })[0], lama = k.nilai[c.dataset.s]; if (String(v) === String(lama === undefined ? '' : lama)) return; if (v !== '' && (isNaN(+v) || +v < 0 || +v > 100)) { ES.toast('Nilai 0–100.', 'warn'); c.textContent = lama === undefined ? '' : lama; return; } (tertunda[c.dataset.k] = tertunda[c.dataset.k] || {})[c.dataset.s] = v === '' ? '' : +v; k.nilai[c.dataset.s] = v === '' ? undefined : +v; kirim(); });
      });
      ES.$$('[data-hk]').forEach(function (a) { a.onclick = function (e) { e.preventDefault(); ES.konfirmasi('Hapus kolom nilai ini beserta isinya?', { bahaya: true }).then(function (ok) { if (ok) ES.tulisPesan('nilai.kolom.hapus', { id: a.dataset.hk }, { bersih: ['nilai.'] }).then(muat); }); }; });
    }
    ES.$('#bnCari').oninput = ES.debounce(function () { if (D) gambar(); }, 200);
    ES.$('#bnKolom').onclick = function () { ES.dialogForm({ judul: 'Tambah kolom penilaian', bidang: [{ k: 'judul', l: 'Judul', req: true, ph: 'mis. UH 1 Teks Eksposisi' }, { k: 'komponen', l: 'Komponen', t: 'select', o: ['UH', 'Tugas', 'UTS', 'UAS', 'Proyek', 'Lainnya'], kosong: false }, { k: 'tanggal', l: 'Tanggal', t: 'date', v: ES.hariIni() }, { k: 'bobot', l: 'Bobot dalam komponen', t: 'number', v: 1, min: 1 }], simpan: function (v) { return ES.tulisPesan('nilai.kolom.save', Object.assign(v, { kelas: kelas, mapel: mapel }), { bersih: ['nilai.'] }).then(muat); } }); };
    ES.$('#bnBobot').onclick = function () { if (!D) return; const b = D.bobot; ES.dialogForm({ judul: 'Bobot kategori & KKM', sub: 'Total bobot harus 100%. Kategori tanpa nilai otomatis dinormalisasi.', bidang: ['Tugas', 'UH', 'CBT', 'UTS', 'UAS', 'Proyek'].map(function (k) { return { k: k, l: k + ' (%)', t: 'number', min: 0, max: 100, v: b[k] || 0 }; }).concat([{ k: 'kkm', l: 'KKM / KKTP', t: 'number', v: D.kkm, min: 0, max: 100 }]), simpan: function (v) { const kkm = v.kkm; delete v.kkm; return ES.tulisPesan('nilai.bobot.save', { kelas: kelas, mapel: mapel, bobot: v, kkm: kkm }, { bersih: ['nilai.'] }).then(muat); } }); };
    ES.$('#bnXls').onclick = function () { if (!D) return; const hd = ['No', 'NIS', 'Nama', 'L/P'].concat(D.kolom.map(function (k) { return k.judul + ' (' + k.komponen + ')'; })).concat(['Nilai Akhir', 'Predikat', 'Status']); ES.xlsx('Buku-Nilai-' + ES.namaKelas(kelas) + '-' + ES.namaMapel(mapel) + '.xlsx', [{ nama: 'Buku Nilai', data: [hd].concat(D.siswa.map(function (s, i) { return [i + 1, s.nis, s.nama, s.jk].concat(D.kolom.map(function (k) { return k.nilai[s.id] === undefined ? '' : k.nilai[s.id]; })).concat([s.akhir === null ? '' : s.akhir, s.predikat, s.tuntas === null ? '' : s.tuntas ? 'Tuntas' : 'Remedial']); })) }]); };
    ES.$('#bnPdf').onclick = function () { if (!D) return; ES.pdfTabel('Buku-Nilai.pdf', 'Buku Nilai ' + ES.namaMapel(mapel) + ' — ' + ES.namaKelas(kelas), 'KKM ' + D.kkm + ' · Bobot ' + Object.keys(D.bobot).map(function (k) { return k + ' ' + D.bobot[k] + '%'; }).join(', '), ['No', 'NIS', 'Nama'].concat(D.kolom.map(function (k) { return String(k.judul).slice(0, 12); })).concat(['Akhir', 'Pred']), D.siswa.map(function (s, i) { return [i + 1, s.nis, s.nama].concat(D.kolom.map(function (k) { return k.nilai[s.id] === undefined ? '' : k.nilai[s.id]; })).concat([s.akhir === null ? '' : s.akhir, s.predikat]); }), { lanskap: D.kolom.length > 5, kecil: D.kolom.length > 8 }); };
    return muat();
  } });

  // ---------------- siswa & wali ----------------
  ES.hal('kelas-saya', { judul: 'Kelas & Tugas', peran: ['SISWA', 'WALI_MURID'], render: function (el, p, masih) {
    el.innerHTML = '<div class="jdl-hal"><div><h1>Kelas & Tugas</h1><p>Materi dan tugas dari guru.</p></div></div><div id="ksIsi">' + ES.skeleton(4, 80) + '</div>';
    return Promise.all([ES.baca('lms.saya', {}, function () { }), ES.baca('lms.kelasSaya', {}, function () { })]).then(function () {
      if (!masih()) return; const lm = ES.cache('lms.saya') || [], ks = ES.cache('lms.kelasSaya') || [], siswa = ES.s.me.tipe === 'siswa';
      let h = '';
      lm.forEach(function (a) {
        if (!siswa) h += '<h3 class="mb-s">' + x(a.nama) + '</h3>';
        const belum = a.tugas.filter(function (t) { return t.status === 'Belum'; });
        h += '<div class="kartu mb"><div class="kp-hd"><h3>Tugas</h3><span class="bdg ' + (belum.length ? 'kuning' : 'hijau') + '">' + belum.length + ' belum dikumpulkan</span></div>' + ES.tabel([{ l: 'Tugas', f: function (t) { return '<b>' + x(t.judul) + '</b><div class="sub">' + x(t.mapel) + '</div>'; } }, { l: 'Tenggat', f: function (t) { return ES.fTglJam(t.deadline); } }, { l: 'Status', f: function (t) { return ES.bdgStatus(t.status); } }, { l: 'Nilai', f: function (t) { return t.nilai !== '' ? '<b>' + t.nilai + '</b>' : ''; }, n: 1 }, { l: '', f: function (t) { return siswa ? '<a class="btn s kc" href="#/kelas/' + a.kelas + '/' + t.idMapel + '/tugas">Buka</a>' : ''; } }], a.tugas, { kosong: 'Belum ada tugas' }) + '</div>';
      });
      h += '<h3 class="mb-s">Mata pelajaran</h3><div class="grid g3">' + ks.map(function (k) { const w = warna(k.mapel + k.kelas), tag = siswa ? 'a' : 'div'; return '<' + tag + ' class="kartu' + (siswa ? ' klik' : '') + '" style="text-decoration:none;color:inherit;overflow:hidden"' + (siswa ? ' href="#/kelas/' + k.kelas + '/' + k.mapel + '"' : '') + '><div style="height:64px;background:' + w + ';color:#fff;padding:14px 18px"><b>' + x(k.namaMapel) + '</b><div class="kecil" style="opacity:.85">' + x(k.guru) + '</div></div><div class="kp baris"><span class="bdg biru">' + k.materi + ' materi</span><span class="bdg">' + k.tugasAktif + ' tugas aktif</span></div></' + tag + '>'; }).join('') + '</div>';
      ES.$('#ksIsi').innerHTML = h;
    });
  } });
})();
