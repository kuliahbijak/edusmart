/* Modul A — Dashboard per peran (satu panggilan dash.data, cache SWR → tampil seketika) */
(function () {
  const x = ES.x, ic = ES.ic;
  let grafik = null;
  ES.hal('dashboard', { judul: 'Beranda', render: function (el, p, masih) {
    el.innerHTML = ES.skeleton(5, 70);
    return ES.baca('dash.data', {}, function (d) { if (!masih()) return; gambar(el, d); ES.perbaruiLencana(); }, { ttl: 30000 });
  } });
  function kpi(ikon, warna, nilai, label, sub, h) { return '<div class="kartu kpi' + (h ? ' klik" data-h="' + h : '') + '"><div class="ik ' + warna + '">' + ic(ikon) + '</div><div style="min-width:0"><div class="l">' + x(label) + '</div><div class="v">' + nilai + '</div>' + (sub ? '<div class="t redup">' + sub + '</div>' : '') + '</div></div>'; }
  function gambar(el, d) {
    const me = ES.s.me || {}, P = ES.PERAN;
    if (d.anak) return gambarSiswa(el, d);
    const pimpinan = ES.punya([P.SA, P.KS, P.KUR]), guru = ES.punya([P.GR]) || ES.punya(P.SA);
    const pr = d.presensi || {}, nama = me.nama || '';
    let h = '<div class="jdl-hal"><div><div class="baris kecil redup"><span class="titik-hidup"></span>Ruang kerja · tersinkron</div><h1 class="mt-s">' + x(d.salam) + ', ' + x(nama.split(',')[0]) + '</h1><p>' + ic('calendar_today', 's') + ' ' + x(d.tanggal) + ' · Semester ' + x(d.ta) + '</p></div><div class="aksi">' +
      (guru ? '<a class="btn s" href="#/lms">' + ic('add_task') + 'Buat Tugas LMS</a><a class="btn s" href="#/cbt">' + ic('play_circle') + 'Ujian CBT</a>' : '') +
      (ES.punya([P.SA, P.KS, P.GR, P.WK]) ? '<a class="btn p" href="#/terminal">' + ic('qr_code_scanner') + 'Scan Presensi</a>' : '') + '</div></div>';
    h += '<div class="grid g4">' + kpi('how_to_reg', 'w-hijau', ES.fAngka(pr.persen) + '%', 'Presensi hari ini', (pr.Hadir + pr.Terlambat) + '/' + pr.total + ' siswa · ' + pr.belum + ' belum hadir', 'presensi');
    if (pimpinan) h += kpi('groups', 'w-biru', ES.fAngka(d.kpi.siswa, 0), 'Siswa aktif', d.kpi.kelas + ' rombel · ' + d.kpi.guru + ' guru/staf', 'pengaturan/siswa');
    if (guru) h += kpi('assignment', 'w-kuning', d.kpi.perluDinilai || 0, 'Tugas menunggu nilai', (d.tugasAktif || 0) + ' tugas aktif · ' + (d.kpi.kelasDiampu || 0) + ' kelas', 'lms/koreksi');
    h += kpi('computer', 'w-biru', d.kpi.ujian || 0, 'Ujian CBT terjadwal/aktif', (d.ujian || []).filter(function (u) { return u.status === 'Berlangsung'; }).length + ' sedang berlangsung', 'cbt');
    h += kpi('folder_shared', 'w-teal', (d.kurikulum.divalidasi || 0) + '/' + (d.kurikulum.total || 0), 'Dokumen kurikulum tervalidasi', (d.kurikulum.menunggu || 0) + ' menunggu · ' + (d.kurikulum.revisi || 0) + ' revisi', 'kurikulum');
    if (!guru && !pimpinan && d.bk) h += kpi('gavel', 'w-merah', d.bk.bulanIni, 'Pelanggaran bulan ini', d.bk.baru + ' perlu tindak lanjut', 'bk');
    h += '</div>';
    if (d.ttdMenunggu) h += '<div class="peringatan info mt">' + ic('draw') + '<span><b>' + d.ttdMenunggu + ' dokumen</b> menunggu tanda tangan elektronik Anda. <a href="#/dokumen/ttd">Buka antrean TTD →</a></span></div>';
    h += '<div class="grid g-2-1 mt"><div class="kartu"><div class="kp-hd"><div><h3>Tren presensi siswa</h3><p>14 hari sekolah terakhir · ' + (pimpinan ? 'seluruh sekolah' : 'kelas yang Anda ampu') + '</p></div>' + (rerata(d.tren) === null ? '' : '<span class="bdg hijau">Rerata ' + ES.fAngka(rerata(d.tren)) + '%</span>') + '</div><div class="kp"><div style="height:260px"><canvas id="cvTren"></canvas></div></div></div>';
    if (guru && d.jadwal) h += '<div class="kartu"><div class="kp-hd"><div><h3>Jadwal mengajar hari ini</h3><p>' + d.jadwal.length + ' sesi</p></div></div>' + (d.jadwal.length ? '<ul class="daftar">' + d.jadwal.map(jadwalItem).join('') + '</ul>' : ES.kosong('Tidak ada jadwal hari ini', 'Atur jadwal di Pengaturan → Jadwal.', 'event_busy')) + '</div>';
    else if (pimpinan) h += '<div class="kartu"><div class="kp-hd"><h3>Aktivitas terbaru</h3><a class="kecil" href="#/pengaturan/audit">Semua</a></div>' + ((d.aktivitas || []).length ? '<ul class="daftar">' + d.aktivitas.slice(0, 8).map(function (a) { return '<li><span class="av s">' + x(ES.inisial(a.siapa)) + '</span><div class="grow"><div class="trunc"><b>' + x(a.siapa) + '</b> · ' + x(a.aksi) + '</div><div class="redup kecil trunc">' + x(a.detail) + '</div></div><span class="redup kecil">' + ES.relatif(a.waktu) + '</span></li>'; }).join('') + '</ul>' : ES.kosong('Belum ada aktivitas', '', 'history')) + '</div>';
    else h += '<div></div>';
    h += '</div>';
    // baris bawah
    h += '<div class="grid g2 mt">';
    if (guru) h += '<div class="kartu"><div class="kp-hd"><div><h3>Antrean koreksi tugas</h3><p>Pengumpulan yang belum dinilai</p></div><a class="btn g kc" href="#/lms/koreksi">Kelola semua' + ic('arrow_forward', 's') + '</a></div>' + ((d.koreksi || []).length ? '<ul class="daftar">' + d.koreksi.map(function (k) { return '<li><div class="ik w-kuning" style="width:36px;height:36px;border-radius:10px;display:grid;place-items:center">' + ic('assignment') + '</div><div class="grow"><b class="trunc" style="display:block">' + x(k.judul) + '</b><div class="redup kecil">' + x(k.mapel) + ' · ' + x(k.kelas) + '</div></div><span class="bdg kuning">' + k.jumlah + ' baru</span><a class="btn s kc" href="#/kelas/' + k.kelasId + '/' + k.mapelId + '/tugas/' + k.id + '">Beri nilai</a></li>'; }).join('') + '</ul>' : ES.kosong('Semua tugas sudah dinilai', 'Kerja bagus!', 'task_alt')) + '</div>';
    if (pimpinan && d.perKelas) h += '<div class="kartu"><div class="kp-hd"><div><h3>Kehadiran per kelas hari ini</h3><p>Klik untuk detail</p></div></div>' + ES.tabel([{ l: 'Kelas', f: function (r) { return '<b>' + x(r.nama) + '</b>'; } }, { l: 'Hadir', f: function (r) { return r.hadir + '/' + r.total; }, n: 1 }, { l: '%', f: function (r) { return '<div class="baris" style="justify-content:flex-end;gap:8px"><div class="prog ' + (r.persen >= 90 ? 'hijau' : r.persen >= 75 ? 'kuning' : 'merah') + '" style="width:80px"><i style="width:' + r.persen + '%"></i></div>' + ES.fAngka(r.persen) + '</div>'; }, n: 1 }, { l: 'Belum', k: 'belum', n: 1 }], d.perKelas, { idBaris: function (r) { return r.id; }, klik: 1, tinggi: 360 }) + '</div>';
    if (d.ujian && d.ujian.length) h += '<div class="kartu"><div class="kp-hd"><h3>Ujian CBT</h3><a class="kecil" href="#/cbt">Kelola</a></div><ul class="daftar">' + d.ujian.map(function (u) { return '<li><div class="grow"><b>' + x(u.judul) + '</b><div class="redup kecil">' + x(u.mapel) + ' · ' + x(u.kelas) + ' · ' + ES.fTglJam(u.mulai) + '</div></div>' + ES.bdgStatus(u.status) + (u.status === 'Berlangsung' ? '<a class="btn p kc" href="#/cbt/monitor/' + u.id + '">' + ic('monitor_heart', 's') + 'Pantau</a>' : '') + '</li>'; }).join('') + '</ul></div>';
    if (d.perwalian && d.perwalian.length) h += '<div class="kartu"><div class="kp-hd"><div><h3>Kelas perwalian</h3><p>Kehadiran hari ini</p></div></div><ul class="daftar">' + d.perwalian.map(function (k) { return '<li><div class="grow"><b>' + x(k.nama) + '</b><div class="redup kecil">' + k.terlambat + ' terlambat · ' + k.alpa + ' alpa · ' + k.belum + ' belum hadir</div></div><b>' + ES.fAngka(k.persen) + '%</b><a class="btn s kc" href="#/presensi/harian/' + k.id + '">Detail</a></li>'; }).join('') + '</ul></div>';
    if (d.bk) h += '<div class="kartu"><div class="kp-hd"><div><h3>Disiplin & kasus BK</h3><p>Tahun pelajaran berjalan</p></div><a class="btn g kc" href="#/bk">Buka BK' + ic('arrow_forward', 's') + '</a></div><div class="kp grid g3">' + [['Bulan ini', d.bk.bulanIni, 'w-merah', 'gavel'], ['Perlu tindak lanjut', d.bk.baru, 'w-kuning', 'pending_actions'], ['Draf surat', d.bk.spDraf, 'w-biru', 'mail']].map(function (k) { return '<div><div class="label-sm">' + k[0] + '</div><div style="font:700 26px var(--f-judul)">' + k[1] + '</div></div>'; }).join('') + '</div></div>';
    if (d.sistem) h += '<div class="kartu"><div class="kp-hd"><h3>Status layanan</h3><a class="kecil" href="#/pengaturan/sistem">Detail</a></div><div class="kp kolom"><div class="baris antar"><span>WhatsApp (Fonnte)</span>' + ES.bdgStatus(d.sistem.waAktif ? 'Aktif' : 'Draf') + '</div><div class="baris antar"><span>Email</span>' + ES.bdgStatus(d.sistem.emailAktif ? 'Aktif' : 'Draf') + '</div><div class="baris antar"><span>Antrean notifikasi</span><span>' + d.sistem.antrean.Antri + ' menunggu · ' + d.sistem.antrean.Gagal + ' gagal</span></div></div></div>';
    h += '</div>';
    el.innerHTML = h;
    el.querySelectorAll('[data-h]').forEach(function (k) { k.onclick = function () { ES.buka(k.dataset.h); }; });
    el.querySelectorAll('tr[data-id]').forEach(function (tr) { tr.onclick = function () { ES.buka('presensi/harian/' + tr.dataset.id); }; });
    grafikTren(d.tren);
  }
  function rerata(t) { const v = (t || []).filter(function (r) { return r.persen !== null; }); return v.length ? v.reduce(function (a, r) { return a + r.persen; }, 0) / v.length : null; }
  function jadwalItem(j) {
    const now = new Date(), hm = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    const st = hm >= j.mulai && hm <= j.selesai ? '<span class="bdg biru"><span class="tt"></span>Berlangsung</span>' : hm < j.mulai ? '<span class="bdg">Berikutnya</span>' : '<span class="bdg hijau">Selesai</span>';
    return '<li><div style="min-width:86px"><b class="num">' + x(j.mulai) + '</b><div class="redup kecil num">s.d. ' + x(j.selesai) + '</div></div><div class="grow"><b>' + x(j.mapel) + '</b><div class="redup kecil">' + ic('meeting_room', 's') + ' ' + x(j.kelas) + (j.ruang ? ' · ' + x(j.ruang) : '') + '</div></div>' + st + '<a class="btn s kc" href="#/presensi/harian/' + j.kelasId + '" title="Buka presensi">' + ic('how_to_reg', 's') + '</a></li>';
  }
  function grafikTren(t) {
    const cv = ES.$('#cvTren'); if (!cv || !t) return;
    ES.chart().then(function (Chart) {
      if (!document.body.contains(cv)) return; if (grafik) grafik.destroy();
      grafik = new Chart(cv, { type: 'bar', data: { labels: t.map(function (r) { return r.label; }), datasets: [
        { label: 'Hadir', data: t.map(function (r) { return r.hadir; }), backgroundColor: '#2563eb', stack: 's', borderRadius: 4 },
        { label: 'Terlambat', data: t.map(function (r) { return r.terlambat; }), backgroundColor: '#f59e0b', stack: 's', borderRadius: 4 },
        { label: 'Izin/Sakit', data: t.map(function (r) { return r.izin; }), backgroundColor: '#0d9488', stack: 's', borderRadius: 4 },
        { label: 'Alpa', data: t.map(function (r) { return r.alpa; }), backgroundColor: '#dc2626', stack: 's', borderRadius: 4 }] },
        options: { maintainAspectRatio: false, animation: { duration: 300 }, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, usePointStyle: true } }, tooltip: { mode: 'index', intersect: false } }, scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } } } } });
    });
  }
  function gambarSiswa(el, d) {
    const me = ES.s.me || {};
    let h = '<div class="jdl-hal"><div><h1>' + x(d.salam) + ', ' + x((me.nama || '').split(' ')[0]) + '</h1><p>' + x(d.tanggal) + ' · ' + x(d.ta) + '</p></div></div>';
    d.anak.forEach(function (a) {
      const st = a.hariIni ? a.hariIni.status : 'Belum Hadir';
      h += (d.anak.length > 1 || me.tipe === 'wali' ? '<h3 class="mb-s mt">' + x(a.nama) + ' <span class="redup kecil">· ' + x(a.kelas) + '</span></h3>' : '') +
        '<div class="grid g4">' + kpi('how_to_reg', st === 'Hadir' ? 'w-hijau' : st === 'Terlambat' ? 'w-kuning' : 'w-biru', '<span style="font-size:18px">' + x(st) + '</span>', 'Kehadiran hari ini', a.hariIni ? 'Pukul ' + ES.fJam(a.hariIni.jam) : '', 'kehadiran') +
        kpi('event_available', 'w-teal', a.persenHadir === null ? '–' : ES.fAngka(a.persenHadir) + '%', 'Kehadiran bulan ini', a.presensi.Alpa + ' alpa · ' + a.presensi.Terlambat + ' terlambat', 'kehadiran') +
        kpi('grading', 'w-biru', a.rerata === null ? '–' : ES.fAngka(a.rerata), 'Rata-rata nilai', a.nilai.length + ' mapel', 'nilai-saya') + kpi('gavel', a.poin ? 'w-merah' : 'w-hijau', a.poin, 'Poin disiplin', 'Tahun pelajaran ini', 'disiplin') + '</div>' +
        '<div class="grid g2 mt"><div class="kartu"><div class="kp-hd"><h3>Tugas belum dikumpulkan</h3><span class="bdg ' + (a.jumlahTugasBelum ? 'kuning' : 'hijau') + '">' + a.jumlahTugasBelum + '</span></div>' + (a.tugasBelum.length ? '<ul class="daftar">' + a.tugasBelum.map(function (t) { return '<li><div class="ik w-kuning" style="width:36px;height:36px;border-radius:10px;display:grid;place-items:center">' + ic('assignment') + '</div><div class="grow"><b>' + x(t.judul) + '</b><div class="redup kecil">' + x(t.mapel) + ' · tenggat ' + ES.fTglJam(t.deadline) + '</div></div>' + (me.tipe === 'siswa' ? '<a class="btn s kc" href="#/kelas-saya">Kerjakan</a>' : '') + '</li>'; }).join('') + '</ul>' : ES.kosong('Tidak ada tugas tertunda', 'Semua tugas sudah dikumpulkan.', 'task_alt')) + '</div>' +
        '<div class="kartu"><div class="kp-hd"><h3>Ujian terjadwal</h3></div>' + (a.ujian.length ? '<ul class="daftar">' + a.ujian.map(function (u) { return '<li><div class="grow"><b>' + x(u.judul) + '</b><div class="redup kecil">' + x(u.mapel) + ' · ' + ES.fTglJam(u.mulai) + '</div></div>' + ES.bdgStatus(u.status) + (me.tipe === 'siswa' && u.status === 'Berlangsung' ? '<a class="btn p kc" href="#/ujian">Mulai</a>' : '') + '</li>'; }).join('') + '</ul>' : ES.kosong('Tidak ada ujian terjadwal', '', 'event_available')) + '</div></div>' +
        (a.nilai.length ? '<div class="kartu mt"><div class="kp-hd"><h3>Nilai per mata pelajaran</h3><a class="kecil" href="#/nilai-saya">Rincian</a></div><div class="kp"><div class="kolom">' + a.nilai.map(function (n) { return '<div><div class="baris antar kecil"><span>' + x(n.mapel) + '</span><b>' + ES.fAngka(n.nilai) + '</b></div><div class="prog ' + (n.nilai >= 75 ? 'hijau' : 'kuning') + ' mt-s"><i style="width:' + Math.min(100, n.nilai) + '%"></i></div></div>'; }).join('') + '</div></div></div>' : '');
    });
    el.innerHTML = h;
    el.querySelectorAll('[data-h]').forEach(function (k) { k.onclick = function () { ES.buka(k.dataset.h); }; });
  }
})();
