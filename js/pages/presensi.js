/* Modul C — Presensi: harian, terminal QR + verifikasi wajah (face-api.js di browser), rekap, kartu QR, pendaftaran wajah, izin. */
(function () {
  const x = ES.x, ic = ES.ic, P = function () { return ES.PERAN; };
  const STATUS = ['Hadir', 'Terlambat', 'Sakit', 'Izin', 'Alpa'];
  function pilihKelas(sel, semua) { const k = ES.kelasSaya(); return '<select class="inp" id="pkKelas" style="max-width:220px">' + (semua ? '<option value="">Semua kelas</option>' : '') + k.map(function (z) { return '<option value="' + z.id + '"' + (z.id === sel ? ' selected' : '') + '>' + x(z.nama) + '</option>'; }).join('') + '</select>'; }

  ES.hal('presensi', { judul: 'Presensi', peran: ['SUPER_ADMIN', 'KEPSEK', 'GURU', 'WALI_KELAS', 'BK'], render: function (el, p, masih) {
    const tab = p[0] || 'harian', kelas = p[1] || ES.ls.get('prKelas', '') || ((ES.s.me.kelasWali || [])[0]) || ((ES.kelasSaya()[0] || {}).id || '');
    el.innerHTML = '<div class="jdl-hal"><div><h1>Presensi Siswa</h1><p>QR Code + verifikasi wajah · ' + ES.fHari(ES.hariIni()) + '</p></div><div class="aksi"><a class="btn p" href="#/terminal">' + ic('qr_code_scanner') + 'Buka Terminal</a></div></div><div id="prTabs"></div><div id="prIsi"></div>';
    const tabs = [['harian', 'Harian', 'today'], ['rekap', 'Rekap & Ekspor', 'table_chart'], ['kartu', 'Kartu QR', 'qr_code_2'], ['wajah', 'Data Wajah', 'face'], ['gagal', 'Log Gagal', 'report']];
    ES.tabs(ES.$('#prTabs'), tabs, tab, function (t) { ES.buka('presensi/' + t + (kelas ? '/' + kelas : '')); });
    const isi = ES.$('#prIsi');
    return ({ harian: harian, rekap: rekap, kartu: kartu, wajah: wajah, gagal: logGagal }[tab] || harian)(isi, kelas, masih);
  } });

  // ---------------- harian ----------------
  function harian(el, kelas, masih) {
    const tgl = ES.ls.get('prTgl', '') && ES.ls.get('prTglSet', '') === ES.hariIni() ? ES.ls.get('prTgl') : ES.hariIni();
    el.innerHTML = '<div class="kartu"><div class="kp-hd"><div class="baris">' + pilihKelas(kelas, ES.punya([P().SA, P().KS, P().BK])) + '<input type="date" class="inp" id="prTgl" value="' + tgl + '" style="max-width:170px"></div><div class="baris" id="prChip"></div></div><div id="prTbl">' + ES.skeleton(6) + '</div></div>';
    let filter = '', data = null;
    function muat() {
      const k = ES.$('#pkKelas').value, t = ES.$('#prTgl').value; ES.ls.set('prKelas', k); ES.ls.set('prTgl', t); ES.ls.set('prTglSet', ES.hariIni());
      return ES.baca('pres.harian', { kelas: k, tanggal: t }, function (d) { if (!masih()) return; data = d; gambar(); }, { ttl: 10000 });
    }
    function gambar() {
      const n = data.ringkas;
      ES.$('#prChip').innerHTML = [['', 'Semua', n.total], ['Hadir', 'Hadir', n.Hadir], ['Terlambat', 'Terlambat', n.Terlambat], ['IzinSakit', 'Izin/Sakit', (n.Izin || 0) + (n.Sakit || 0)], ['Alpa', 'Alpa', n.Alpa], ['Belum Hadir', 'Belum', n['Belum Hadir']]].map(function (c) { return '<button class="chip' + (filter === c[0] ? ' on' : '') + '" data-f="' + c[0] + '">' + c[1] + ' <span class="n">' + (c[2] || 0) + '</span></button>'; }).join('');
      const rows = data.rows.filter(function (r) { return !filter || (filter === 'IzinSakit' ? (r.status === 'Izin' || r.status === 'Sakit') : r.status === filter); });
      const bisa = ES.punya([P().SA, P().GR, P().WK]);
      ES.$('#prTbl').innerHTML = ES.tabel([
        { l: 'Siswa', f: function (r) { return '<div class="baris" style="flex-wrap:nowrap"><span class="av s">' + x(ES.inisial(r.nama)) + '</span><div><b>' + x(r.nama) + '</b><div class="sub">No. ' + r.absen + ' · ' + x(r.kelas) + '</div></div></div>'; } },
        { l: 'NIS', k: 'nis', kelas: 'num' }, { l: 'Jam', f: function (r) { return r.jam ? '<span class="num">' + ES.fJam(r.jam) + '</span>' : ''; } },
        { l: 'Metode', f: function (r) { return r.metode ? ic(r.metode.indexOf('Wajah') >= 0 ? 'face' : r.metode === 'Manual' ? 'edit_note' : 'qr_code', 's') + ' ' + x(r.metode) + (r.skor ? ' <span class="redup">' + ES.fAngka(r.skor) + '%</span>' : '') : (r.wajah ? '' : '<span class="redup kecil">wajah belum terdaftar</span>'); } },
        { l: 'Status', f: function (r) { return ES.bdgStatus(r.status) + (r.ket ? '<div class="sub">' + x(r.ket) + '</div>' : ''); } },
        { l: '', f: function (r) { return bisa ? '<button class="btn g kc ik-s" data-ubah="' + r.id + '" title="Ubah status">' + ic('more_vert', 's') + '</button>' : ''; } }
      ], rows, { kosong: 'Tidak ada siswa', idBaris: function (r) { return r.id; } });
      ES.$$('#prChip .chip').forEach(function (c) { c.onclick = function () { filter = c.dataset.f; gambar(); }; });
      ES.$$('[data-ubah]').forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); menuUbah(b, data.rows.filter(function (r) { return r.id === b.dataset.ubah; })[0]); }; });
    }
    function menuUbah(btn, r) {
      const it = STATUS.map(function (s) { return { ikon: s === 'Hadir' ? 'check_circle' : s === 'Terlambat' ? 'schedule' : s === 'Alpa' ? 'cancel' : 'medical_services', teks: 'Tandai ' + s, klik: function () { ubah(r, s); } }; });
      if (ES.punya([P().SA, P().WK])) it.push('-', { ikon: 'date_range', teks: 'Izin / sakit beberapa hari…', klik: function () { izinRentang(r); } });
      ES.menuPop(btn, it);
    }
    function ubah(r, status) {
      ES.konfirmasi('Ubah status ' + r.nama + ' menjadi ' + status + '?', { judul: 'Presensi manual', alasan: 'Alasan (tercatat di audit)', ok: 'Simpan' }).then(function (alasan) {
        if (!alasan) return;
        const lama = r.status; r.status = status; r.metode = 'Manual'; r.ket = alasan; gambar(); // optimistik
        ES.tulis('pres.manual', { siswaId: r.id, status: status, alasan: alasan, tanggal: ES.$('#prTgl').value }, { bersih: ['pres.', 'dash.'] }).then(function () { ES.toast('Presensi ' + r.nama + ': ' + status, 'ok'); }, function () { r.status = lama; gambar(); });
      });
    }
    function izinRentang(r) {
      ES.dialogForm({ judul: 'Izin / sakit — ' + r.nama, bidang: [{ k: 'status', l: 'Jenis', t: 'select', o: ['Sakit', 'Izin'], req: true, kosong: false }, { k: 'dari', l: 'Dari tanggal', t: 'date', req: true, v: ES.hariIni() }, { k: 'sampai', l: 'Sampai tanggal', t: 'date', req: true, v: ES.hariIni() }, { k: 'keterangan', l: 'Keterangan', t: 'textarea', w: true, ph: 'mis. surat dokter' }],
        simpan: function (v) { v.siswaId = r.id; return ES.tulisPesan('pres.izin', v, { bersih: ['pres.', 'dash.'] }).then(muat); } });
    }
    ES.$('#pkKelas').onchange = muat; ES.$('#prTgl').onchange = muat;
    return muat();
  }

  // ---------------- rekap ----------------
  function rekap(el, kelas) {
    const s = ES.hariIni(), d0 = s.slice(0, 8) + '01';
    el.innerHTML = '<div class="kartu"><div class="kp-hd"><div class="baris">' + pilihKelas(kelas, ES.punya([P().SA, P().KS, P().BK])) + '<input type="date" class="inp" id="rkDari" value="' + d0 + '" style="max-width:165px"><span class="redup">s.d.</span><input type="date" class="inp" id="rkSampai" value="' + s + '" style="max-width:165px"><button class="btn s" id="rkMuat">' + ic('refresh') + 'Tampilkan</button></div><div class="baris"><button class="btn s" id="rkXls">' + ic('table_view') + 'Excel</button><button class="btn s" id="rkPdf">' + ic('picture_as_pdf') + 'PDF</button></div></div><div class="kp" style="height:220px"><canvas id="rkCv"></canvas></div><div id="rkTbl">' + ES.skeleton(5) + '</div></div>';
    let d = null, ch = null;
    function muat() {
      ES.$('#rkTbl').innerHTML = ES.skeleton(5);
      return ES.api('pres.rekap', { kelas: ES.$('#pkKelas').value, dari: ES.$('#rkDari').value, sampai: ES.$('#rkSampai').value, matriks: true }).then(function (r) {
        d = r;
        ES.$('#rkTbl').innerHTML = ES.tabel([{ l: 'Siswa', f: function (z) { return '<b>' + x(z.nama) + '</b><div class="sub">' + x(z.nis) + ' · ' + x(z.kelas) + '</div>'; } }, { l: 'H', k: 'Hadir', n: 1 }, { l: 'T', k: 'Terlambat', n: 1 }, { l: 'S', k: 'Sakit', n: 1 }, { l: 'I', k: 'Izin', n: 1 }, { l: 'A', f: function (z) { return z.Alpa ? '<b style="color:var(--merah)">' + z.Alpa + '</b>' : '0'; }, n: 1 }, { l: '% Hadir', f: function (z) { return '<b>' + ES.fAngka(z.persen) + '</b>'; }, n: 1 }], r.rows, { kosong: 'Belum ada data presensi pada rentang ini' });
        ES.chart().then(function (Chart) { const cv = ES.$('#rkCv'); if (!cv) return; if (ch) ch.destroy(); ch = new Chart(cv, { type: 'line', data: { labels: r.harian.map(function (h) { return ES.fTgl(h.tanggal).slice(0, 6); }), datasets: [{ label: '% hadir', data: r.harian.map(function (h) { const t = h.Hadir + h.Terlambat + h.Sakit + h.Izin + h.Alpa; return t ? Math.round((h.Hadir + h.Terlambat) / t * 1000) / 10 : null; }), borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,.12)', fill: true, tension: .3, pointRadius: 3 }] }, options: { maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 100 } } } }); });
      }).catch(function (e) { ES.$('#rkTbl').innerHTML = ES.galat(e); });
    }
    ES.$('#rkMuat').onclick = muat;
    ES.$('#rkXls').onclick = function () { if (!d) return; const tg = d.tanggal; ES.xlsx('Rekap-Presensi-' + d.dari + '_' + d.sampai + '.xlsx', [{ nama: 'Rekap', data: d.rows.map(function (z) { return { NIS: z.nis, Nama: z.nama, Kelas: z.kelas, Hadir: z.Hadir, Terlambat: z.Terlambat, Sakit: z.Sakit, Izin: z.Izin, Alpa: z.Alpa, 'Persen Hadir': z.persen }; }), lebar: [12, 30, 10, 8, 10, 8, 8, 8, 12] }, { nama: 'Matriks Harian', data: [['NIS', 'Nama'].concat(tg.map(function (t) { return t.slice(5); }))].concat(d.rows.map(function (z) { return [z.nis, z.nama].concat(tg.map(function (t) { return (z.hari || {})[t] || ''; })); })) }]); };
    ES.$('#rkPdf').onclick = function () { if (!d) return; ES.pdfTabel('Rekap-Presensi.pdf', 'Rekap Presensi ' + (ES.namaKelas(ES.$('#pkKelas').value) || 'Semua Kelas'), ES.fTgl(d.dari, true) + ' – ' + ES.fTgl(d.sampai, true), ['No', 'NIS', 'Nama', 'Kelas', 'H', 'T', 'S', 'I', 'A', '%'], d.rows.map(function (z, i) { return [i + 1, z.nis, z.nama, z.kelas, z.Hadir, z.Terlambat, z.Sakit, z.Izin, z.Alpa, z.persen]; })); };
    return muat();
  }

  // ---------------- kartu QR ----------------
  function kartu(el, kelas) {
    el.innerHTML = '<div class="kartu"><div class="kp-hd tidak-cetak"><div class="baris">' + pilihKelas(kelas) + '<button class="btn s" id="kqMuat">' + ic('refresh') + 'Buat kartu</button></div><button class="btn p" data-cetak>' + ic('print') + 'Cetak (A4)</button></div><div class="kp"><div class="peringatan info tidak-cetak mb">' + ic('info') + '<span>Kartu berisi kode unik siswa. Cetak di kertas tebal / laminasi. Bila kartu hilang, buat token baru di Pengaturan → Data Siswa (kartu lama otomatis tidak berlaku).</span></div><div id="kqIsi" class="grid-kartu"></div></div></div>';
    function muat() {
      ES.$('#kqIsi').innerHTML = ES.skeleton(2, 120);
      return ES.api('pres.kartu', { kelas: ES.$('#pkKelas').value }).then(function (d) {
        return Promise.all(d.rows.map(function (s) { return ES.qrDataUrl('ES1:' + s.token, 5).then(function (u) { return '<div class="kartu-qr"><div class="kq-hd">' + x(d.sekolah || 'EduSmart') + '<div style="font-weight:400;font-size:6.5pt;opacity:.8">KARTU PRESENSI SISWA · TA ' + x(d.ta || '') + '</div></div><div class="kq-qr"><img src="' + u + '" alt="QR"></div><div class="kq-isi"><b>' + x(s.nama) + '</b>NIS ' + x(s.nis) + '<br>NISN ' + x(s.nisn || '-') + '<br>Kelas ' + x(d.kelas) + ' · No. ' + s.absen + '<br><span style="color:#64748b;font-size:6.5pt">Tunjukkan QR ke kamera terminal presensi.</span></div></div>'; }); })).then(function (h) { ES.$('#kqIsi').innerHTML = h.join('') || ES.kosong('Tidak ada siswa'); });
      }).catch(function (e) { ES.$('#kqIsi').innerHTML = ES.galat(e); });
    }
    ES.$('#kqMuat').onclick = muat; ES.$('#pkKelas').onchange = muat;
    return muat();
  }

  // ---------------- data wajah ----------------
  function wajah(el, kelas, masih) {
    el.innerHTML = '<div class="kartu"><div class="kp-hd"><div class="baris">' + pilihKelas(kelas) + '</div><span class="redup kecil">Wajah disimpan sebagai vektor angka (bukan foto) untuk verifikasi; foto kecil hanya untuk konfirmasi wali kelas.</span></div><div id="wjTbl">' + ES.skeleton(5) + '</div></div>';
    function muat() {
      return ES.baca('pres.harian', { kelas: ES.$('#pkKelas').value, tanggal: ES.hariIni() }, function (d) {
        if (!masih()) return;
        ES.$('#wjTbl').innerHTML = ES.tabel([{ l: 'Siswa', f: function (r) { return '<b>' + x(r.nama) + '</b><div class="sub">No. ' + r.absen + ' · ' + x(r.nis) + '</div>'; } }, { l: 'Status wajah', f: function (r) { return r.wajah ? '<span class="bdg hijau">' + ic('face', 's') + 'Terdaftar</span>' : '<span class="bdg">Belum</span>'; } }, { l: '', f: function (r) { return '<button class="btn s kc" data-daftar="' + r.id + '">' + ic('add_a_photo', 's') + (r.wajah ? 'Daftar ulang' : 'Daftarkan') + '</button>' + (r.wajah && ES.punya([P().SA, P().WK]) ? ' <button class="btn g kc" data-hapus="' + r.id + '">' + ic('delete', 's') + '</button>' : ''); } }], d.rows);
        ES.$$('[data-daftar]').forEach(function (b) { b.onclick = function () { const r = d.rows.filter(function (z) { return z.id === b.dataset.daftar; })[0]; daftarWajah(r).then(function (ok) { if (ok) { ES.invalidasi('pres.'); muat(); } }); }; });
        ES.$$('[data-hapus]').forEach(function (b) { b.onclick = function () { ES.konfirmasi('Hapus data wajah siswa ini?', { bahaya: true }).then(function (ok) { if (ok) ES.tulisPesan('pres.wajahHapus', { siswaId: b.dataset.hapus }, { bersih: ['pres.'] }).then(muat); }); }; });
      });
    }
    ES.$('#pkKelas').onchange = muat;
    return muat();
  }

  // ---------------- face-api (dimuat saat dibutuhkan) ----------------
  let faceSiap = null;
  ES.muatWajah = function () {
    if (faceSiap) return faceSiap;
    faceSiap = ES.muatSkrip('vendor/face-api.js').then(function () {
      const fa = window.faceapi;
      return Promise.all([fa.nets.tinyFaceDetector.loadFromUri('models'), fa.nets.faceLandmark68TinyNet.loadFromUri('models'), fa.nets.faceRecognitionNet.loadFromUri('models')]).then(function () { return fa; });
    });
    faceSiap.catch(function () { faceSiap = null; });
    return faceSiap;
  };
  function deskriptor(fa, video) { return fa.detectSingleFace(video, new fa.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: .5 })).withFaceLandmarks(true).withFaceDescriptor(); }
  function skorWajah(desc, sampel) { let best = 0; (sampel || []).forEach(function (s) { let d = 0; for (let i = 0; i < 128; i++) { const t = desc[i] - s[i]; d += t * t; } const sk = Math.max(0, 100 * (1 - d / 2)); if (sk > best) best = sk; }); return Math.round(best * 10) / 10; }
  ES.skorWajah = skorWajah;
  function kamera(video, depan) { return navigator.mediaDevices.getUserMedia({ video: { facingMode: depan ? 'user' : 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false }).then(function (s) { video.srcObject = s; return video.play().then(function () { return s; }); }); }
  function stop(s) { if (s) s.getTracks().forEach(function (t) { t.stop(); }); }
  function daftarWajah(r) {
    return new Promise(function (res) {
      let stream = null, sampel = [], foto = '', selesai = false;
      const m = ES.modal({ judul: 'Daftarkan wajah — ' + r.nama, sub: 'Ambil 3–5 foto: hadap depan, sedikit ke kiri, sedikit ke kanan. Pencahayaan cukup, tanpa masker.', lebar: true,
        isi: '<div class="grid g-2-1"><div style="position:relative;background:#000;border-radius:12px;overflow:hidden;aspect-ratio:4/3"><video id="wjV" playsinline muted style="width:100%;height:100%;object-fit:cover;transform:scaleX(-1)"></video><div id="wjMsg" class="kiosk-status proses" style="bottom:12px;left:12px;right:12px;padding:8px 12px;font-size:13px">' + ic('hourglass_top') + 'Memuat model pengenalan wajah…</div></div><div><div class="label-sm">Sampel terambil</div><div id="wjN" style="font:700 40px var(--f-judul)">0/5</div><div class="prog mt-s"><i id="wjP" style="width:0"></i></div><button class="btn p bsr mt" id="wjAmbil" style="width:100%" disabled>' + ic('photo_camera') + 'Ambil sampel</button><p class="redup kecil">Minimal 2 sampel, disarankan 3–5.</p></div></div>',
        saatTutup: function () { stop(stream); res(selesai); },
        tombol: [{ teks: 'Batal', kelas: 'g' }, { teks: 'Simpan', kelas: 'p', ikon: 'save', klik: function (mm) { if (sampel.length < 2) { ES.toast('Ambil minimal 2 sampel.', 'warn'); return; } return ES.tulisPesan('pres.enroll', { siswaId: r.id, descriptors: sampel, foto: foto }, { bersih: ['pres.'] }).then(function () { selesai = true; mm.tutup(); }); } }] });
      const v = ES.$('#wjV', m.el), msg = ES.$('#wjMsg', m.el), btn = ES.$('#wjAmbil', m.el);
      Promise.all([ES.muatWajah(), kamera(v, true)]).then(function (a) {
        stream = a[1]; const fa = a[0]; msg.innerHTML = ic('check_circle') + 'Siap. Posisikan wajah di tengah lalu ambil sampel.'; btn.disabled = false;
        btn.onclick = function () {
          if (sampel.length >= 5) return;
          ES.sibuk(btn, function () { return deskriptor(fa, v).then(function (h) {
            if (!h) { msg.innerHTML = ic('error') + 'Wajah tidak terdeteksi. Dekatkan & perbaiki cahaya.'; msg.className = 'kiosk-status gagal'; return; }
            sampel.push(Array.from(h.descriptor).map(function (n) { return Math.round(n * 10000) / 10000; }));
            if (!foto) { const c = document.createElement('canvas'), b = h.detection.box, pad = 40; c.width = 160; c.height = 160; c.getContext('2d').drawImage(v, Math.max(0, b.x - pad), Math.max(0, b.y - pad), b.width + pad * 2, b.height + pad * 2, 0, 0, 160, 160); foto = c.toDataURL('image/jpeg', .7).split(',')[1]; }
            ES.$('#wjN', m.el).textContent = sampel.length + '/5'; ES.$('#wjP', m.el).style.width = (sampel.length * 20) + '%';
            msg.className = 'kiosk-status ok'; msg.innerHTML = ic('check_circle') + 'Sampel ' + sampel.length + ' tersimpan (kualitas ' + Math.round(h.detection.score * 100) + '%).';
          }); });
        };
      }).catch(function (e) { msg.className = 'kiosk-status gagal'; msg.innerHTML = ic('error') + x(e.name === 'NotAllowedError' ? 'Izin kamera ditolak. Izinkan kamera di pengaturan browser.' : e.message); });
    });
  }

  // ---------------- log gagal ----------------
  function logGagal(el, kelas) {
    el.innerHTML = '<div class="kartu"><div class="kp-hd"><div><h3>Verifikasi gagal</h3><p>QR tidak dikenal, wajah tidak cocok, atau di bawah ambang skor.</p></div>' + pilihKelas(kelas, true) + '</div><div id="lgTbl">' + ES.skeleton(4) + '</div></div>';
    function muat() { return ES.api('pres.logGagal', { kelas: ES.$('#pkKelas').value }).then(function (r) { ES.$('#lgTbl').innerHTML = ES.tabel([{ l: 'Waktu', f: function (z) { return ES.fTglJam(z.waktu); } }, { l: 'Siswa', f: function (z) { return x(z.nama || '(tidak dikenal)'); } }, { l: 'Alasan', k: 'alasan' }, { l: 'Skor', f: function (z) { return z.skor ? ES.fAngka(z.skor) + '%' : ''; }, n: 1 }, { l: 'Perangkat', k: 'perangkat' }], r, { kosong: 'Tidak ada verifikasi gagal' }); }).catch(function (e) { ES.$('#lgTbl').innerHTML = ES.galat(e); }); }
    ES.$('#pkKelas').onchange = muat; return muat();
  }

  // ================= TERMINAL (kiosk) =================
  const ANTRE = 'antrePres';
  ES.sinkronAntrean = function () {
    const q = ES.ls.get(ANTRE, []); if (!q.length || !ES.daring()) return Promise.resolve(0);
    const kirim = q.slice(0, 50);
    return ES.api('pres.scan', { items: kirim }).then(function (d) {
      const sisa = ES.ls.get(ANTRE, []).filter(function (it) { return !kirim.some(function (k) { return k.cid === it.cid; }); }); ES.ls.set(ANTRE, sisa);
      ES.invalidasi(['pres.', 'dash.']); if (ES.saatSinkron) ES.saatSinkron(d.hasil); return d.hasil.length;
    }).catch(function () { return 0; });
  };
  setInterval(function () { if (ES.ls.get(ANTRE, []).length) ES.sinkronAntrean(); }, 15000);
  function bunyi(ok) { try { const a = new (window.AudioContext || window.webkitAudioContext)(), o = a.createOscillator(), g = a.createGain(); o.connect(g); g.connect(a.destination); o.frequency.value = ok ? 880 : 220; g.gain.value = .08; o.start(); o.stop(a.currentTime + (ok ? .12 : .35)); setTimeout(function () { a.close(); }, 600); } catch (e) { } }

  ES.hal('terminal', { judul: 'Terminal Presensi', peran: ['SUPER_ADMIN', 'KEPSEK', 'GURU', 'WALI_KELAS'], render: function (el, p) {
    const pimpinan = ES.punya([P().SA, P().KS]);
    let kelas = p[0] || ES.ls.get('tmKelas', '') || (pimpinan ? 'SEMUA' : ((ES.s.me.kelasWali || [])[0] || (ES.kelasSaya()[0] || {}).id || ''));
    let D = null, stream = null, depan = ES.ls.get('tmDepan', true), fa = null, jalan = true, sibuk = false, jeda = {}, log = [], tokMap = {};
    const kv = document.createElement('div'); kv.className = 'kiosk';
    kv.innerHTML = '<section class="kiosk-kam"><video id="tmV" playsinline muted></video><canvas class="ov" id="tmOv"></canvas><div class="kiosk-hd"><div><div class="baris"><span class="titik-hidup"></span><b>Terminal presensi aktif</b><span class="bdg" id="tmSync" style="background:#111c33;color:#93c5fd"></span></div><div class="redup kecil mt-s" id="tmInfo">Memuat…</div></div><div style="text-align:right"><div class="jam-besar" id="tmJam">--:--</div><div class="redup kecil" id="tmTgl"></div></div></div><div class="bingkai" id="tmBingkai"><div class="garis-pindai"></div></div>' +
      '<div class="kiosk-status proses" id="tmStatus">' + ic('qr_code_scanner', 'l') + '<div><b>Arahkan kartu QR ke kamera</b><div class="redup kecil">Jarak 20–40 cm. Wajah akan diverifikasi setelah QR terbaca.</div></div></div></section>' +
      '<section class="kiosk-pnl"><div class="kp-hd"><div class="baris"><select class="inp" id="tmKelas" style="max-width:200px">' + (pimpinan ? '<option value="SEMUA">Mode gerbang (semua kelas)</option>' : '') + ES.kelasSaya().map(function (k) { return '<option value="' + k.id + '"' + (k.id === kelas ? ' selected' : '') + '>' + x(k.nama) + '</option>'; }).join('') + '</select><button class="btn s kc ik-s" id="tmFlip" title="Ganti kamera">' + ic('flip_camera_ios', 's') + '</button><button class="btn s kc ik-s" id="tmManual" title="Presensi manual">' + ic('edit_note', 's') + '</button><button class="btn s kc ik-s" id="tmLayar" title="Layar penuh">' + ic('fullscreen', 's') + '</button></div><button class="btn s kc" id="tmTutup">' + ic('close', 's') + 'Tutup</button></div>' +
      '<div class="kiosk-stat"><div><small>Total</small><b id="stT">0</b></div><div><small>Hadir</small><b id="stH" style="color:#4ade80">0</b></div><div><small>Terlambat</small><b id="stL" style="color:#fbbf24">0</b></div><div><small>Belum</small><b id="stB" style="color:#f87171">0</b></div></div>' +
      '<div class="kp-hd" style="padding:10px 20px"><b>Pindaian terakhir</b><span class="redup kecil" id="tmQ"></span></div><div class="kiosk-log" id="tmLog"><div class="redup kecil" style="padding:20px;text-align:center">Belum ada pindaian.</div></div></section>';
    document.body.appendChild(kv);
    const V = ES.$('#tmV', kv), OV = ES.$('#tmOv', kv), cv = document.createElement('canvas'), cx = cv.getContext('2d', { willReadFrequently: true });
    function tutup() { jalan = false; stop(stream); kv.remove(); clearInterval(tJam); if (document.fullscreenElement) document.exitFullscreen().catch(function () { }); }
    ES.saatPindah = tutup;
    ES.$('#tmTutup', kv).onclick = function () { tutup(); ES.kembali('presensi'); };
    ES.$('#tmLayar', kv).onclick = function () { if (!document.fullscreenElement) kv.requestFullscreen().catch(function () { }); else document.exitFullscreen(); };
    const tJam = setInterval(function () { const n = new Date(); ES.$('#tmJam', kv).textContent = String(n.getHours()).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0') + ':' + String(n.getSeconds()).padStart(2, '0'); ES.$('#tmTgl', kv).textContent = ES.fHari(ES.hariIni()); const q = ES.ls.get(ANTRE, []).length; ES.$('#tmQ', kv).textContent = q ? q + ' menunggu sinkron' : ''; ES.$('#tmSync', kv).textContent = ES.daring() ? 'Daring' : 'Luring — tersimpan lokal'; }, 1000);
    function status(kelasCss, ikon, judul, sub) { const s = ES.$('#tmStatus', kv); s.className = 'kiosk-status ' + kelasCss; s.innerHTML = ic(ikon, 'l') + '<div><b>' + judul + '</b><div class="redup kecil">' + (sub || '') + '</div></div>'; ES.$('#tmBingkai', kv).className = 'bingkai' + (kelasCss === 'ok' ? ' ok' : kelasCss === 'gagal' ? ' gagal' : ''); }
    function statistik() { if (!D) return; let h = 0, l = 0; Object.keys(D.hariIni).forEach(function (k) { const s = D.hariIni[k].status; if (s === 'Hadir') h++; else if (s === 'Terlambat') l++; }); const t = D.siswa.length, sudah = Object.keys(D.hariIni).length; ES.$('#stT', kv).textContent = t; ES.$('#stH', kv).textContent = h; ES.$('#stL', kv).textContent = l; ES.$('#stB', kv).textContent = Math.max(0, t - sudah); }
    function gambarLog() { ES.$('#tmLog', kv).innerHTML = log.slice(0, 40).map(function (it) { return '<div class="it"><span class="av" style="background:' + (it.ok ? (it.status === 'Terlambat' ? '#b45309' : '#15803d') : '#b91c1c') + '">' + x(ES.inisial(it.nama)) + '</span><div style="flex:1;min-width:0"><b class="trunc" style="display:block">' + x(it.nama) + '</b><div class="redup kecil">' + x(it.info) + '</div></div><div style="text-align:right"><div class="num tebal">' + x(it.jam) + '</div><div class="kecil" style="color:' + (it.ok ? (it.status === 'Terlambat' ? '#fbbf24' : '#4ade80') : '#f87171') + '">' + x(it.status) + '</div></div></div>'; }).join('') || '<div class="redup kecil" style="padding:20px;text-align:center">Belum ada pindaian.</div>'; }
    function muatData() {
      ES.$('#tmInfo', kv).textContent = 'Memuat data siswa…';
      return ES.api('pres.terminal', { kelas: kelas }).then(function (d) {
        D = d; tokMap = {}; d.siswa.forEach(function (s) { if (s.tok) tokMap[s.tok] = s; });
        ES.ls.set('tmData_' + kelas, d);
        ES.$('#tmInfo', kv).textContent = (kelas === 'SEMUA' ? 'Mode gerbang' : ES.namaKelas(kelas)) + ' · ' + d.siswa.length + ' siswa · masuk ' + d.setelan.jamMasuk + (d.setelan.toleransi ? ' (+' + d.setelan.toleransi + ' mnt)' : '') + ' · wajah ' + (d.setelan.wajibWajah ? 'wajib' : 'opsional');
        statistik();
      }).catch(function (e) { const c = ES.ls.get('tmData_' + kelas, null); if (c) { D = c; tokMap = {}; c.siswa.forEach(function (s) { if (s.tok) tokMap[s.tok] = s; }); ES.$('#tmInfo', kv).textContent = 'Data luring (cache) · ' + c.siswa.length + ' siswa'; statistik(); } else status('gagal', 'error', 'Gagal memuat data', e.message); });
    }
    function statusLokal(jam) { const s = D.setelan, b = s.jamMasuk.split(':'), m = (+b[0]) * 60 + (+b[1]) + (+s.toleransi || 0), j = jam.split(':'); return (+j[0]) * 60 + (+j[1]) > m ? 'Terlambat' : 'Hadir'; }
    function catat(sw, metode, skor) {
      const n = new Date(), jam = String(n.getHours()).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0') + ':' + String(n.getSeconds()).padStart(2, '0');
      const ada = D.hariIni[sw.id];
      if (ada && ada.status !== 'Alpa') { status('ok', 'how_to_reg', sw.nama + ' sudah tercatat', ada.status + ' pukul ' + ES.fJam(ada.jam)); bunyi(true); log.unshift({ nama: sw.nama, ok: true, status: 'Sudah tercatat', jam: ES.fJam(ada.jam), info: sw.namaKelas }); gambarLog(); return; }
      const st = statusLokal(jam), it = { siswaId: sw.id, metode: metode, skor: skor, waktu: n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0') + '-' + String(n.getDate()).padStart(2, '0') + 'T' + jam, cid: ES.uid(), perangkat: (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || 'web' };
      D.hariIni[sw.id] = { status: st, jam: jam, metode: metode, skor: skor };   // optimistik
      const q = ES.ls.get(ANTRE, []); q.push(it); ES.ls.set(ANTRE, q);
      status('ok', st === 'Terlambat' ? 'schedule' : 'check_circle', (st === 'Terlambat' ? 'TERLAMBAT · ' : 'HADIR · ') + sw.nama, sw.namaKelas + ' · No. ' + sw.absen + ' · ' + jam.slice(0, 5) + (skor ? ' · wajah ' + skor + '%' : ''));
      bunyi(true); log.unshift({ nama: sw.nama, ok: true, status: st, jam: jam.slice(0, 5), info: sw.namaKelas + ' · ' + metode + (skor ? ' ' + skor + '%' : '') }); gambarLog(); statistik();
      ES.sinkronAntrean();
    }
    ES.saatSinkron = function (hasil) { (hasil || []).forEach(function (h) { if (!h.ok) { const s = D && D.siswa.filter(function (z) { return z.id === h.siswaId; })[0]; log.unshift({ nama: s ? s.nama : 'Siswa', ok: false, status: 'Ditolak server', jam: '', info: h.pesan || '' }); if (D && h.siswaId) delete D.hariIni[h.siswaId]; } else if (D && h.siswaId && h.status) D.hariIni[h.siswaId] = Object.assign(D.hariIni[h.siswaId] || {}, { status: h.status, jam: h.jam }); }); gambarLog(); statistik(); };
    function gagal(sw, alasan, skor) { status('gagal', 'gpp_bad', 'Verifikasi gagal' + (sw ? ' · ' + sw.nama : ''), alasan); bunyi(false); log.unshift({ nama: sw ? sw.nama : 'Tidak dikenal', ok: false, status: 'Gagal', jam: '', info: alasan }); gambarLog(); ES.api('pres.gagal', { siswaId: sw ? sw.id : '', alasan: alasan, skor: skor || 0, perangkat: navigator.platform }, { diam: true }).catch(function () { }); }
    function verifikasiWajah(sw) {
      return new Promise(function (res) {
        if (!fa) { res(null); return; }
        status('proses', 'face', 'Verifikasi wajah · ' + sw.nama, 'Lihat ke kamera, jangan bergerak…');
        const mulai = Date.now(); let best = 0;
        (function coba() {
          if (!jalan) return res(null);
          deskriptor(fa, V).then(function (h) {
            if (h) { const s = skorWajah(h.descriptor, sw.wajah); if (s > best) best = s; gambarKotak(h.detection.box, s >= D.setelan.ambang); if (s >= D.setelan.ambang) return res(s); }
            if (Date.now() - mulai > 4500) return res(-best);
            setTimeout(coba, 120);
          }).catch(function () { res(null); });
        })();
      });
    }
    function gambarKotak(b, ok) { OV.width = V.videoWidth; OV.height = V.videoHeight; const c = OV.getContext('2d'); c.clearRect(0, 0, OV.width, OV.height); c.strokeStyle = ok ? '#22c55e' : '#60a5fa'; c.lineWidth = 4; c.strokeRect(b.x, b.y, b.width, b.height); setTimeout(function () { c.clearRect(0, 0, OV.width, OV.height); }, 800); }
    function prosesQR(teks) {
      if (sibuk || !D) return; const t = String(teks || '').trim(); if (t.indexOf('ES1:') !== 0) return;
      sibuk = true;
      ES.sha256(t.slice(4)).then(function (h) {
        const sw = tokMap[h.slice(0, 20)];
        if (!sw) { gagal(null, 'Kartu tidak dikenal / bukan kelas ini / sudah diganti.'); return; }
        if (jeda[sw.id] && Date.now() - jeda[sw.id] < 8000) return;
        jeda[sw.id] = Date.now();
        const perluWajah = sw.wajah && sw.wajah.length;
        if (!perluWajah) { catat(sw, 'QR', 0); return; }
        return verifikasiWajah(sw).then(function (s) {
          if (s === null) { if (D.setelan.wajibWajah) gagal(sw, 'Verifikasi wajah tidak tersedia di perangkat ini.'); else catat(sw, 'QR', 0); }
          else if (s > 0) catat(sw, 'QR+Wajah', s);
          else gagal(sw, 'Wajah tidak cocok (skor ' + Math.abs(s) + '% < ambang ' + D.setelan.ambang + '%).', Math.abs(s));
        });
      }).then(function () { setTimeout(function () { sibuk = false; if (jalan) setTimeout(function () { status('proses', 'qr_code_scanner', 'Arahkan kartu QR ke kamera', 'Siap memindai berikutnya.'); }, 1800); }, 600); }, function () { sibuk = false; });
    }
    function loop() {
      if (!jalan) return;
      if (V.readyState >= 2 && !sibuk && window.jsQR) {
        const w = 480, h = Math.round(V.videoHeight / V.videoWidth * w) || 360; cv.width = w; cv.height = h; cx.drawImage(V, 0, 0, w, h);
        const img = cx.getImageData(0, 0, w, h), q = jsQR(img.data, w, h, { inversionAttempts: 'dontInvert' });
        if (q && q.data) prosesQR(q.data);
      }
      setTimeout(function () { requestAnimationFrame(loop); }, 140);
    }
    function nyalakan() { stop(stream); return kamera(V, depan).then(function (s) { stream = s; V.style.transform = depan ? 'scaleX(-1)' : 'none'; OV.style.transform = V.style.transform; }).catch(function (e) { status('gagal', 'videocam_off', 'Kamera tidak dapat dibuka', e.name === 'NotAllowedError' ? 'Izinkan akses kamera untuk situs ini.' : e.message); }); }
    ES.$('#tmFlip', kv).onclick = function () { depan = !depan; ES.ls.set('tmDepan', depan); nyalakan(); };
    ES.$('#tmKelas', kv).onchange = function () { kelas = this.value; ES.ls.set('tmKelas', kelas); muatData(); };
    ES.$('#tmManual', kv).onclick = function () {
      if (!D) return;
      ES.dialogForm({ judul: 'Presensi manual', bidang: [{ k: 'siswaId', l: 'Siswa', t: 'select', req: true, o: D.siswa.map(function (s) { return [s.id, s.nama + ' · ' + s.namaKelas]; }) }, { k: 'status', l: 'Status', t: 'select', o: STATUS, req: true, kosong: false }, { k: 'alasan', l: 'Alasan', req: true, w: true, ph: 'mis. kartu tertinggal, wajah tidak terbaca' }], kelas: 'satu',
        simpan: function (v) { return ES.tulisPesan('pres.manual', v, { bersih: ['pres.', 'dash.'] }).then(function () { const s = D.siswa.filter(function (z) { return z.id === v.siswaId; })[0]; D.hariIni[v.siswaId] = { status: v.status, jam: '', metode: 'Manual' }; log.unshift({ nama: s.nama, ok: true, status: v.status + ' (manual)', jam: '', info: v.alasan }); gambarLog(); statistik(); }); } });
    };
    status('proses', 'hourglass_top', 'Menyiapkan terminal…', 'Memuat kamera, data siswa, dan model wajah.');
    Promise.all([muatData(), nyalakan(), ES.muatSkrip('vendor/jsQR.js')]).then(function () {
      status('proses', 'qr_code_scanner', 'Arahkan kartu QR ke kamera', 'Memuat model wajah di latar…'); loop();
      return ES.muatWajah().then(function (f) { fa = f; status('proses', 'qr_code_scanner', 'Arahkan kartu QR ke kamera', 'Model wajah siap · ambang ' + D.setelan.ambang + '%.'); }).catch(function () { fa = null; status('proses', 'qr_code_scanner', 'Arahkan kartu QR ke kamera', 'Model wajah gagal dimuat — mode QR saja.'); });
    });
    el.innerHTML = '<div class="kosong">' + ic('qr_code_scanner') + '<h4>Terminal presensi berjalan</h4></div>';
  } });
})();
