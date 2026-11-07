/* Modul E — CBT anti-kecurangan: daftar & jadwal ujian, live proctoring, hasil & analisis butir, layar ujian siswa. */
(function () {
  const x = ES.x, ic = ES.ic;
  const LABEL_PLG = { Pindah_Tab: 'Pindah tab', Keluar_Fullscreen: 'Keluar layar penuh', Blur_Window: 'Jendela tidak fokus', Copy_Paste: 'Salin/tempel', Refresh: 'Muat ulang', Lainnya: 'Lainnya' };
  function sisa(ms) { if (ms === null || ms === undefined) return '–'; ms = Math.max(0, ms); const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), d = s % 60; return (h ? h + ':' : '') + String(m).padStart(2, '0') + ':' + String(d).padStart(2, '0'); }

  // ---------------- daftar ujian (guru) ----------------
  ES.hal('cbt', { judul: 'Ujian CBT', peran: ['SUPER_ADMIN', 'KEPSEK', 'KURIKULUM', 'GURU'], render: function (el, p, masih) {
    if (p[0] === 'monitor') return monitor(el, p[1], masih);
    if (p[0] === 'hasil') return hasil(el, p[1], masih);
    el.innerHTML = '<div class="jdl-hal"><div><h1>Ujian CBT</h1><p>Penjadwalan, token, pengawasan langsung, dan analisis hasil.</p></div><div class="aksi"><a class="btn s" href="#/kurikulum/paket">' + ic('inventory') + 'Paket soal</a>' + (ES.punya(['GURU', 'SUPER_ADMIN']) ? '<button class="btn p" id="ujBaru">' + ic('add') + 'Jadwalkan ujian</button>' : '') + '</div></div><div class="kartu" id="ujIsi">' + ES.skeleton(5) + '</div>';
    const b = ES.$('#ujBaru'); if (b) b.onclick = function () { formUjian(null); };
    return ES.baca('cbt.ujian.list', {}, function (d) {
      if (!masih()) return;
      ES.$('#ujIsi').innerHTML = ES.tabel([{ l: 'Ujian', f: function (u) { return '<b>' + x(u.judul) + '</b><div class="sub">' + x(u.mapel) + ' · ' + x(u.kelas) + (u.ruang ? ' · ' + x(u.ruang) : '') + '</div>'; } },
        { l: 'Jadwal', f: function (u) { return ES.fTglJam(u.mulai) + '<div class="sub">s.d. ' + ES.fTglJam(u.selesai) + ' · ' + u.durasi + ' mnt</div>'; } },
        { l: 'Token', f: function (u) { return '<code class="tebal" style="font-size:14px;letter-spacing:.1em">' + x(u.token) + '</code>'; } }, { l: 'Status', f: function (u) { return ES.bdgStatus(u.status); } },
        { l: '', f: function (u) { return '<div class="baris" style="justify-content:flex-end">' + (u.status === 'Berlangsung' || u.status === 'Terjadwal' ? '<a class="btn p kc" href="#/cbt/monitor/' + u.id + '">' + ic('monitor_heart', 's') + 'Pantau</a>' : '') + '<a class="btn s kc" href="#/cbt/hasil/' + u.id + '">' + ic('insights', 's') + 'Hasil</a><button class="btn g kc ik-s" data-ed="' + u.id + '">' + ic('edit', 's') + '</button><button class="btn g kc ik-s" data-hp="' + u.id + '">' + ic('delete', 's') + '</button></div>'; } }], d, { kosong: 'Belum ada ujian', kosongTeks: 'Buat paket soal di Dokumen Kurikulum → Paket Soal, lalu jadwalkan ujian.', kosongIkon: 'quiz' });
      ES.$$('[data-ed]').forEach(function (b) { b.onclick = function () { formUjian(d.filter(function (u) { return u.id === b.dataset.ed; })[0]); }; });
      ES.$$('[data-hp]').forEach(function (b) { b.onclick = function () { ES.konfirmasi('Hapus ujian ini?', { bahaya: true }).then(function (ok) { if (ok) ES.tulisPesan('cbt.ujian.hapus', { id: b.dataset.hp }, { bersih: ['cbt.'] }).then(ES.render); }); }; });
    }, { ttl: 15000 });
  } });
  function formUjian(u) {
    ES.api('kur.paket.list', {}).then(function (pk) {
      const amp = ES.ampuan(), kelasOps = ES.master().kelas.filter(function (k) { return ES.punya('SUPER_ADMIN') || amp.some(function (a) { return a.kelas === k.id; }); });
      const besok = ES.tambahHari(ES.hariIni(), 1);
      ES.dialogForm({ judul: u ? 'Ubah ujian' : 'Jadwalkan ujian CBT', lebar: true, nilai: u ? Object.assign({}, u, { token_ujian: u.token, durasi_menit: u.durasi, batas_pelanggaran: u.batas_pelanggaran, komponen_nilai: u.komponen, acak_soal: u.acak_soal, acak_opsi: u.acak_opsi }) : { mulai: besok + 'T07:30', selesai: besok + 'T09:30', durasi_menit: 90, batas_pelanggaran: 3, komponen_nilai: 'CBT', acak_soal: true, acak_opsi: true },
        bidang: [{ k: 'judul', l: 'Nama ujian', req: true, w: true, ph: 'mis. Penilaian Harian 2 — Teks Eksposisi' }, { k: 'id_paket_soal', l: 'Paket soal', t: 'select', req: true, o: pk.map(function (z) { return [z.id, z.nama + ' · ' + (z.mapel || '') + ' (' + z.jumlah + ' soal)']; }) }, { k: 'id_kelas', l: 'Kelas peserta', t: 'select', req: true, o: ES.opsi(kelasOps) },
          { k: 'mulai', l: 'Dibuka', t: 'datetime-local', req: true }, { k: 'selesai', l: 'Ditutup', t: 'datetime-local', req: true }, { k: 'durasi_menit', l: 'Durasi pengerjaan (menit)', t: 'number', min: 5, max: 600, req: true }, { k: 'batas_pelanggaran', l: 'Batas pelanggaran sebelum terkunci', t: 'number', min: 1, max: 20 },
          { k: 'komponen_nilai', l: 'Masuk buku nilai sebagai', t: 'select', o: ['CBT', 'UH', 'UTS', 'UAS'], kosong: false }, { k: 'ruang', l: 'Ruang', ph: 'mis. Lab Komputer 2' }, { k: 'token_ujian', l: 'Token (kosongkan = otomatis)', ph: 'mis. BHS26' },
          { k: 'acak_soal', l: 'Acak urutan soal', t: 'checkbox' }, { k: 'acak_opsi', l: 'Acak urutan opsi', t: 'checkbox' }, { k: 'tampil_nilai', l: 'Tampilkan nilai ke siswa setelah selesai', t: 'checkbox' }, { k: 'draf', l: 'Simpan sebagai draf (belum terlihat siswa)', t: 'checkbox' }],
        simpan: function (v) { v.id = u ? u.id : ''; v.status = v.draf ? 'Draf' : 'Aktif'; return ES.tulisPesan('cbt.ujian.save', v, { bersih: ['cbt.', 'dash.', 'nilai.'] }).then(function () { ES.render(); }); } });
    }).catch(function (e) { ES.toast(e.message, 'err'); });
  }

  // ---------------- live proctoring ----------------
  function monitor(el, id, masih) {
    let D = null, filter = '', mode = ES.ls.get('monMode', 'tabel'), t = null, berhenti = false;
    el.innerHTML = '<div id="mnIsi">' + ES.skeleton(6, 70) + '</div>';
    ES.saatPindah = function () { berhenti = true; clearTimeout(t); };
    function muat(fresh) { return ES.api('cbt.monitor', { ujianId: id, _fresh: fresh }).then(function (d) { if (!masih() || berhenti) return; D = d; D.diterima = Date.now(); gambar(); }).catch(function (e) { if (!D) ES.$('#mnIsi').innerHTML = ES.galat(e); }).then(function () { if (!berhenti && masih()) t = setTimeout(function () { muat(false); }, document.hidden ? 15000 : 4000); }); }
    function gambar() {
      const d = D, u = d.ujian, r = d.ringkas, sisaUjian = ES.tgl(u.selesai) - new Date();
      const krit = d.rows.filter(function (z) { return z.status === 'Terkunci'; });
      const rows = d.rows.filter(function (z) { return !filter || (filter === 'Aktif' ? (z.status === 'Berjalan' || z.status === 'Dibuka_Ulang') : z.status === filter); });
      let h = '<div class="remah"><a href="#/cbt">Ujian CBT</a>' + ic('chevron_right', 's') + 'Live proctoring</div><div class="jdl-hal"><div><div class="baris"><span class="bdg merah"><span class="tt"></span>LIVE PROCTORING</span>' + ES.bdgStatus(u.status) + '</div><h1 class="mt-s">' + x(u.judul) + '</h1><p>' + x(u.kelas) + ' · Token <b style="letter-spacing:.1em">' + x(u.token) + '</b> · Durasi ' + u.durasi + ' menit' + (u.ruang ? ' · ' + x(u.ruang) : '') + '</p></div>' +
        '<div class="aksi" style="align-items:center"><div style="text-align:right;margin-right:8px"><div class="label-sm">Sisa waktu ujian</div><div class="timer' + (sisaUjian < 600000 ? ' kritis' : '') + '" id="mnSisa">' + sisa(sisaUjian) + '</div></div><button class="btn s" id="mnSiar">' + ic('campaign') + 'Pengumuman</button><button class="btn s" id="mnBeku">' + ic('lock') + 'Bekukan semua</button><button class="btn d" id="mnTutup">' + ic('check_circle') + 'Selesaikan ujian</button></div></div>';
      if (d.siaran && d.siaran.pesan) h += '<div class="peringatan info mb">' + ic('campaign') + '<span>Pengumuman aktif di layar peserta: <b>' + x(d.siaran.pesan) + '</b> <a href="#" id="mnHapusSiar">hapus</a></span></div>';
      const per = d.perJenis || {}, totalPlg = d.rows.reduce(function (a, z) { return a + z.pelanggaran; }, 0);
      h += '<div class="grid g4 mb"><div class="kartu kpi"><div class="ik w-biru">' + ic('groups') + '</div><div><div class="l">Aktif mengerjakan</div><div class="v">' + r.aktif + '<span class="redup" style="font-size:14px"> / ' + r.total + '</span></div><div class="t redup">' + (r.total ? Math.round((r.aktif + r.selesai + r.terkunci) / r.total * 100) : 0) + '% partisipasi · ' + r.belum + ' belum masuk</div></div></div>' +
        '<div class="kartu kpi"><div class="ik w-hijau">' + ic('verified') + '</div><div><div class="l">Selesai & terkirim</div><div class="v">' + r.selesai + '</div></div></div>' +
        '<div class="kartu kpi"><div class="ik w-merah">' + ic('lock_reset') + '</div><div><div class="l">Sesi terkunci</div><div class="v">' + r.terkunci + '</div><div class="t redup">Perlu intervensi pengawas</div></div></div>' +
        '<div class="kartu kpi"><div class="ik w-kuning">' + ic('warning') + '</div><div><div class="l">Total insiden</div><div class="v">' + totalPlg + '</div><div class="t redup">' + Object.keys(per).map(function (k) { return per[k] + ' ' + (LABEL_PLG[k] || k); }).join(' · ') + '</div></div></div></div>';
      if (krit.length) { const k = krit[0]; h += '<div class="peringatan bahaya mb" style="align-items:center">' + ic('gpp_bad', 'l') + '<div style="flex:1"><b>Insiden: sesi dibekukan otomatis — ' + x(k.nama) + '</b> (NIS ' + x(k.nis) + ') · ' + k.pelanggaran + ' pelanggaran (batas ' + k.batas + ').' + (krit.length > 1 ? ' +' + (krit.length - 1) + ' sesi lain terkunci.' : '') + '</div><button class="btn s kc" data-log="' + k.sesiId + '">' + ic('history_edu', 's') + 'Investigasi log</button><button class="btn p kc" data-buka="' + k.sesiId + '">' + ic('lock_open', 's') + 'Buka kunci</button></div>'; }
      h += '<div class="grid g-2-1"><div class="kartu"><div class="kp-hd"><div class="baris">' + [['', 'Semua', r.total], ['Aktif', 'Aktif', r.aktif], ['Terkunci', 'Terkunci', r.terkunci], ['Selesai', 'Selesai', r.selesai], ['Belum', 'Belum masuk', r.belum]].map(function (c) { return '<button class="chip' + (filter === c[0] ? ' on' : '') + '" data-f="' + c[0] + '">' + c[1] + ' <span class="n">' + c[2] + '</span></button>'; }).join('') + '</div><div class="seg"><button data-m="tabel" class="' + (mode === 'tabel' ? 'on' : '') + '">' + ic('table_rows', 's') + '</button><button data-m="grid" class="' + (mode === 'grid' ? 'on' : '') + '">' + ic('grid_view', 's') + '</button></div></div>';
      const sekarang = d.serverTime + (Date.now() - D.diterima);
      function koneksi(z) { if (!z.terakhirAktif || z.status === 'Selesai' || z.status === 'Belum') return ''; const dt = (sekarang - z.terakhirAktif) / 1000; return dt < 45 ? '<span class="bdg hijau">' + ic('wifi', 's') + 'Online</span>' : dt < 120 ? '<span class="bdg kuning">' + ic('wifi_tethering', 's') + Math.round(dt) + ' dtk</span>' : '<span class="bdg merah">' + ic('wifi_off', 's') + 'Terputus?</span>'; }
      function aksi(z) { if (!z.sesiId) return ''; return '<div class="baris" style="justify-content:flex-end;gap:4px">' + (z.status === 'Terkunci' ? '<button class="btn p kc" data-buka="' + z.sesiId + '">' + ic('lock_open', 's') + 'Buka</button>' : '') + (z.status === 'Berjalan' || z.status === 'Dibuka_Ulang' ? '<button class="btn s kc ik-s" data-kunci="' + z.sesiId + '" title="Bekukan">' + ic('lock', 's') + '</button>' : '') + '<button class="btn g kc ik-s" data-log="' + z.sesiId + '" title="Jawaban & log">' + ic('visibility', 's') + '</button></div>'; }
      if (mode === 'grid') h += '<div class="kp monitor-grid">' + rows.map(function (z) { return '<div class="ms ' + z.status + '"><span class="st">' + ES.bdgStatus(z.status) + '</span><div class="baris" style="flex-wrap:nowrap"><span class="av s">' + x(ES.inisial(z.nama)) + '</span><b class="trunc">' + x(z.nama) + '</b></div><div class="prog mt-s"><i style="width:' + (z.total ? z.dijawab / z.total * 100 : 0) + '%"></i></div><div class="baris antar kecil mt-s"><span>' + z.dijawab + '/' + (z.total || '–') + ' soal</span><span style="color:' + (z.pelanggaran ? 'var(--merah)' : 'inherit') + '">' + z.pelanggaran + ' insiden</span></div><div class="baris antar mt-s">' + koneksi(z) + aksi(z) + '</div></div>'; }).join('') + '</div>';
      else h += ES.tabel([{ l: 'Siswa', f: function (z) { return '<div class="baris" style="flex-wrap:nowrap"><span class="av s">' + x(ES.inisial(z.nama)) + '</span><div><b>' + x(z.nama) + '</b><div class="sub">NIS ' + x(z.nis) + ' · No. ' + z.absen + '</div></div></div>'; } }, { l: 'Status', f: function (z) { return ES.bdgStatus(z.status); } }, { l: 'Progres', f: function (z) { return z.sesiId ? '<div style="min-width:120px"><div class="kecil">' + z.dijawab + ' / ' + z.total + ' soal' + (z.skor !== null ? ' · skor <b>' + z.skor + '</b>' : '') + '</div><div class="prog mt-s"><i style="width:' + (z.total ? z.dijawab / z.total * 100 : 0) + '%"></i></div></div>' : ''; } }, { l: 'Koneksi', f: koneksi }, { l: 'Insiden', f: function (z) { return z.pelanggaran ? '<b style="color:var(--merah)">' + z.pelanggaran + '</b><span class="redup">/' + z.batas + '</span>' : (z.sesiId ? '<span class="redup">0</span>' : ''); } }, { l: '', f: aksi }], rows, { kosong: 'Tidak ada peserta pada filter ini' });
      h += '</div><div class="kartu"><div class="kp-hd"><h3>Log insiden langsung</h3><span class="baris kecil redup"><span class="titik-hidup"></span>sinkron 4 dtk</span></div><ul class="daftar feed" style="max-height:520px;overflow:auto">' + (d.feed.length ? d.feed.map(function (f) { return '<li><span class="ik w-' + (f.jenis === 'Lainnya' ? 'biru' : 'merah') + '" style="width:30px;height:30px;border-radius:8px;display:grid;place-items:center;flex:none">' + ic(f.jenis === 'Copy_Paste' ? 'content_paste_off' : f.jenis === 'Keluar_Fullscreen' ? 'fullscreen_exit' : f.jenis === 'Refresh' ? 'refresh' : 'tab', 's') + '</span><div class="grow"><b>' + x(f.nama) + '</b> · ' + x(f.label) + (f.ket ? '<div class="redup kecil">' + x(f.ket) + '</div>' : '') + '</div><span class="redup kecil num">' + ES.fJam(String(f.waktu).slice(11)) + '</span></li>'; }).join('') : '<li class="redup">Belum ada insiden. 👍</li>') + '</ul></div></div>';
      ES.$('#mnIsi').innerHTML = h;
      ES.$$('[data-f]').forEach(function (c) { c.onclick = function () { filter = c.dataset.f; gambar(); }; });
      ES.$$('[data-m]').forEach(function (c) { c.onclick = function () { mode = c.dataset.m; ES.ls.set('monMode', mode); gambar(); }; });
      ES.$$('[data-buka]').forEach(function (b) { b.onclick = function () { ES.dialogForm({ judul: 'Buka kunci sesi', sub: 'Tindakan dicatat di audit. Batas pelanggaran bertambah satu putaran.', bidang: [{ k: 'alasan', l: 'Alasan', req: true, w: true, ph: 'mis. siswa tidak sengaja menekan tombol, sudah ditegur' }, { k: 'tambahMenit', l: 'Tambah waktu (menit, opsional)', t: 'number', min: 0, max: 120, v: 0 }], kelas: 'satu', ok: 'Buka kunci', simpan: function (v) { v.sesiId = b.dataset.buka; return ES.tulisPesan('cbt.buka', v, { bersih: ['cbt.'] }).then(function () { muat(true); }); } }); }; });
      ES.$$('[data-kunci]').forEach(function (b) { b.onclick = function () { ES.konfirmasi('Bekukan sesi siswa ini?', { alasan: 'Alasan' }).then(function (a) { if (a) ES.tulisPesan('cbt.kunci', { ujianId: id, sesiId: b.dataset.kunci, alasan: a }).then(function () { muat(true); }); }); }; });
      ES.$$('[data-log]').forEach(function (b) { b.onclick = function () { lihatJawaban(b.dataset.log, false); }; });
      ES.$('#mnBeku').onclick = function () { ES.konfirmasi('Bekukan SEMUA sesi yang sedang berjalan? Siswa tidak bisa melanjutkan sampai dibuka.', { bahaya: true, alasan: 'Alasan' }).then(function (a) { if (a) ES.tulisPesan('cbt.kunci', { ujianId: id, semua: true, alasan: a }).then(function () { muat(true); }); }); };
      ES.$('#mnTutup').onclick = function () { ES.konfirmasi('Selesaikan ujian sekarang? Semua sesi aktif dinilai otomatis dan ujian ditutup.', { bahaya: true, ok: 'Selesaikan' }).then(function (ok) { if (ok) ES.tulisPesan('cbt.ujian.selesaikan', { id: id }, { bersih: ['cbt.', 'nilai.', 'dash.'] }).then(function () { ES.buka('cbt/hasil/' + id); }); }); };
      ES.$('#mnSiar').onclick = function () { ES.dialogForm({ judul: 'Pengumuman ke layar peserta', bidang: [{ k: 'pesan', l: 'Pesan', t: 'textarea', req: true, w: true, ph: 'mis. Waktu tersisa 10 menit, periksa kembali jawaban Anda.' }], kelas: 'satu', ok: 'Kirim', simpan: function (v) { return ES.tulisPesan('cbt.siaran', { ujianId: id, pesan: v.pesan }).then(function () { muat(true); }); } }); };
      const hs = ES.$('#mnHapusSiar'); if (hs) hs.onclick = function (e) { e.preventDefault(); ES.tulisPesan('cbt.siaran', { ujianId: id, pesan: '' }).then(function () { muat(true); }); };
    }
    const jamT = setInterval(function () { const e = ES.$('#mnSisa'); if (!e || !D) { if (!ES.$('#mnIsi')) clearInterval(jamT); return; } e.textContent = sisa(ES.tgl(D.ujian.selesai) - new Date()); }, 1000);
    return muat(true);
  }
  function lihatJawaban(sesiId, nilai) {
    ES.api('cbt.jawaban', { sesiId: sesiId }).then(function (d) {
      const uraian = d.rows.filter(function (r) { return r.bentuk === 'Uraian'; });
      const isi = '<div class="baris mb"><span class="bdg biru">Skor ' + d.skor + '</span>' + ES.bdgStatus(d.status) + '</div>' + d.rows.map(function (r) {
        return '<div class="kartu mb" style="padding:14px"><div class="baris antar"><b>No. ' + r.no + ' · ' + x(r.bentuk) + '</b>' + (r.benar === true ? '<span class="bdg hijau">Benar</span>' : r.benar === false ? '<span class="bdg merah">Salah</span>' : '') + '</div><div class="mt-s" style="white-space:pre-wrap">' + x(r.teks) + '</div><div class="mt-s kecil"><span class="redup">Jawaban:</span> <b>' + x(r.jawaban || '(kosong)') + '</b>' + (r.bentuk !== 'Uraian' ? ' · <span class="redup">Kunci:</span> ' + x(r.kunci) : '') + '</div>' + (r.bentuk === 'Uraian' ? '<div class="baris mt-s"><label class="kecil">Skor (0–' + r.bobot + ')</label><input type="number" class="inp" style="width:90px" min="0" max="' + r.bobot + '" step="0.5" data-ur="' + r.id + '" value="' + x(r.skorUraian) + '"></div>' : '') + '</div>';
      }).join('') + '<h4 class="mt">Log insiden</h4>' + (d.log.length ? '<ul class="timeline mt-s">' + d.log.map(function (l) { return '<li><b>' + x(l.jenis) + '</b> <span class="redup kecil">' + ES.fTglJam(l.waktu) + '</span>' + (l.ket ? '<div class="kecil">' + x(l.ket) + '</div>' : '') + '</li>'; }).join('') + '</ul>' : '<p class="redup">Tidak ada insiden.</p>');
      ES.modal({ judul: 'Jawaban — ' + d.nama, lebar: true, isi: isi, tombol: uraian.length && d.status === 'Selesai' ? [{ teks: 'Tutup', kelas: 'g' }, { teks: 'Simpan nilai uraian', kelas: 'p', klik: function (m) { const sk = {}; ES.$$('[data-ur]', m.el).forEach(function (i) { if (i.value !== '') sk[i.dataset.ur] = +i.value; }); return ES.tulisPesan('cbt.nilaiUraian', { sesiId: sesiId, skor: sk }, { bersih: ['cbt.', 'nilai.'] }).then(function () { m.tutup(); if (nilai) ES.render(); }); } }] : null });
    }).catch(function (e) { ES.toast(e.message, 'err'); });
  }

  // ---------------- hasil & analisis butir ----------------
  function hasil(el, id, masih) {
    el.innerHTML = ES.skeleton(6);
    return ES.api('cbt.hasil', { ujianId: id }).then(function (d) {
      if (!masih()) return;
      const s = d.stat, u = d.ujian;
      el.innerHTML = '<div class="remah"><a href="#/cbt">Ujian CBT</a>' + ic('chevron_right', 's') + 'Hasil</div><div class="jdl-hal"><div><h1>' + x(u.judul) + '</h1><p>' + x(u.mapel) + ' · ' + x(u.kelas) + ' · ' + ES.fTglJam(u.mulai) + '</p></div><div class="aksi"><button class="btn s" id="hsXls">' + ic('table_view') + 'Ekspor Excel</button>' + (u.status !== 'Selesai' ? '<a class="btn p" href="#/cbt/monitor/' + id + '">' + ic('monitor_heart') + 'Pantau</a>' : '') + '</div></div>' +
        '<div class="grid g4 mb">' + [['groups', 'w-biru', s.peserta, 'Peserta selesai'], ['analytics', 'w-teal', ES.fAngka(s.rerata), 'Rata-rata'], ['trending_up', 'w-hijau', s.tertinggi + ' / ' + s.terendah, 'Tertinggi / terendah'], ['verified', 'w-kuning', s.peserta ? Math.round(s.tuntas / s.peserta * 100) + '%' : '–', 'Tuntas (KKM ' + s.kkm + ')']].map(function (k) { return '<div class="kartu kpi"><div class="ik ' + k[1] + '">' + ic(k[0]) + '</div><div><div class="l">' + k[3] + '</div><div class="v">' + k[2] + '</div></div></div>'; }).join('') + '</div><div id="hsTabs"></div><div id="hsPanel"></div>';
      function panel(t) {
        if (t === 'butir') ES.$('#hsPanel').innerHTML = '<div class="kartu"><div class="kp-hd"><div><h3>Analisis butir soal</h3><p>p = tingkat kesukaran (proporsi benar) · D = daya pembeda (kelompok atas 27% − bawah 27%)</p></div></div>' + ES.tabel([{ l: 'No', k: 'no' }, { l: 'Soal', f: function (b) { return '<div style="max-width:380px">' + x(b.teks) + '</div><div class="sub">' + x(b.bentuk) + (b.level ? ' · ' + x(b.level) : '') + ' · kunci ' + x(b.kunci) + '</div>'; } }, { l: 'p', f: function (b) { return '<b>' + b.p + '</b><div class="sub">' + b.kategori + '</div>'; }, n: 1 }, { l: 'D', f: function (b) { return '<b>' + b.D + '</b><div class="sub">' + b.daya + '</div>'; }, n: 1 }, { l: 'Distribusi jawaban', f: function (b) { return Object.keys(b.distribusi).sort().map(function (k) { return '<span class="bdg ' + (k === String(b.kunci).toUpperCase() ? 'hijau' : '') + '">' + k + ': ' + b.distribusi[k] + '</span>'; }).join(' '); } }, { l: 'Saran', f: function (b) { return b.daya === 'Perlu revisi' ? '<span class="bdg merah">Revisi</span>' : b.kategori === 'Sukar' ? '<span class="bdg kuning">Tinjau</span>' : '<span class="bdg hijau">Baik</span>'; } }], d.butir) + '</div>';
        else { ES.$('#hsPanel').innerHTML = '<div class="kartu">' + ES.tabel([{ l: 'Siswa', f: function (r) { return '<b>' + x(r.nama) + '</b><div class="sub">' + x(r.nis) + '</div>'; } }, { l: 'Status', f: function (r) { return ES.bdgStatus(r.status); } }, { l: 'Skor', f: function (r) { return r.skor === null ? '' : '<b style="color:' + (r.skor < s.kkm ? 'var(--merah)' : 'inherit') + '">' + r.skor + '</b>'; }, n: 1 }, { l: 'Insiden', k: 'pelanggaran', n: 1 }, { l: 'Selesai', f: function (r) { return r.selesai ? ES.fTglJam(r.selesai) : ''; } }, { l: '', f: function (r) { return r.sesiId ? '<button class="btn ' + (r.perluNilaiUraian ? 'p' : 's') + ' kc" data-j="' + r.sesiId + '">' + (r.perluNilaiUraian ? ic('rate_review', 's') + 'Nilai uraian' : ic('visibility', 's') + 'Jawaban') + '</button>' : ''; } }], d.rows) + '</div>'; ES.$$('[data-j]').forEach(function (b) { b.onclick = function () { lihatJawaban(b.dataset.j, true); }; }); }
      }
      ES.tabs(ES.$('#hsTabs'), [['siswa', 'Nilai siswa', 'groups'], ['butir', 'Analisis butir', 'insights']], 'siswa', panel); panel('siswa');
      ES.$('#hsXls').onclick = function () { ES.xlsx('Hasil-' + u.judul.replace(/\W+/g, '-') + '.xlsx', [{ nama: 'Nilai', data: d.rows.map(function (r) { return { NIS: r.nis, Nama: r.nama, Status: r.status, Skor: r.skor === null ? '' : r.skor, Insiden: r.pelanggaran }; }) }, { nama: 'Analisis Butir', data: d.butir.map(function (b) { return { No: b.no, Bentuk: b.bentuk, Soal: b.teks, Kunci: b.kunci, p: b.p, Kesukaran: b.kategori, D: b.D, 'Daya Pembeda': b.daya, Distribusi: JSON.stringify(b.distribusi) }; }) }]); };
    });
  }

  // ================= LAYAR UJIAN SISWA =================
  ES.hal('ujian', { judul: 'Ujian', peran: ['SISWA', 'WALI_MURID'], render: function (el, p, masih) {
    if (p[0] && ES.s.me.tipe === 'siswa') return layarUjian(el, p[0]);
    el.innerHTML = '<div class="jdl-hal"><div><h1>Ujian</h1><p>Ujian CBT terjadwal dan hasilnya.</p></div></div><div class="kartu" id="usIsi">' + ES.skeleton(4) + '</div>';
    return ES.baca('cbt.ujian.list', {}, function (d) {
      if (!masih()) return; const siswa = ES.s.me.tipe === 'siswa';
      ES.$('#usIsi').innerHTML = ES.tabel([{ l: 'Ujian', f: function (u) { return '<b>' + x(u.judul) + '</b><div class="sub">' + x(u.mapel) + ' · ' + u.durasi + ' menit</div>'; } }, { l: 'Jadwal', f: function (u) { return ES.fTglJam(u.mulai) + '<div class="sub">ditutup ' + ES.fTglJam(u.selesai) + '</div>'; } }, { l: 'Status', f: function (u) { return ES.bdgStatus(u.status); } },
        { l: 'Hasil', f: function (u) { return u.sesi.map(function (s) { return s.status === 'Selesai' ? (s.skor !== null ? '<b>' + s.skor + '</b>' : '<span class="bdg hijau">Terkirim</span>') : ES.bdgStatus(s.status === 'Belum' ? '' : s.status) + (s.status === 'Belum' ? '<span class="redup">Belum dikerjakan</span>' : ''); }).join('<br>'); } },
        { l: '', f: function (u) { const s = u.sesi[0] || {}; return siswa && u.status === 'Berlangsung' && s.status !== 'Selesai' ? '<a class="btn p kc" href="#/ujian/' + u.id + '">' + ic('play_arrow', 's') + (s.status && s.status !== 'Belum' ? 'Lanjutkan' : 'Mulai') + '</a>' : ''; } }], d, { kosong: 'Tidak ada ujian', kosongIkon: 'quiz' });
    }, { ttl: 10000 });
  } });
  function layarUjian(el, ujianId) {
    const KEY = 'cbt_' + ujianId, st = ES.ls.get(KEY, null) || { jawaban: {}, ragu: {}, idx: 0, kotor: {} };
    let S = null, soal = [], offset = 0, batasMs = 0, events = [], timerT = null, simpanT = null, selesai = false, terkunci = false, siaranT = 0;
    el.innerHTML = '<div class="kartu" style="max-width:640px;margin:20px auto"><div class="kp" id="uPre">' + ES.skeleton(3) + '</div></div>';
    const pre = ES.$('#uPre');
    function persist() { ES.ls.set(KEY, st); }
    function mulaiForm(info) {
      pre.innerHTML = '<div class="baris"><div class="ik w-biru" style="width:48px;height:48px;border-radius:12px;display:grid;place-items:center">' + ic('quiz', 'l') + '</div><div><h2>' + x(info ? info.judul : 'Ujian') + '</h2><div class="redup">' + x(info ? info.mapel + ' · ' + info.durasi + ' menit' : '') + '</div></div></div>' +
        '<div class="peringatan mt">' + ic('gpp_maybe') + '<div><b>Tata tertib ujian</b><ul style="margin:6px 0 0;padding-left:18px;line-height:22px"><li>Ujian berjalan dalam <b>layar penuh</b>. Keluar layar penuh, pindah tab/aplikasi, atau salin-tempel tercatat sebagai pelanggaran.</li><li>Melewati batas pelanggaran → sesi <b>terkunci</b> dan hanya pengawas yang dapat membuka.</li><li>Jawaban tersimpan otomatis. Bila koneksi putus, lanjutkan saja — jawaban dikirim saat online.</li></ul></div></div>' +
        '<form id="uTok" class="mt"><div class="fld"><label>Token ujian (dari pengawas)</label><input class="inp" name="token" style="text-transform:uppercase;letter-spacing:.2em;font-weight:700;font-size:20px;text-align:center" autocomplete="off" maxlength="12"' + (st.sesiId ? ' placeholder="(tidak perlu — melanjutkan sesi)"' : ' required') + '></div><button class="btn p bsr mt" style="width:100%">' + ic('play_arrow') + (st.sesiId ? 'Lanjutkan ujian' : 'Mulai ujian') + '</button></form>';
      ES.$('#uTok').onsubmit = function (e) { e.preventDefault(); const tok = this.token.value.trim().toUpperCase(), btn = this.querySelector('button'); masukLayarPenuh(); ES.sibuk(btn, function () { return ES.api('cbt.mulai', { ujianId: ujianId, token: tok, perangkat: navigator.userAgent.slice(0, 80), muatUlang: !!st.sesiId }).then(siap); }).catch(function (er) { ES.toast(er.message, 'err'); keluarLayarPenuh(); }); };
    }
    ES.api('cbt.ujian.list', {}).then(function (d) { const u = d.filter(function (z) { return z.id === ujianId; })[0]; mulaiForm(u); }).catch(function () { mulaiForm(null); });
    function masukLayarPenuh() { const r = document.documentElement; if (!document.fullscreenElement && r.requestFullscreen) r.requestFullscreen({ navigationUI: 'hide' }).catch(function () { }); }
    function keluarLayarPenuh() { if (document.fullscreenElement) document.exitFullscreen().catch(function () { }); }
    function siap(d) {
      if (d.selesai) { tampilSelesai(d.skor, d.info); return; }
      S = d; soal = d.soal; st.sesiId = d.info.sesiId; Object.assign(st.jawaban, d.jawaban || {}, st.jawaban); persist();
      offset = d.info.serverTime - Date.now(); batasMs = Date.now() + d.info.sisaMs;
      bangunLayar(); pasangPenjaga(); tampilSoal(st.idx || 0); jalanTimer(); jadwalSimpan(2000);
      terapkanInfo(d.info);
    }
    let U = null;
    function bangunLayar() {
      U = document.createElement('div'); U.className = 'ujian';
      U.innerHTML = '<header class="ujian-hd"><div class="ujian-jdl"><b class="trunc" style="display:block;font-family:var(--f-judul);font-size:16px">' + x(S.ujian.judul) + '</b><div class="redup kecil">' + x(S.ujian.mapel) + ' · ' + x(ES.s.me.nama) + '</div></div><span class="bdg" id="uSimpan">' + ic('cloud_done', 's') + 'Tersimpan</span><span class="bdg" id="uPlg"></span><div class="timer" id="uTimer">--:--</div><button class="btn p" id="uSelesai">' + ic('done_all') + 'Selesai</button></header>' +
        '<div class="siaran hidden" id="uSiar"></div><div class="ujian-bd"><div class="soal-w"><div class="kartu"><div class="kp" id="uSoal"></div><div class="kp-hd" style="border-top:1px solid var(--garis);border-bottom:0"><button class="btn s" id="uPrev">' + ic('chevron_left') + 'Sebelumnya</button><label class="cek"><input type="checkbox" id="uRagu"> Ragu-ragu</label><button class="btn p" id="uNext">Berikutnya' + ic('chevron_right') + '</button></div></div></div><aside class="navsoal"><div class="baris antar mb-s"><b>Navigasi soal</b><span class="redup kecil" id="uProg"></span></div><div class="gr" id="uNav"></div><div class="kecil redup mt"><span class="bdg hijau">dijawab</span> <span class="bdg kuning">ragu</span> <span class="bdg">kosong</span></div></aside></div>';
      document.body.appendChild(U);
      ES.saatPindah = function () { lepasPenjaga(); clearInterval(timerT); clearTimeout(simpanT); if (U) U.remove(); };
      ES.$('#uPrev', U).onclick = function () { tampilSoal(st.idx - 1); }; ES.$('#uNext', U).onclick = function () { tampilSoal(st.idx + 1); };
      ES.$('#uRagu', U).onchange = function () { const q = soal[st.idx]; if (this.checked) st.ragu[q.id] = 1; else delete st.ragu[q.id]; persist(); gambarNav(); };
      ES.$('#uSelesai', U).onclick = konfirmasiSelesai;
    }
    function tampilSoal(i) {
      if (i < 0 || i >= soal.length) return; st.idx = i; persist();
      const q = soal[i], j = st.jawaban[q.id];
      let h = '<div class="baris antar mb"><span class="bdg biru">Soal ' + q.no + ' dari ' + soal.length + '</span><span class="redup kecil">' + x(q.bentuk) + ' · bobot ' + q.bobot + '</span></div><div class="soal-teks">' + x(q.teks) + '</div>' + (q.gambar ? '<img src="' + x(q.gambar) + '" alt="" style="max-width:100%;margin-top:10px;border-radius:8px">' : '');
      if (q.bentuk === 'PG' || q.bentuk === 'Benar-Salah') h += '<div class="mt">' + q.opsi.map(function (o, k) { const v = q.bentuk === 'PG' ? k : (k === 0 ? 'B' : 'S'); return '<div class="opsi' + (String(j) === String(v) ? ' on' : '') + '" data-v="' + v + '" role="radio" tabindex="0"><span class="h">' + (q.bentuk === 'PG' ? 'ABCDEF'[k] : (k === 0 ? 'B' : 'S')) + '</span><div style="padding-top:4px;white-space:pre-wrap">' + x(o) + '</div></div>'; }).join('') + '</div>';
      else h += '<textarea class="inp mt" id="uTeks" rows="' + (q.bentuk === 'Uraian' ? 10 : 2) + '" placeholder="Tulis jawaban Anda…">' + x(j || '') + '</textarea>';
      ES.$('#uSoal', U).innerHTML = h; ES.$('#uRagu', U).checked = !!st.ragu[q.id];
      ES.$('#uPrev', U).disabled = i === 0; ES.$('#uNext', U).innerHTML = i === soal.length - 1 ? 'Selesai' + ic('done_all') : 'Berikutnya' + ic('chevron_right');
      if (i === soal.length - 1) ES.$('#uNext', U).onclick = konfirmasiSelesai; else ES.$('#uNext', U).onclick = function () { tampilSoal(st.idx + 1); };
      ES.$$('.opsi', U).forEach(function (o) { o.onclick = function () { jawab(q, q.bentuk === 'PG' ? +o.dataset.v : o.dataset.v); ES.$$('.opsi', U).forEach(function (z) { z.classList.toggle('on', z === o); }); }; o.onkeydown = function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); o.click(); } }; });
      const ta = ES.$('#uTeks', U); if (ta) ta.oninput = ES.debounce(function () { jawab(q, ta.value); }, 500);
      gambarNav(); U.querySelector('.soal-w').scrollTop = 0;
    }
    function jawab(q, v) { if (terkunci) return; st.jawaban[q.id] = v; st.kotor[q.id] = 1; persist(); gambarNav(); setSimpan('menyimpan'); jadwalSimpan(1500); }
    function gambarNav() { ES.$('#uNav', U).innerHTML = soal.map(function (q, i) { const isi = st.jawaban[q.id] !== undefined && st.jawaban[q.id] !== ''; return '<button class="' + (st.ragu[q.id] ? 'ragu' : isi ? 'dijawab' : '') + (i === st.idx ? ' ini' : '') + '" data-i="' + i + '">' + q.no + '</button>'; }).join(''); ES.$$('#uNav button', U).forEach(function (b) { b.onclick = function () { tampilSoal(+b.dataset.i); }; }); const n = soal.filter(function (q) { return st.jawaban[q.id] !== undefined && st.jawaban[q.id] !== ''; }).length; ES.$('#uProg', U).textContent = n + '/' + soal.length + ' dijawab'; }
    function setSimpan(s) { const e = ES.$('#uSimpan', U); if (!e) return; e.className = 'bdg ' + (s === 'ok' ? 'hijau' : s === 'gagal' ? 'merah' : 'kuning'); e.innerHTML = s === 'ok' ? ic('cloud_done', 's') + 'Tersimpan' : s === 'gagal' ? ic('cloud_off', 's') + 'Belum terkirim' : ic('sync', 's') + 'Menyimpan…'; }
    function jadwalSimpan(ms) { clearTimeout(simpanT); simpanT = setTimeout(simpan, ms); }
    let menyimpan = false;
    function simpan() {
      if (selesai || menyimpan) return jadwalSimpan(3000);
      const delta = {}; Object.keys(st.kotor).forEach(function (k) { delta[k] = st.jawaban[k] === undefined ? '' : st.jawaban[k]; });
      const ev = events.splice(0);
      menyimpan = true;
      ES.api('cbt.simpan', { sesiId: st.sesiId, jawaban: delta, events: ev }, { timeout: 20000 }).then(function (info) {
        Object.keys(delta).forEach(function (k) { if (st.jawaban[k] === delta[k] || (st.jawaban[k] === undefined && delta[k] === '')) delete st.kotor[k]; }); persist();
        setSimpan(Object.keys(st.kotor).length ? 'menyimpan' : 'ok'); terapkanInfo(info);
      }).catch(function () { events = ev.concat(events); setSimpan('gagal'); }).then(function () { menyimpan = false; if (!selesai) jadwalSimpan(Object.keys(st.kotor).length || events.length ? 4000 : 15000); });
    }
    function terapkanInfo(info) {
      if (!info) return;
      offset = info.serverTime - Date.now(); batasMs = Date.now() + info.sisaMs;
      const pl = ES.$('#uPlg', U); if (pl) { pl.className = 'bdg ' + (info.pelanggaran ? 'merah' : ''); pl.innerHTML = ic('gpp_maybe', 's') + info.pelanggaran + '/' + info.batas + ' pelanggaran'; }
      if (info.siaran && info.siaran.pesan && info.siaran.t !== siaranT) { siaranT = info.siaran.t; const s = ES.$('#uSiar', U); s.classList.remove('hidden'); s.innerHTML = ic('campaign') + '<span>Pengawas: ' + x(info.siaran.pesan) + '</span>'; }
      else if (!info.siaran) { const s = ES.$('#uSiar', U); if (s) s.classList.add('hidden'); }
      if (info.status === 'Selesai') { tampilSelesai(info.skor, info); return; }
      if (info.status === 'Terkunci') { if (!terkunci) { terkunci = true; tirai('lock', 'Sesi ujian dikunci', 'Batas pelanggaran tercapai atau dibekukan pengawas. Hubungi pengawas untuk membuka kunci. Halaman ini akan lanjut otomatis setelah dibuka.', null); pantauKunci(); } }
      else if (terkunci) { terkunci = false; tutupTirai(); ES.toast('Sesi dibuka kembali oleh pengawas.', 'ok'); masukLayarPenuh(); }
    }
    function pantauKunci() { if (!terkunci || selesai) return; ES.api('cbt.status', { sesiId: st.sesiId }).then(terapkanInfo).catch(function () { }).then(function () { if (terkunci) setTimeout(pantauKunci, 5000); }); }
    function jalanTimer() { timerT = setInterval(function () { const ms = batasMs - Date.now(), t = ES.$('#uTimer', U); if (!t) return; t.textContent = sisa(ms); t.classList.toggle('kritis', ms < 300000); if (ms <= 0 && !selesai) { clearInterval(timerT); kirimSelesai(true); } }, 500); }
    let tir = null;
    function tirai(ikon, judul, teks, tombol) { tutupTirai(); tir = document.createElement('div'); tir.className = 'tirai'; tir.innerHTML = '<div style="max-width:460px">' + ic(ikon, 'xl') + '<h2 style="color:#fff;margin-top:12px">' + x(judul) + '</h2><p style="color:#cbd5e1;line-height:22px">' + x(teks) + '</p>' + (tombol ? '<button class="btn p bsr mt" id="tirBtn">' + x(tombol) + '</button>' : '') + '</div>'; document.body.appendChild(tir); const b = ES.$('#tirBtn'); if (b) b.onclick = function () { masukLayarPenuh(); tutupTirai(); }; }
    function tutupTirai() { if (tir) { tir.remove(); tir = null; } }
    // ---- penjaga anti-kecurangan (pencegahan & pencatatan; bukan jaminan mutlak) ----
    let terakhirEv = {};
    function catatEv(jenis, ket) { if (selesai || terkunci) return; const now = Date.now(); if (terakhirEv[jenis] && now - terakhirEv[jenis] < 3000) return; if ((jenis === 'Blur_Window' && terakhirEv.Pindah_Tab && now - terakhirEv.Pindah_Tab < 1500) || (jenis === 'Pindah_Tab' && terakhirEv.Blur_Window && now - terakhirEv.Blur_Window < 1500)) return; terakhirEv[jenis] = now; events.push({ jenis: jenis, ket: ket || '' }); ES.toast('Peringatan: ' + LABEL_PLG[jenis] + ' tercatat sebagai pelanggaran.', 'warn'); jadwalSimpan(200); }
    const H = {
      vis: function () { if (document.hidden) catatEv('Pindah_Tab', 'Halaman tersembunyi'); },
      blur: function () { setTimeout(function () { if (!document.hasFocus() && !document.hidden) catatEv('Blur_Window', 'Fokus jendela hilang'); }, 300); },
      fs: function () { if (!document.fullscreenElement && !selesai && !terkunci) { catatEv('Keluar_Fullscreen', 'Keluar dari layar penuh'); tirai('fullscreen', 'Kembali ke layar penuh', 'Keluar dari layar penuh tercatat sebagai pelanggaran. Klik tombol di bawah untuk melanjutkan ujian.', 'Lanjutkan dalam layar penuh'); } },
      cp: function (e) { e.preventDefault(); catatEv('Copy_Paste', e.type); },
      ctx: function (e) { e.preventDefault(); },
      key: function (e) { const k = (e.key || '').toLowerCase(); if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'p', 's', 'u', 'a'].indexOf(k) >= 0 && !(k === 'a' && e.target.tagName === 'TEXTAREA')) { e.preventDefault(); if (k !== 'a') catatEv('Copy_Paste', 'Pintasan ' + k.toUpperCase()); } if (k === 'printscreen' || k === 'f12') { e.preventDefault(); catatEv('Lainnya', 'Tombol ' + e.key); } },
      unload: function (e) { if (!selesai) { e.preventDefault(); e.returnValue = ''; } }
    };
    function pasangPenjaga() { document.addEventListener('visibilitychange', H.vis); window.addEventListener('blur', H.blur); document.addEventListener('fullscreenchange', H.fs); ['copy', 'cut', 'paste'].forEach(function (t) { document.addEventListener(t, H.cp); }); document.addEventListener('contextmenu', H.ctx); document.addEventListener('keydown', H.key); window.addEventListener('beforeunload', H.unload); }
    function lepasPenjaga() { document.removeEventListener('visibilitychange', H.vis); window.removeEventListener('blur', H.blur); document.removeEventListener('fullscreenchange', H.fs); ['copy', 'cut', 'paste'].forEach(function (t) { document.removeEventListener(t, H.cp); }); document.removeEventListener('contextmenu', H.ctx); document.removeEventListener('keydown', H.key); window.removeEventListener('beforeunload', H.unload); }
    function konfirmasiSelesai() {
      const kosong = soal.filter(function (q) { return st.jawaban[q.id] === undefined || st.jawaban[q.id] === ''; }).length, ragu = Object.keys(st.ragu).length;
      ES.konfirmasi((kosong ? kosong + ' soal belum dijawab. ' : '') + (ragu ? ragu + ' soal ditandai ragu-ragu. ' : '') + 'Kirim jawaban sekarang? Setelah dikirim, jawaban tidak dapat diubah.', { judul: 'Selesaikan ujian', ok: 'Kirim jawaban' }).then(function (ok) { if (ok) kirimSelesai(false); });
    }
    function kirimSelesai(otomatis) {
      if (selesai) return; selesai = true; clearTimeout(simpanT); lepasPenjaga();
      tirai('cloud_upload', otomatis ? 'Waktu habis — mengirim jawaban…' : 'Mengirim jawaban…', 'Jangan tutup halaman ini.', null);
      const semua = {}; soal.forEach(function (q) { if (st.jawaban[q.id] !== undefined) semua[q.id] = st.jawaban[q.id]; });
      (function coba(n) { ES.api('cbt.selesai', { sesiId: st.sesiId, jawaban: semua }).then(function (d) { tampilSelesai(d.skor, d); }).catch(function (e) { if (n < 5) setTimeout(function () { coba(n + 1); }, 3000); else { tirai('cloud_off', 'Gagal mengirim', e.message + ' — jawaban aman di perangkat ini. Hubungi pengawas.', null); selesai = false; } }); })(0);
    }
    function tampilSelesai(skor, info) {
      selesai = true; lepasPenjaga(); clearInterval(timerT); clearTimeout(simpanT); ES.ls.del(KEY); keluarLayarPenuh();
      tirai('task_alt', 'Ujian selesai — jawaban terkirim', skor !== null && skor !== undefined ? 'Skor Anda: ' + ES.fAngka(skor) + '. Nilai akhir dapat berubah bila ada soal uraian yang dinilai guru.' : 'Terima kasih. Nilai akan diumumkan oleh guru.', null);
      setTimeout(function () { tutupTirai(); if (U) U.remove(); ES.invalidasi(['cbt.', 'dash.']); ES.buka('ujian'); }, 3500);
    }
  }
})();
