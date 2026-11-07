/* EduSmart Suite — shell aplikasi: login, menu per peran, header, pencarian, notifikasi, PWA, halaman publik (verifikasi & laporan). */
(function () {
  'use strict';
  const x = ES.x, ic = ES.ic;
  const SA = 'SUPER_ADMIN', KS = 'KEPSEK', KUR = 'KURIKULUM', GR = 'GURU', WK = 'WALI_KELAS', BK = 'BK', SIS = 'SISWA', WM = 'WALI_MURID';
  ES.PERAN = { SA: SA, KS: KS, KUR: KUR, GR: GR, WK: WK, BK: BK, SIS: SIS, WM: WM };
  const MENU = [
    { g: 'Utama' }, { h: 'dashboard', l: 'Beranda', ikon: 'dashboard', p: [SA, KS, KUR, GR, WK, BK, SIS, WM] },
    { g: 'Akademik', p: [SA, KS, KUR, GR, WK, BK] },
    { h: 'presensi', l: 'Presensi Siswa', ikon: 'fact_check', p: [SA, KS, GR, WK, BK], alias: 'terminal' },
    { h: 'lms', l: 'LMS & Kelas', ikon: 'menu_book', p: [SA, KS, KUR, GR, WK], alias: 'kelas,nilai' },
    { h: 'cbt', l: 'Ujian CBT', ikon: 'quiz', p: [SA, KS, KUR, GR] },
    { h: 'kurikulum', l: 'Dokumen Kurikulum', ikon: 'inventory_2', p: [SA, KS, KUR, GR], alias: 'banksoal' },
    { g: 'Kesiswaan', p: [SA, KS, KUR, GR, WK, BK] },
    { h: 'bk', l: 'Bimbingan Konseling', ikon: 'psychology', p: [SA, KS, GR, WK, BK, KUR] },
    { h: 'laporan', l: 'Laporan & Rekap', ikon: 'analytics', p: [SA, KS, KUR, WK, GR] },
    { g: 'Administrasi', p: [SA, KS, KUR, GR, WK, BK] },
    { h: 'dokumen', l: 'Dokumen & Surat', ikon: 'description', p: [SA, KS, KUR, GR, WK, BK], bdg: 'ttd' },
    { h: 'notifikasi', l: 'WhatsApp & Notifikasi', ikon: 'campaign', p: [SA, KS, BK, WK] },
    { h: 'crm', l: 'CRM Kontak', ikon: 'contacts', p: [SA, KS, BK, WK] },
    { h: 'pengaturan', l: 'Pengaturan Sistem', ikon: 'settings', p: [SA, KUR], alias: 'master' },
    { g: 'Belajar', p: [SIS, WM] },
    { h: 'kelas-saya', l: 'Kelas & Tugas', ikon: 'menu_book', p: [SIS, WM] },
    { h: 'ujian', l: 'Ujian', ikon: 'quiz', p: [SIS, WM] },
    { h: 'nilai-saya', l: 'Nilai', ikon: 'grading', p: [SIS, WM] },
    { h: 'kehadiran', l: 'Kehadiran', ikon: 'event_available', p: [SIS, WM] },
    { h: 'disiplin', l: 'Disiplin & Surat', ikon: 'gavel', p: [SIS, WM] }
  ];
  const BAWAH = { staf: ['dashboard', 'presensi', 'lms', 'bk', 'profil'], siswa: ['dashboard', 'kelas-saya', 'ujian', 'nilai-saya', 'profil'], wali: ['dashboard', 'kehadiran', 'nilai-saya', 'disiplin', 'profil'] };
  const PREFETCH = { dashboard: [['dash.data']], lms: [['lms.kelasSaya']], cbt: [['cbt.ujian.list']], kurikulum: [['kur.dok.list']], bk: [['bk.rekap']], dokumen: [['de.template.list']], 'kelas-saya': [['lms.saya']], 'nilai-saya': [['nilai.saya']], kehadiran: [['pres.saya']], disiplin: [['bk.saya']], ujian: [['cbt.ujian.list']] };
  ES.LABEL_PERAN = { SUPER_ADMIN: 'Super Admin', KEPSEK: 'Kepala Sekolah', KURIKULUM: 'Waka Kurikulum', GURU: 'Guru Pengampu', WALI_KELAS: 'Wali Kelas', BK: 'Guru BK', SISWA: 'Siswa', WALI_MURID: 'Wali Murid' };

  // ---------------- shell ----------------
  ES.pasangShell = function () {
    const me = ES.s.me || {}, st = (ES.s.boot || {}).setelan || {}, ta = (ES.s.boot || {}).ta || {};
    const menu = MENU.filter(function (m) { return !m.p || ES.punya(m.p); });
    const nav = menu.map(function (m) { return m.g ? '<div class="sb-grup">' + x(m.g) + '</div>' : '<a href="#/' + m.h + '" data-h="' + m.h + '" data-alias="' + (m.alias || '') + '">' + ic(m.ikon) + '<span>' + x(m.l) + '</span>' + (m.bdg ? '<i class="bdg hidden" data-bdg="' + m.bdg + '"></i>' : '') + '</a>'; }).join('');
    const tipe = me.tipe === 'siswa' ? 'siswa' : me.tipe === 'wali' ? 'wali' : 'staf';
    const bawah = BAWAH[tipe].map(function (h) { const m = MENU.filter(function (z) { return z.h === h; })[0] || { h: 'profil', l: 'Akun', ikon: 'person' }; if (m.p && !ES.punya(m.p)) return ''; return '<a href="#/' + m.h + '" data-h="' + m.h + '" data-alias="' + (m.alias || '') + '">' + ic(m.ikon) + (m.l.split(' ')[0]) + '</a>'; }).join('');
    document.body.innerHTML = '<div class="app' + (ES.ls.get('ciut', false) ? ' ciut' : '') + '"><aside class="sb" aria-label="Navigasi"><div class="sb-brand"><div class="sb-logo">' + (st.LOGO_URL ? '<img src="' + x(st.LOGO_URL) + '" alt="">' : ic('school', 'l')) + '</div><div class="sb-teks"><div class="sb-nama">' + x(st.NAMA_APP || 'EduSmart Suite') + '</div><div class="sb-sek">' + x(st.NAMA_SEKOLAH || '') + '</div></div></div><nav>' + nav + '</nav><div class="sb-kaki sb-teks">v' + ES.VERSI + ' · ' + x(ta.tahun ? 'TA ' + ta.tahun + ' ' + (ta.semester || '') : '') + '</div></aside>' +
      '<div class="layar-tutup"></div><div class="utama"><header class="hdr"><button class="btn-ik" id="tblMenu" aria-label="Menu">' + ic('menu') + '</button>' +
      (ES.staf() ? '<div class="hdr-cari">' + ic('search') + '<input id="cariGlobal" placeholder="Cari siswa, kelas, atau menu…  ( / )" autocomplete="off" aria-label="Pencarian"></div>' : '<div style="flex:1"></div>') +
      '<div class="hdr-kanan">' + (ta.tahun ? '<span class="chip-ta">' + ic('event_available', 's') + 'TA ' + x(ta.tahun) + ' ' + x(ta.semester || '') + '</span>' : '') +
      '<button class="btn-ik" id="tblTema" aria-label="Mode gelap">' + ic(document.documentElement.dataset.theme === 'dark' ? 'light_mode' : 'dark_mode') + '</button>' +
      '<button class="btn-ik" id="tblNotif" aria-label="Pemberitahuan">' + ic('notifications') + '<span class="titik hidden"></span></button>' +
      '<button class="profil" id="tblProfil"><span class="av">' + x(ES.inisial(me.nama)) + '</span><span><b>' + x(me.nama || '') + '</b><small>' + x(((me.roles || []).map(function (r) { return ES.LABEL_PERAN[r]; })[0]) || '') + '</small></span>' + ic('expand_more', 's') + '</button></div></header>' +
      '<main id="isi" class="isi" tabindex="-1"></main></div><nav class="btm-nav">' + bawah + '</nav></div>';
    const app = ES.$('.app');
    ES.$('#tblMenu').onclick = function () { if (innerWidth < 1024) app.classList.toggle('buka'); else { app.classList.toggle('ciut'); ES.ls.set('ciut', app.classList.contains('ciut')); } };
    ES.$('.layar-tutup').onclick = function () { app.classList.remove('buka'); };
    ES.$('#tblTema').onclick = function () { const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; ES.tema(t); this.innerHTML = ic(t === 'dark' ? 'light_mode' : 'dark_mode'); ES.render(); };
    ES.$('#tblProfil').onclick = function () { menuProfil(this); };
    ES.$('#tblNotif').onclick = function () { panelNotif(this); };
    // pra-muat saat kursor/jari menyentuh menu → klik terasa instan
    ES.$$('.sb a, .btm-nav a').forEach(function (a) { const f = function () { ES.prefetch(PREFETCH[a.dataset.h]); }; a.addEventListener('mouseenter', f, { passive: true }); a.addEventListener('touchstart', f, { passive: true }); });
    if (ES.staf()) pasangCari();
    document.addEventListener('keydown', function (e) { if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && ES.$('#cariGlobal')) { e.preventDefault(); ES.$('#cariGlobal').focus(); } });
    perbaruiLencana();
  };
  function perbaruiLencana() {
    const d = ES.cache('dash.data'); if (!d) return;
    const n = (d.ttdMenunggu || 0) + (d.kpi && d.kpi.perluDinilai ? 1 : 0) + (d.bk && d.bk.spDraf ? 1 : 0);
    const t = ES.$('#tblNotif .titik'); if (t) t.classList.toggle('hidden', !n);
    const b = ES.$('[data-bdg=ttd]'); if (b) { b.textContent = d.ttdMenunggu || ''; b.classList.toggle('hidden', !d.ttdMenunggu); }
  }
  ES.perbaruiLencana = perbaruiLencana;
  function panelNotif(btn) {
    const d = ES.cache('dash.data') || {}, it = [];
    if (d.ttdMenunggu) it.push({ ikon: 'draw', teks: d.ttdMenunggu + ' dokumen menunggu tanda tangan Anda', klik: function () { ES.buka('dokumen/ttd'); } });
    if (d.kpi && d.kpi.perluDinilai) it.push({ ikon: 'grading', teks: d.kpi.perluDinilai + ' pengumpulan tugas perlu dinilai', klik: function () { ES.buka('lms/koreksi'); } });
    if (d.bk && d.bk.spDraf) it.push({ ikon: 'gavel', teks: d.bk.spDraf + ' draf surat peringatan perlu ditindaklanjuti', klik: function () { ES.buka('bk/sp'); } });
    if (d.kurikulum && d.kurikulum.menunggu && ES.punya([SA, KUR, KS])) it.push({ ikon: 'inventory_2', teks: d.kurikulum.menunggu + ' dokumen kurikulum menunggu validasi', klik: function () { ES.buka('kurikulum/riwayat'); } });
    (d.ujian || []).filter(function (u) { return u.status === 'Berlangsung'; }).forEach(function (u) { it.push({ ikon: 'quiz', teks: 'Ujian berlangsung: ' + u.judul + ' (' + u.kelas + ')', klik: function () { ES.buka('cbt/monitor/' + u.id); } }); });
    (d.anak || []).forEach(function (a) { if (a.jumlahTugasBelum) it.push({ ikon: 'assignment', teks: a.nama.split(' ')[0] + ': ' + a.jumlahTugasBelum + ' tugas belum dikumpulkan', klik: function () { ES.buka('kelas-saya'); } }); (a.ujian || []).forEach(function (u) { it.push({ ikon: 'quiz', teks: 'Ujian ' + u.judul + ' · ' + ES.fTglJam(u.mulai), klik: function () { ES.buka('ujian'); } }); }); });
    if (!it.length) it.push({ ikon: 'check_circle', teks: 'Tidak ada pemberitahuan baru', klik: function () { } });
    ES.menuPop(btn, it);
  }
  function menuProfil(btn) {
    const me = ES.s.me || {}, it = [{ ikon: 'person', teks: 'Akun & keamanan', klik: function () { ES.buka('profil'); } }];
    if (ES.instalPrompt) it.push({ ikon: 'install_mobile', teks: 'Pasang aplikasi di perangkat ini', klik: ES.pasangPwa });
    else if (/iphone|ipad/i.test(navigator.userAgent) && !navigator.standalone) it.push({ ikon: 'install_mobile', teks: 'Cara memasang di iPhone', klik: function () { ES.modal({ judul: 'Pasang di iPhone/iPad', isi: '<ol style="line-height:28px;margin:0;padding-left:20px"><li>Buka halaman ini di <b>Safari</b>.</li><li>Ketuk tombol <b>Bagikan</b> (kotak dengan panah ke atas).</li><li>Pilih <b>Tambah ke Layar Utama</b>, lalu <b>Tambah</b>.</li></ol>' }); } });
    it.push({ ikon: 'refresh', teks: 'Muat ulang data', klik: function () { ES.invalidasi(); ES.muatBoot().then(function () { ES.pasangShell(); ES.render(); ES.toast('Data diperbarui.', 'ok'); }).catch(function (e) { ES.toast(e.message, 'err'); }); } });
    it.push('-', { ikon: 'logout', teks: 'Keluar', bahaya: true, klik: function () { ES.keluar(); } });
    ES.menuPop(btn, it);
  }
  function pasangCari() {
    const inp = ES.$('#cariGlobal'); let pop = null;
    function tutup() { if (pop) { pop.remove(); pop = null; } }
    inp.addEventListener('input', ES.debounce(function () {
      const q = inp.value.trim().toLowerCase(); tutup(); if (q.length < 2) return;
      const m = ES.master(), hasil = [];
      MENU.filter(function (z) { return z.h && (!z.p || ES.punya(z.p)) && z.l.toLowerCase().indexOf(q) >= 0; }).slice(0, 4).forEach(function (z) { hasil.push({ ikon: z.ikon, teks: z.l, sub: 'Menu', klik: function () { ES.buka(z.h); } }); });
      m.kelas.filter(function (k) { return k.nama.toLowerCase().indexOf(q) >= 0; }).slice(0, 3).forEach(function (k) { hasil.push({ ikon: 'groups', teks: 'Kelas ' + k.nama, sub: 'Presensi hari ini', klik: function () { ES.buka('presensi/harian/' + k.id); } }); });
      m.siswa.filter(function (s) { return (s.nama + ' ' + s.nis).toLowerCase().indexOf(q) >= 0; }).slice(0, 8).forEach(function (s) { hasil.push({ ikon: 'person', teks: s.nama, sub: 'NIS ' + s.nis + ' · ' + ES.namaKelas(s.kelas), klik: function () { ES.profilSiswa(s.id); } }); });
      if (!hasil.length) hasil.push({ ikon: 'search_off', teks: 'Tidak ditemukan', sub: '', klik: function () { } });
      pop = document.createElement('div'); pop.className = 'menu-pop'; const r = inp.getBoundingClientRect(); pop.style.top = (r.bottom + 6) + 'px'; pop.style.left = r.left + 'px'; pop.style.width = r.width + 'px';
      pop.innerHTML = hasil.map(function (h, i) { return '<button data-i="' + i + '">' + ic(h.ikon) + '<span><b>' + x(h.teks) + '</b><br><span class="redup kecil">' + x(h.sub) + '</span></span></button>'; }).join('');
      pop.onclick = function (e) { const b = e.target.closest('button'); if (!b) return; hasil[+b.dataset.i].klik(); inp.value = ''; tutup(); };
      document.body.appendChild(pop);
    }, 150));
    inp.addEventListener('keydown', function (e) { if (e.key === 'Escape') { inp.value = ''; tutup(); inp.blur(); } if (e.key === 'Enter' && pop) { const b = pop.querySelector('button'); if (b) b.click(); } });
    document.addEventListener('click', function (e) { if (pop && !pop.contains(e.target) && e.target !== inp) tutup(); });
  }
  /** laci profil singkat siswa (dari pencarian) */
  ES.profilSiswa = function (id) {
    const s = ES.master().siswa.filter(function (z) { return z.id === id; })[0] || {};
    const laci = document.createElement('div'); laci.innerHTML = '<div class="lapis" style="background:rgba(15,23,42,.3)"></div><aside class="laci"><div class="modal-hd"><div class="baris"><span class="av l">' + x(ES.inisial(s.nama)) + '</span><div><h3>' + x(s.nama) + '</h3><div class="redup">NIS ' + x(s.nis) + ' · ' + x(ES.namaKelas(s.kelas)) + '</div></div></div><button class="btn-ik" data-tutup>' + ic('close') + '</button></div><div class="modal-bd" id="lpIsi">' + ES.skeleton(3) + '</div></aside>';
    document.body.appendChild(laci);
    laci.addEventListener('click', function (e) { if (e.target.classList.contains('lapis') || e.target.closest('[data-tutup]')) laci.remove(); });
    const isi = ES.$('#lpIsi', laci);
    const aksi = '<div class="baris mt">' + (ES.punya([SA, KS, BK, WK, GR]) ? '<a class="btn s" href="#/bk/siswa/' + id + '">' + ic('psychology') + 'Profil disiplin</a>' : '') + '<a class="btn s" href="#/laporan/siswa/' + id + '">' + ic('analytics') + 'Laporan perkembangan</a></div>';
    ES.api('bk.siswa', { siswaId: id }).then(function (d) {
      const p = d.presensi || {};
      isi.innerHTML = '<div class="grid g2"><div class="kartu kpi"><div class="ik w-merah">' + ic('gavel') + '</div><div><div class="v">' + d.total + '</div><div class="l">Poin disiplin</div></div></div><div class="kartu kpi"><div class="ik w-hijau">' + ic('fact_check') + '</div><div><div class="v">' + ((p.Hadir || 0) + (p.Terlambat || 0)) + '</div><div class="l">Hadir (semester)</div></div></div></div>' +
        '<div class="mt"><div class="label-sm">Wali murid</div><div>' + x(d.siswa.wali || '–') + ' · ' + x(d.siswa.kontakWali || '') + '</div></div>' + aksi;
      laci.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { laci.remove(); }); });
    }).catch(function () { isi.innerHTML = aksi; laci.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { laci.remove(); }); }); });
  };

  // ---------------- login ----------------
  ES.layarLogin = function () {
    const c = ES.ls.get('authcfg', {}) || {};
    document.title = 'Masuk · ' + (c.NAMA_APP || 'EduSmart Suite');
    document.body.innerHTML = '<div class="login"><section class="login-kiri"><div class="baris"><div class="sb-logo">' + ic('school', 'l') + '</div><div><div class="sb-nama" style="color:#fff">' + x(c.NAMA_APP || 'EduSmart Suite') + '</div><div class="sb-sek" id="lgSek">' + x(c.NAMA_SEKOLAH || '') + '</div></div></div>' +
      '<div><h1>Satu platform untuk presensi, pembelajaran, ujian, dan pembinaan siswa.</h1><p class="mt">Presensi QR + wajah, LMS & buku nilai otomatis, CBT anti-kecurangan, BK & surat peringatan ber-QR, laporan perkembangan ke wali murid via WhatsApp.</p></div>' +
      '<div class="login-fitur"><div>' + ic('qr_code_scanner') + 'Presensi QR + verifikasi wajah</div><div>' + ic('quiz') + 'CBT dengan pengawasan langsung</div><div>' + ic('menu_book') + 'Buku nilai tersinkron</div><div>' + ic('campaign') + 'Notifikasi WA & email</div></div></section>' +
      '<section class="login-kanan"><div class="login-kartu"><h2>Masuk</h2><p class="redup" style="margin:6px 0 18px">Pilih jenis akun Anda.</p><div id="lgTabs"></div><div id="lgIsi"></div>' +
      '<p class="redup kecil mt" style="text-align:center">Lupa PIN? Hubungi wali kelas / admin sekolah. · <a href="#" id="lgDarurat">Akses darurat</a></p></div></section></div>';
    let tab = ES.ls.get('lgTab', 'staf');
    ES.tabs(ES.$('#lgTabs'), [['staf', 'Guru & Staf', 'badge'], ['siswa', 'Siswa', 'school'], ['wali', 'Wali Murid', 'family_restroom']], tab, function (t) { tab = t; ES.ls.set('lgTab', t); isi(); });
    function isi() {
      const el = ES.$('#lgIsi');
      if (tab === 'staf') {
        el.innerHTML = '<div class="gsi-w" id="gsi"></div>' + '<div class="pemisah">atau dengan email & PIN</div><form id="fLg" class="form satu" autocomplete="on">' + ES.form([{ k: 'email', l: 'Email', t: 'email', req: true, auto: 'username', ph: 'nama@sekolah.sch.id' }, { k: 'pin', l: 'PIN', t: 'password', req: true, inputmode: 'numeric', auto: 'current-password', ph: '6 digit' }], { email: ES.ls.get('lgEmail', '') }, 'satu').replace(/^<div class="form satu">|<\/div>$/g, '') + '<button class="btn p bsr" type="submit">' + ic('login') + 'Masuk</button></form>';
        pasangGoogle();
      } else if (tab === 'siswa') el.innerHTML = '<form id="fLg" class="form satu">' + ES.form([{ k: 'nis', l: 'NIS', req: true, inputmode: 'numeric', auto: 'username', ph: 'Nomor Induk Siswa' }, { k: 'pin', l: 'PIN', t: 'password', req: true, inputmode: 'numeric', auto: 'current-password', ph: '6 digit dari wali kelas' }], { nis: ES.ls.get('lgNis', '') }, 'satu').replace(/^<div class="form satu">|<\/div>$/g, '') + '<button class="btn p bsr" type="submit">' + ic('login') + 'Masuk</button></form>';
      else el.innerHTML = '<form id="fLg" class="form satu">' + ES.form([{ k: 'kontak', l: 'Nomor WhatsApp / email terdaftar', req: true, auto: 'username', ph: '08xxxxxxxxxx' }, { k: 'pin', l: 'PIN wali', t: 'password', req: true, inputmode: 'numeric', auto: 'current-password', ph: '6 digit' }], { kontak: ES.ls.get('lgKontak', '') }, 'satu').replace(/^<div class="form satu">|<\/div>$/g, '') + '<button class="btn p bsr" type="submit">' + ic('login') + 'Masuk</button></form>';
      ES.$('#fLg').onsubmit = function (e) {
        e.preventDefault(); const v = ES.ambilForm(this); if (!v) return; const btn = this.querySelector('button[type=submit]');
        const aksi = tab === 'staf' ? 'auth.staf' : tab === 'siswa' ? 'auth.siswa' : 'auth.wali';
        if (tab === 'staf') ES.ls.set('lgEmail', v.email); if (tab === 'siswa') ES.ls.set('lgNis', v.nis); if (tab === 'wali') ES.ls.set('lgKontak', v.kontak);
        ES.sibuk(btn, function () { return ES.api(aksi, v).then(masuk); }).catch(function (er) { ES.toast(er.message, 'err'); });
      };
    }
    isi();
    ES.$('#lgDarurat').onclick = function (e) {
      e.preventDefault();
      ES.dialogForm({ judul: 'Akses darurat', sub: 'Hanya untuk pemulihan bila login Google/PIN admin bermasalah. Semua aktivitas tercatat.', ok: 'Masuk', bidang: [{ k: 'username', l: 'Nama pengguna', req: true, auto: 'off' }, { k: 'password', l: 'Kata sandi', t: 'password', req: true, auto: 'off' }], kelas: 'satu', simpan: function (v) { return ES.api('auth.darurat', v).then(masuk, function (er) { ES.toast(er.message, 'err'); return false; }); } });
    };
    ES.api('auth.config', {}).then(function (d) { ES.ls.set('authcfg', d); if (ES.$('#lgSek')) ES.$('#lgSek').textContent = d.NAMA_SEKOLAH || ''; if (tab === 'staf') pasangGoogle(); }).catch(function (e) { if (e.code === 'CONFIG' || e.code === 'NOT_SETUP') ES.toast(e.message, 'err', 9000); });
    hangatkan();
  };
  function pasangGoogle() {
    const c = ES.ls.get('authcfg', {}) || {}, w = ES.$('#gsi'); if (!w) return;
    if (!c.googleClientId) { w.innerHTML = '<div class="peringatan info kecil">' + ic('info', 's') + '<span>Login Google belum diaktifkan admin. Gunakan email & PIN.</span></div>'; return; }
    ES.muatSkrip('https://accounts.google.com/gsi/client').then(function () {
      google.accounts.id.initialize({ client_id: c.googleClientId, callback: function (r) { ES.api('auth.google', { idToken: r.credential }).then(masuk).catch(function (e) { ES.toast(e.message, 'err'); }); }, ux_mode: 'popup', auto_select: false });
      google.accounts.id.renderButton(w, { theme: document.documentElement.dataset.theme === 'dark' ? 'filled_black' : 'outline', size: 'large', text: 'signin_with', shape: 'pill', width: Math.min(380, w.offsetWidth || 340), locale: 'id' });
    }).catch(function () { w.innerHTML = '<div class="peringatan kecil">Tidak dapat memuat tombol Google (offline?). Gunakan email & PIN.</div>'; });
  }
  function masuk(d) {
    ES.simpanSesi(d); ES.toast('Selamat datang, ' + (d.me.nama || '') + '.', 'ok');
    return ES.muatBoot().then(function () { ES.pasangShell(); if (!location.hash || location.hash === '#/') location.hash = '#/dashboard'; else ES.render(); setelahBoot(); });
  }
  /** panaskan server GAS (GET ringan) agar klik pertama tidak menunggu cold start */
  function hangatkan() { if (!ES.URL || Date.now() - (ES.ls.get('hangat', 0)) < 240000) return; ES.ls.set('hangat', Date.now()); fetch(ES.URL + '?w=pub', { method: 'GET' }).catch(function () { }); }
  function setelahBoot() {
    const st = (ES.s.boot || {}).setelan || {};
    // isi APP_URL otomatis (dipakai tautan di WA/email & QR verifikasi)
    if (ES.punya(SA) && location.protocol === 'https:') { const url = location.origin + location.pathname; if (st.APP_URL !== url) ES.api('admin.settings.save', { nilai: { APP_URL: url } }, { diam: true }).then(function () { st.APP_URL = url; }).catch(function () { }); }
    if (ES.staf()) ES.ambil('dash.data').then(perbaruiLencana).catch(function () { });
  }

  // ---------------- halaman profil ----------------
  ES.hal('profil', { judul: 'Akun', render: function (el) {
    const me = ES.s.me || {};
    el.innerHTML = '<div class="jdl-hal"><div><h1>Akun & Keamanan</h1><p>' + x(me.nama) + ' · ' + x((me.roles || []).map(function (r) { return ES.LABEL_PERAN[r]; }).join(', ')) + '</p></div></div>' +
      '<div class="grid g2"><div class="kartu"><div class="kp-hd"><h3>Ganti PIN masuk</h3></div><div class="kp">' + (me.tipe === 'darurat' ? '<p class="redup">Akun darurat memakai sandi — ganti di Pengaturan → Keamanan.</p>' : '<form id="fPin">' + ES.form([{ k: 'lama', l: 'PIN lama', t: 'password', inputmode: 'numeric' }, { k: 'baru', l: 'PIN baru (6 angka)', t: 'password', req: true, inputmode: 'numeric' }]) + '<button class="btn p mt">' + ic('key') + 'Simpan PIN</button></form>') + '</div></div>' +
      '<div class="kartu"><div class="kp-hd"><h3>Sesi & perangkat</h3></div><div class="kp"><p class="redup" style="margin-top:0">Keluarkan akun Anda dari semua perangkat (mis. HP hilang). Anda harus masuk lagi.</p><button class="btn s" id="tbKeluarSemua">' + ic('devices') + 'Keluar dari semua perangkat</button>' +
      '<div class="mt"><div class="label-sm">Tampilan</div><div class="seg mt-s" id="segTema"><button data-t="light">Terang</button><button data-t="dark">Gelap</button></div></div></div></div>' +
      '<div class="kartu hidden" id="kPejabat"><div class="kp-hd"><div><h3>PIN tanda tangan elektronik</h3><p>Anda terdaftar sebagai pejabat penanda tangan dokumen.</p></div></div><div class="kp"><form id="fTtd">' + ES.form([{ k: 'pinLama', l: 'PIN TTD lama (bila sudah ada)', t: 'password', inputmode: 'numeric' }, { k: 'pinBaru', l: 'PIN TTD baru (6 angka)', t: 'password', req: true, inputmode: 'numeric' }]) + '<button class="btn p mt">' + ic('draw') + 'Simpan PIN TTD</button></form></div></div></div>';
    const fp = ES.$('#fPin'); if (fp) fp.onsubmit = function (e) { e.preventDefault(); const v = ES.ambilForm(fp); if (!v) return; ES.sibuk(fp.querySelector('button'), function () { return ES.tulisPesan('auth.gantiPin', v).then(function () { fp.reset(); }); }); };
    ES.$('#tbKeluarSemua').onclick = function () { ES.konfirmasi('Keluar dari semua perangkat sekarang?').then(function (ok) { if (ok) ES.tulisPesan('auth.keluarSemua', {}).then(function () { ES.keluar(true); }); }); };
    ES.$$('#segTema button').forEach(function (b) { b.classList.toggle('on', b.dataset.t === document.documentElement.dataset.theme); b.onclick = function () { ES.tema(b.dataset.t); ES.pasangShell(); ES.render(); }; });
    if (ES.staf()) ES.api('de.pejabat.saya', {}).then(function (p) { if (!p) return; ES.$('#kPejabat').classList.remove('hidden'); const f = ES.$('#fTtd'); f.onsubmit = function (e) { e.preventDefault(); const v = ES.ambilForm(f); if (!v) return; ES.sibuk(f.querySelector('button'), function () { return ES.tulisPesan('de.pejabat.pin', v).then(function () { f.reset(); }); }); }; }).catch(function () { });
  } });

  // ---------------- halaman publik ----------------
  ES.publik = function (seg) {
    ES.tema();
    document.body.innerHTML = '<div class="publik"><div class="baris mb"><div class="sb-logo">' + ic('verified', 'l') + '</div><div><b style="font-family:var(--f-judul);font-size:18px">EduSmart Suite</b><div class="redup kecil" id="pbSek"></div></div><div style="margin-left:auto"><button class="btn-ik" data-cetak title="Cetak">' + ic('print') + '</button></div></div><div id="pbIsi">' + ES.skeleton(4, 60) + '</div></div>';
    const el = ES.$('#pbIsi');
    if (seg[0] === 'v') {
      document.title = 'Verifikasi Dokumen';
      ES.api('verif.cek', { k: seg[1] || '' }).then(function (d) {
        const sah = d.status === 'SAH';
        ES.$('#pbSek').textContent = d.instansi || '';
        el.innerHTML = '<div class="segel ' + (sah ? 'sah' : 'tarik') + '">' + ic(sah ? 'verified' : 'gpp_bad', 'xl') + '<div><h2>' + (sah ? 'Dokumen SAH & terdaftar' : 'Dokumen ' + x(d.status)) + '</h2><div>' + (sah ? 'Diterbitkan resmi melalui EduSmart Suite.' : x(d.alasanTarik || 'Dokumen ini tidak berlaku lagi.')) + '</div></div></div>' +
          '<div class="kartu mt"><div class="kp"><table class="tbl" style="margin:-8px 0"><tbody>' + [['Jenis dokumen', d.jenis], ['Nomor', d.nomor || '–'], ['Tanggal terbit', ES.fTglJam(d.tanggal)], ['Atas nama', d.atasNama || '–'], ['Instansi', d.instansi]].map(function (r) { return '<tr><td class="redup" style="width:38%">' + r[0] + '</td><td class="tebal">' + x(r[1]) + '</td></tr>'; }).join('') + '</tbody></table></div></div>' +
          '<div class="kartu mt"><div class="kp-hd"><h3>Penanda tangan</h3></div><ul class="daftar">' + (d.penandatangan || []).map(function (p) { return '<li><span class="av s">' + x(ES.inisial(p.nama)) + '</span><div class="grow"><b>' + x(p.nama || '–') + '</b><div class="redup kecil">' + x(p.jabatan) + ' · ' + x(p.metode || '') + (p.waktu ? ' · ' + ES.fTglJam(p.waktu) : '') + '</div></div>' + ES.bdgStatus(p.status === 'SETUJU' ? 'Terbit' : p.status) + '</li>'; }).join('') + '</ul></div>' +
          (d.hash ? '<div class="kartu mt"><div class="kp"><h4>Cek keaslian berkas PDF</h4><p class="redup kecil">Pilih berkas PDF yang Anda terima. Sidik jari (SHA-256) dihitung di perangkat Anda dan dibandingkan dengan arsip resmi — berkas tidak diunggah.</p><input type="file" accept="application/pdf" id="pbPdf" class="inp" style="padding-top:7px"><div id="pbHasil" class="mt-s"></div></div></div>' : '') +
          '<p class="redup kecil mt" style="text-align:center">Kode verifikasi: ' + x(seg[1]) + '</p>';
        const f = ES.$('#pbPdf'); if (f) f.onchange = function () { const file = f.files[0]; if (!file) return; file.arrayBuffer().then(function (b) { return crypto.subtle.digest('SHA-256', b); }).then(function (h) { const hex = Array.from(new Uint8Array(h)).map(function (v) { return v.toString(16).padStart(2, '0'); }).join(''); ES.$('#pbHasil').innerHTML = hex === d.hash ? '<div class="peringatan sukses">' + ic('check_circle') + 'Berkas identik dengan arsip resmi.</div>' : '<div class="peringatan bahaya">' + ic('error') + 'Berkas BERBEDA dari arsip resmi (mungkin telah diubah atau bukan versi final).</div>'; }); };
      }).catch(function (e) { el.innerHTML = '<div class="segel tarik">' + ic('gpp_bad', 'xl') + '<div><h2>Tidak dapat diverifikasi</h2><div>' + x(e.message) + '</div></div></div>'; });
    } else {
      document.title = 'Laporan Perkembangan Siswa';
      ES.api('lap.publik', { token: seg[1] || '' }).then(function (d) {
        const L = d.laporan; ES.$('#pbSek').textContent = d.sekolah || '';
        el.innerHTML = '<div class="kartu"><div class="kp"><div class="baris antar"><div><div class="label-sm">Laporan perkembangan · ' + x(d.periode) + '</div><h2 class="mt-s">' + x(L.NAMA_SISWA) + '</h2><div class="redup">NIS ' + x(L.NIS) + ' · Kelas ' + x(L.KELAS) + ' · ' + x(L.TAHUN_PELAJARAN) + '</div></div>' + (d.pdf ? '<button class="btn p" id="pbUnduh">' + ic('download') + 'Unduh PDF</button>' : '') + '</div>' +
          '<div class="grid g4 mt">' + [['Rata-rata nilai', L.RERATA === '' ? '–' : L.RERATA, 'grading', 'w-biru'], ['Kehadiran', L.PERSEN_HADIR + (L.PERSEN_HADIR === '-' ? '' : '%'), 'event_available', 'w-hijau'], ['Tugas dikumpulkan', L.TUGAS_KUMPUL + '/' + L.TUGAS_TOTAL, 'assignment_turned_in', 'w-teal'], ['Poin disiplin', L.POIN, 'gavel', 'w-merah']].map(function (k) { return '<div class="kartu kpi"><div class="ik ' + k[3] + '">' + ic(k[2]) + '</div><div><div class="v">' + x(k[1]) + '</div><div class="l">' + k[0] + '</div></div></div>'; }).join('') + '</div></div></div>' +
          '<div class="kartu mt"><div class="kp-hd"><h3>Capaian akademik</h3></div>' + ES.tabel([{ l: 'Mata pelajaran', k: 'MAPEL' }, { l: 'KKM', k: 'KKM', n: 1 }, { l: 'Nilai', f: function (r) { return r.NILAI === '' ? '–' : '<b>' + r.NILAI + '</b>'; }, n: 1 }, { l: 'Predikat', k: 'PREDIKAT', c: 1 }, { l: 'Keterangan', f: function (r) { return ES.bdgStatus(r.KETERANGAN === 'Belum ada nilai' ? '' : r.KETERANGAN) + (r.KETERANGAN === 'Belum ada nilai' ? '<span class="redup">Belum ada nilai</span>' : ''); } }], L.NILAI, { kosong: 'Belum ada nilai' }) + '</div>' +
          '<div class="grid g2 mt"><div class="kartu"><div class="kp-hd"><h3>Kehadiran</h3><span class="redup kecil">' + ES.fTgl(L.TGL_DARI) + ' – ' + ES.fTgl(L.TGL_SAMPAI) + '</span></div><div class="kp"><div class="grid g3">' + [['Hadir', L.HADIR, 'hijau'], ['Terlambat', L.TERLAMBAT, 'kuning'], ['Sakit', L.SAKIT, 'biru'], ['Izin', L.IZIN, 'biru'], ['Alpa', L.ALPA, 'merah']].map(function (k) { return '<div><div class="label-sm">' + k[0] + '</div><div style="font:700 22px var(--f-judul)">' + k[1] + '</div></div>'; }).join('') + '</div></div></div>' +
          '<div class="kartu"><div class="kp-hd"><h3>Kedisiplinan</h3><span class="bdg ' + (L.POIN_TOTAL ? 'merah' : 'hijau') + '">' + L.POIN_TOTAL + ' poin tahun ini</span></div>' + ((L.PELANGGARAN || []).length ? '<ul class="daftar">' + L.PELANGGARAN.map(function (p) { return '<li><div class="grow">' + x(p.JENIS) + '<div class="redup kecil">' + x(p.TANGGAL) + '</div></div><span class="bdg merah">+' + p.POIN + '</span></li>'; }).join('') + '</ul>' : '<div class="kp redup">Tidak ada catatan pelanggaran pada periode ini. 👍</div>') + '</div></div>' +
          '<p class="redup kecil mt" style="text-align:center">Laporan ini dibuat otomatis oleh EduSmart Suite pada ' + ES.fTglJam(d.dibuat) + '. Hubungi wali kelas untuk konsultasi.</p>';
        const u = ES.$('#pbUnduh'); if (u) u.onclick = function () { ES.sibuk(u, function () { return ES.api('lap.publik', { token: seg[1], pdf: true }).then(function (f) { ES.unduhB64(f.nama, f.mime, f.b64); }); }).catch(function (e) { ES.toast(e.message, 'err'); }); };
      }).catch(function (e) { el.innerHTML = ES.galat(e); });
    }
  };

  // ---------------- PWA ----------------
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); ES.instalPrompt = e; });
  ES.pasangPwa = function () { if (!ES.instalPrompt) return; ES.instalPrompt.prompt(); ES.instalPrompt.userChoice.then(function () { ES.instalPrompt = null; }); };
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').then(function (reg) {
        reg.addEventListener('updatefound', function () { const w = reg.installing; if (!w) return; w.addEventListener('statechange', function () { if (w.state === 'installed' && navigator.serviceWorker.controller) { const t = document.createElement('div'); t.className = 'pita-sinkron'; t.innerHTML = ic('system_update', 's') + 'Versi baru tersedia · <a href="#" id="tbMuatUlang">Muat ulang</a>'; document.body.appendChild(t); ES.$('#tbMuatUlang').onclick = function (ev) { ev.preventDefault(); w.postMessage('lewati'); location.reload(); }; } }); });
      }).catch(function () { });
    });
  }

  // ---------------- mulai ----------------
  function mulai() {
    ES.tema();
    const h = location.hash.replace(/^#\/?/, '').split('/');
    if (h[0] === 'v' || h[0] === 'lap') return ES.render();
    if (!ES.s.token || ES.s.exp < Date.now()) return ES.layarLogin();
    hangatkan();
    if (ES.s.boot) { ES.pasangShell(); ES.render(); }  // tampil seketika dari cache
    ES.muatBoot().then(function (b) {
      const sebelum = JSON.stringify((ES.s.me || {}).roles);
      if (!ES.$('.app') || sebelum !== JSON.stringify(b.me.roles)) { ES.pasangShell(); ES.render(); }
      setelahBoot();
    }).catch(function (e) { if (!ES.s.boot) { document.body.innerHTML = '<div class="publik">' + ES.galat(e, true) + '</div>'; const b = ES.$('[data-ulang]'); if (b) b.onclick = function () { location.reload(); }; } });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mulai); else mulai();
})();
