/* Modul G — Laporan & Rekap: laporan perkembangan (PDF via Doc Engine + kirim WA/email), leger nilai, ringkasan sekolah; nilai & kehadiran siswa/wali. */
(function () {
  const x = ES.x, ic = ES.ic;
  ES.hal('laporan', { judul: 'Laporan & Rekap', peran: ['SUPER_ADMIN', 'KEPSEK', 'KURIKULUM', 'WALI_KELAS', 'GURU'], render: function (el, p, masih) {
    if (p[0] === 'siswa' && p[1]) return laporanSiswa(el, p[1], masih);
    const bisaTerbit = ES.punya(['SUPER_ADMIN', 'KEPSEK', 'WALI_KELAS']);
    const tab = p[0] || (bisaTerbit ? 'perkembangan' : 'leger');
    el.innerHTML = '<div class="jdl-hal"><div><h1>Laporan & Rekap</h1><p>Laporan perkembangan ke wali murid, leger nilai, dan rekap sekolah.</p></div><div class="aksi"><a class="btn s" href="#/presensi/rekap">' + ic('table_chart') + 'Rekap presensi</a></div></div><div id="lpTabs"></div><div id="lpIsi"></div>';
    const tabs = []; if (bisaTerbit) tabs.push(['perkembangan', 'Laporan perkembangan', 'summarize']); tabs.push(['leger', 'Leger nilai', 'grid_on']); if (ES.punya(['SUPER_ADMIN', 'KEPSEK', 'KURIKULUM'])) tabs.push(['sekolah', 'Ringkasan sekolah', 'insights']);
    ES.tabs(ES.$('#lpTabs'), tabs, tab, function (t) { ES.buka('laporan/' + t); });
    const isi = ES.$('#lpIsi');
    return ({ perkembangan: perkembangan, leger: leger, sekolah: sekolah }[tab] || leger)(isi, masih);
  } });
  function pilihKelas(id) { const k = ES.punya(['SUPER_ADMIN', 'KEPSEK', 'KURIKULUM']) ? ES.master().kelas : ES.master().kelas.filter(function (z) { return (ES.s.me.kelasWali || []).indexOf(z.id) >= 0 || ES.kelasSaya().some(function (q) { return q.id === z.id; }); }); return '<select class="inp" id="lpK" style="max-width:200px">' + k.map(function (z) { return '<option value="' + z.id + '"' + (z.id === id ? ' selected' : '') + '>' + x(z.nama) + '</option>'; }).join('') + '</select>'; }
  function perkembangan(el, masih) {
    const kelas = ES.ls.get('lpKelas', '') || (ES.s.me.kelasWali || [])[0] || (ES.master().kelas[0] || {}).id;
    el.innerHTML = '<div class="grid g-1-2"><div class="kartu"><div class="kp-hd"><h3>Terbitkan laporan</h3></div><div class="kp" id="lpForm"></div></div><div class="kartu"><div class="kp-hd"><div><h3>Laporan terbit</h3><p>Tautan aman untuk wali (berlaku 180 hari) + PDF</p></div><select class="inp" id="lpPer" style="max-width:220px"><option value="">Semua periode</option></select></div><div id="lpDaftar">' + ES.skeleton(4) + '</div></div></div>';
    const siswa = function () { return ES.master().siswa.filter(function (s) { return s.kelas === ES.$('#lpK').value; }).sort(function (a, b) { return (a.absen || 0) - (b.absen || 0); }); };
    ES.$('#lpForm').innerHTML = '<div class="kolom"><div class="fld"><label>Kelas</label>' + pilihKelas(kelas) + '</div><div class="fld"><label>Jenis periode</label><div class="seg" id="lpJenis"><button data-j="Mingguan">Mingguan</button><button data-j="Bulanan" class="on">Bulanan</button><button data-j="Semester">Semester</button></div></div><div class="baris"><div class="fld" style="flex:1"><label>Dari</label><input type="date" class="inp" id="lpDari"></div><div class="fld" style="flex:1"><label>Sampai</label><input type="date" class="inp" id="lpSampai"></div></div><div class="fld"><label>Catatan wali kelas (umum)</label><textarea class="inp" id="lpCat" rows="2" placeholder="Opsional — dapat diisi per siswa di bawah"></textarea></div><div class="fld"><div class="baris antar"><label>Siswa</label><label class="cek kecil"><input type="checkbox" id="lpSemua" checked> semua</label></div><div id="lpSiswa" style="max-height:260px;overflow:auto;border:1px solid var(--garis);border-radius:8px"></div></div><label class="cek"><input type="checkbox" id="lpKirim" checked> Kirim ke wali murid (WA/email) setelah PDF siap</label><button class="btn p bsr" id="lpTerbit">' + ic('summarize') + 'Terbitkan laporan</button><div id="lpProg"></div></div>';
    function setPeriode(j) { const t = ES.hariIni(); ES.$('#lpSampai').value = t; ES.$('#lpDari').value = j === 'Mingguan' ? ES.tambahHari(t, -6) : j === 'Bulanan' ? t.slice(0, 8) + '01' : String(((ES.s.boot || {}).ta || {}).tgl_mulai || ES.tambahHari(t, -90)).slice(0, 10); }
    let jenis = 'Bulanan'; setPeriode(jenis);
    ES.$$('#lpJenis button').forEach(function (b) { b.onclick = function () { jenis = b.dataset.j; ES.$$('#lpJenis button').forEach(function (z) { z.classList.toggle('on', z === b); }); setPeriode(jenis); }; });
    function daftarSiswa() { ES.$('#lpSiswa').innerHTML = siswa().map(function (s) { return '<div style="padding:8px 12px;border-bottom:1px solid var(--garis)"><label class="cek"><input type="checkbox" data-s="' + s.id + '" checked> <b>' + x(s.nama) + '</b></label><input class="inp mt-s" style="height:34px" data-c="' + s.id + '" placeholder="Catatan khusus (opsional)"></div>'; }).join('') || '<div class="kp redup">Tidak ada siswa</div>'; }
    daftarSiswa();
    ES.$('#lpK').onchange = function () { ES.ls.set('lpKelas', this.value); daftarSiswa(); muatDaftar(); };
    ES.$('#lpSemua').onchange = function () { const c = this.checked; ES.$$('[data-s]').forEach(function (i) { i.checked = c; }); };
    function muatDaftar() {
      return ES.baca('lap.daftar', { kelas: ES.$('#lpK').value }, function (d) {
        if (!masih()) return; const per = ES.$('#lpPer'), sel = per.value;
        per.innerHTML = '<option value="">Semua periode</option>' + d.periode.map(function (p) { return '<option' + (p === sel ? ' selected' : '') + '>' + x(p) + '</option>'; }).join('');
        const rows = d.rows.filter(function (r) { return !per.value || r.periode === per.value; });
        ES.$('#lpDaftar').innerHTML = (rows.length ? '<div class="kp-hd" style="border:0;padding-bottom:0"><label class="cek kecil"><input type="checkbox" id="lpPilihSemua"> pilih semua</label><button class="btn s kc" id="lpKirimUlang">' + ic('send', 's') + 'Kirim ulang terpilih</button></div>' : '') + ES.tabel([{ lh: '', l: '', f: function (r) { return '<input type="checkbox" data-r="' + r.id + '">'; } }, { l: 'Siswa', f: function (r) { return '<b>' + x(r.nama) + '</b><div class="sub">' + x(r.periode) + '</div>'; } }, { l: 'Status kirim', f: function (r) { return ES.bdgStatus(r.status) + (r.dikirim ? '<div class="sub">' + ES.relatif(r.dikirim) + '</div>' : ''); } }, { l: '', f: function (r) { return '<div class="baris" style="justify-content:flex-end;gap:4px">' + (r.dokumenId ? '<button class="btn s kc" data-pdf="' + r.dokumenId + '">' + ic('picture_as_pdf', 's') + 'PDF</button>' : '<span class="bdg kuning">PDF diproses</span>') + (r.tautan ? '<button class="btn g kc ik-s" data-salin="' + x(r.tautan) + '" title="Salin tautan">' + ic('link', 's') + '</button><a class="btn g kc ik-s" href="' + x(r.tautan) + '" target="_blank" title="Buka">' + ic('open_in_new', 's') + '</a>' : '') + '</div>'; } }], rows, { kosong: 'Belum ada laporan terbit untuk kelas ini', kosongIkon: 'summarize' });
        ES.$$('[data-pdf]', el).forEach(function (b) { b.onclick = function () { ES.unduhDokumen(b, b.dataset.pdf); }; });
        ES.$$('[data-salin]', el).forEach(function (b) { b.onclick = function () { navigator.clipboard.writeText(b.dataset.salin).then(function () { ES.toast('Tautan disalin.', 'ok'); }); }; });
        const ps = ES.$('#lpPilihSemua'); if (ps) ps.onchange = function () { const c = ps.checked; ES.$$('[data-r]').forEach(function (i) { i.checked = c; }); };
        const ku = ES.$('#lpKirimUlang'); if (ku) ku.onclick = function () { const ids = ES.$$('[data-r]:checked').map(function (i) { return i.dataset.r; }); if (!ids.length) return ES.toast('Pilih laporan.', 'warn'); ES.sibuk(ku, function () { return ES.tulisPesan('lap.kirim', { ids: ids }, { bersih: ['lap.'] }).then(muatDaftar); }); };
      });
    }
    ES.$('#lpPer').onchange = muatDaftar;
    ES.$('#lpTerbit').onclick = function () {
      const btn = this, ids = ES.$$('[data-s]:checked').map(function (i) { return i.dataset.s; }), cat = {};
      ES.$$('[data-c]').forEach(function (i) { if (i.value.trim()) cat[i.dataset.c] = i.value.trim(); });
      if (!ids.length) return ES.toast('Pilih minimal satu siswa.', 'warn');
      ES.sibuk(btn, function () {
        return ES.tulis('lap.terbit', { kelas: ES.$('#lpK').value, jenis: jenis, dari: ES.$('#lpDari').value, sampai: ES.$('#lpSampai').value, siswaIds: ids, catatan: cat, catatanUmum: ES.$('#lpCat').value, kirim: ES.$('#lpKirim').checked }, { bersih: ['lap.'] }).then(function (r) { return prosesAntrean(r.batch, r.total, ES.$('#lpProg')); }).then(muatDaftar);
      });
    };
    return muatDaftar();
  }
  /** memproses antrean dokumen dari browser (2 dokumen per panggilan) sambil menampilkan progres; worker server ikut memproses di latar */
  function prosesAntrean(batch, total, wadah) {
    wadah.innerHTML = '<div class="mt-s"><div class="baris antar kecil"><span id="apT">Menyiapkan PDF…</span><b id="apP">0%</b></div><div class="prog teal mt-s"><i id="apB" style="width:0"></i></div><p class="redup kecil">Boleh pindah menu — proses tetap berjalan di server.</p></div>';
    return new Promise(function (res) {
      let putaran = 0;
      (function langkah() {
        ES.api('de.antrean.proses', { batch: batch }, { timeout: 90000 }).catch(function () { }).then(function () { return ES.api('de.massal.status', { batch: batch }); }).then(function (s) {
          const t = ES.$('#apT'); if (!t) return res();
          ES.$('#apB').style.width = s.persen + '%'; ES.$('#apP').textContent = s.persen + '%'; t.textContent = s.selesai + '/' + s.total + ' selesai' + (s.gagal ? ' · ' + s.gagal + ' gagal' : '');
          if (s.menunggu > 0 && ++putaran < 120) return setTimeout(langkah, 300);
          if (s.gagal) wadah.insertAdjacentHTML('beforeend', '<div class="peringatan bahaya mt-s">' + ic('error') + '<span>' + x(s.galat.join(' · ')) + '</span></div>');
          else ES.toast('Semua laporan selesai dibuat.', 'ok');
          res();
        }).catch(function (e) { ES.toast(e.message, 'err'); res(); });
      })();
    });
  }
  ES.prosesAntreanDok = prosesAntrean;
  function leger(el, masih) {
    const kelas = ES.ls.get('lpKelas', '') || (ES.s.me.kelasWali || [])[0] || (ES.kelasSaya()[0] || {}).id;
    el.innerHTML = '<div class="kartu"><div class="kp-hd"><div class="baris">' + pilihKelas(kelas) + '</div><div class="baris"><button class="btn s" id="lgXls">' + ic('table_view') + 'Excel</button><button class="btn s" id="lgPdf">' + ic('picture_as_pdf') + 'PDF</button></div></div><div id="lgTbl">' + ES.skeleton(6) + '</div></div>';
    let D = null;
    function muat() {
      ES.ls.set('lpKelas', ES.$('#lpK').value);
      return ES.api('lap.leger', { kelas: ES.$('#lpK').value }).then(function (d) {
        if (!masih()) return; D = d;
        ES.$('#lgTbl').innerHTML = d.rows.length ? '<div class="tbl-w"><table class="tbl"><thead><tr><th>No</th><th>Nama</th>' + d.mapel.map(function (m) { return '<th class="c" title="' + x(m.nama) + '">' + x(m.nama.slice(0, 14)) + '<div style="font-weight:400">KKM ' + m.kkm + '</div></th>'; }).join('') + '<th class="c">Rata-rata</th><th class="c">Peringkat</th></tr></thead><tbody>' + d.rows.map(function (r, i) { return '<tr><td class="num">' + (i + 1) + '</td><td><b>' + x(r.nama) + '</b><div class="sub">' + x(r.nis) + '</div></td>' + d.mapel.map(function (m) { const v = r.nilai[m.id]; return '<td class="c num" style="' + (v !== null && v < m.kkm ? 'color:var(--merah);font-weight:600' : '') + '">' + (v === null ? '–' : ES.fAngka(v)) + '</td>'; }).join('') + '<td class="c num"><b>' + (r.rerata === null ? '–' : ES.fAngka(r.rerata)) + '</b></td><td class="c">' + (r.peringkat || '') + '</td></tr>'; }).join('') + '</tbody></table></div>' : ES.kosong('Belum ada data nilai');
      }).catch(function (e) { ES.$('#lgTbl').innerHTML = ES.galat(e); });
    }
    ES.$('#lpK').onchange = muat;
    ES.$('#lgXls').onclick = function () { if (!D) return; ES.xlsx('Leger-' + D.kelas + '.xlsx', [{ nama: 'Leger', data: [['No', 'NIS', 'Nama'].concat(D.mapel.map(function (m) { return m.nama; })).concat(['Rata-rata', 'Peringkat'])].concat(D.rows.map(function (r, i) { return [i + 1, r.nis, r.nama].concat(D.mapel.map(function (m) { return r.nilai[m.id] === null ? '' : r.nilai[m.id]; })).concat([r.rerata === null ? '' : r.rerata, r.peringkat || '']); })) }]); };
    ES.$('#lgPdf').onclick = function () { if (!D) return; ES.pdfTabel('Leger-' + D.kelas + '.pdf', 'Leger Nilai Kelas ' + D.kelas, D.ta, ['No', 'Nama'].concat(D.mapel.map(function (m) { return m.nama.slice(0, 10); })).concat(['Rata', 'Rank']), D.rows.map(function (r, i) { return [i + 1, r.nama].concat(D.mapel.map(function (m) { return r.nilai[m.id] === null ? '' : r.nilai[m.id]; })).concat([r.rerata === null ? '' : r.rerata, r.peringkat || '']); }), { lanskap: true, kecil: D.mapel.length > 8 }); };
    return muat();
  }
  function sekolah(el, masih) {
    el.innerHTML = ES.skeleton(4, 80);
    return ES.baca('lap.ringkasSekolah', {}, function (d) {
      if (!masih()) return;
      el.innerHTML = '<div class="kartu"><div class="kp-hd"><div><h3>Kehadiran & pelanggaran per kelas</h3><p>' + ES.fTgl(d.dari) + ' – ' + ES.fTgl(d.sampai) + '</p></div></div><div class="kp" style="height:300px"><canvas id="skCv"></canvas></div>' + ES.tabel([{ l: 'Kelas', f: function (k) { return '<b>' + x(k.nama) + '</b>'; } }, { l: 'Hadir', f: function (k) { return k.presensi.Hadir + k.presensi.Terlambat; }, n: 1 }, { l: 'Alpa', f: function (k) { return k.presensi.Alpa; }, n: 1 }, { l: '% hadir', f: function (k) { return k.persen === null ? '–' : '<b>' + ES.fAngka(k.persen) + '</b>'; }, n: 1 }, { l: 'Pelanggaran', k: 'pelanggaran', n: 1 }], d.kelas) + '</div>';
      ES.chart().then(function (Chart) { const cv = ES.$('#skCv'); if (!cv) return; new Chart(cv, { type: 'bar', data: { labels: d.kelas.map(function (k) { return k.nama; }), datasets: [{ label: '% hadir', data: d.kelas.map(function (k) { return k.persen; }), backgroundColor: '#2563eb', borderRadius: 6, yAxisID: 'y' }, { label: 'Pelanggaran', data: d.kelas.map(function (k) { return k.pelanggaran; }), type: 'line', borderColor: '#dc2626', backgroundColor: '#dc2626', yAxisID: 'y1', tension: .3 }] }, options: { maintainAspectRatio: false, scales: { y: { min: 0, max: 100, position: 'left' }, y1: { beginAtZero: true, position: 'right', grid: { display: false }, ticks: { precision: 0 } } } } }); });
    });
  }
  function laporanSiswa(el, sid, masih) {
    el.innerHTML = ES.skeleton(5, 70);
    return ES.api('lap.siswa', { siswaId: sid }).then(function (L) {
      if (!masih()) return;
      el.innerHTML = '<div class="remah"><a href="#/laporan">Laporan</a>' + ic('chevron_right', 's') + 'Perkembangan siswa</div><div class="jdl-hal"><div><h1>' + x(L.NAMA_SISWA) + '</h1><p>NIS ' + x(L.NIS) + ' · ' + x(L.KELAS) + ' · ' + ES.fTgl(L.TGL_DARI) + ' – ' + ES.fTgl(L.TGL_SAMPAI) + '</p></div><div class="aksi"><button class="btn s" data-cetak>' + ic('print') + 'Cetak</button></div></div>' +
        '<div class="grid g4 mb">' + [['Rata-rata nilai', L.RERATA === '' ? '–' : L.RERATA, 'grading', 'w-biru'], ['Kehadiran', L.PERSEN_HADIR + (L.PERSEN_HADIR === '-' ? '' : '%'), 'event_available', 'w-hijau'], ['Tugas dikumpulkan', L.TUGAS_KUMPUL + '/' + L.TUGAS_TOTAL, 'assignment_turned_in', 'w-teal'], ['Poin disiplin', L.POIN_TOTAL, 'gavel', 'w-merah']].map(function (k) { return '<div class="kartu kpi"><div class="ik ' + k[3] + '">' + ic(k[2]) + '</div><div><div class="l">' + k[0] + '</div><div class="v">' + x(k[1]) + '</div></div></div>'; }).join('') + '</div>' +
        '<div class="kartu">' + ES.tabel([{ l: 'Mata pelajaran', k: 'MAPEL' }, { l: 'KKM', k: 'KKM', n: 1 }, { l: 'Nilai', f: function (r) { return r.NILAI === '' ? '–' : '<b>' + r.NILAI + '</b>'; }, n: 1 }, { l: 'Predikat', k: 'PREDIKAT', c: 1 }, { l: 'Keterangan', k: 'KETERANGAN' }], L.NILAI, { kosong: 'Belum ada nilai' }) + '</div>';
    });
  }

  // ---------------- siswa & wali ----------------
  ES.hal('nilai-saya', { judul: 'Nilai', peran: ['SISWA', 'WALI_MURID'], render: function (el, p, masih) {
    el.innerHTML = '<div class="jdl-hal"><div><h1>Nilai</h1><p>Nilai akhir dihitung otomatis dari bobot kategori yang ditetapkan guru.</p></div></div><div id="nsIsi">' + ES.skeleton(4) + '</div>';
    return ES.baca('nilai.saya', {}, function (d) {
      if (!masih()) return;
      ES.$('#nsIsi').innerHTML = d.map(function (a) { return (d.length > 1 || ES.s.me.tipe === 'wali' ? '<h3 class="mb-s">' + x(a.nama) + '</h3>' : '') + (a.mapel.length ? '<div class="grid g2 mb">' + a.mapel.map(function (m) { return '<div class="kartu"><div class="kp-hd"><div><h3>' + x(m.nama) + '</h3><p>KKM ' + m.kkm + '</p></div><div style="text-align:right"><div style="font:700 28px var(--f-judul)">' + (m.akhir === null ? '–' : ES.fAngka(m.akhir)) + '</div>' + (m.tuntas === null ? '' : m.tuntas ? '<span class="bdg hijau">Tuntas · ' + x(m.predikat) + '</span>' : '<span class="bdg merah">Belum tuntas</span>') + '</div></div><ul class="daftar">' + m.rincian.map(function (r) { return '<li><div class="grow"><b>' + x(r.judul) + '</b><div class="redup kecil">' + x(r.komponen) + ' · ' + ES.fTgl(r.tanggal) + '</div></div><b style="color:' + (r.nilai < m.kkm ? 'var(--merah)' : 'inherit') + '">' + r.nilai + '</b></li>'; }).join('') + '</ul></div>'; }).join('') + '</div>' : '<div class="kartu mb">' + ES.kosong('Belum ada nilai', 'Nilai muncul setelah guru menilai tugas/ujian.', 'grading') + '</div>'); }).join('');
    });
  } });
  ES.hal('kehadiran', { judul: 'Kehadiran', peran: ['SISWA', 'WALI_MURID'], render: function (el, p, masih) {
    el.innerHTML = '<div class="jdl-hal"><div><h1>Kehadiran</h1><p>60 hari terakhir.</p></div></div><div id="khIsi">' + ES.skeleton(4) + '</div>';
    return ES.baca('pres.saya', {}, function (d) {
      if (!masih()) return;
      ES.$('#khIsi').innerHTML = d.map(function (a) { return (d.length > 1 || ES.s.me.tipe === 'wali' ? '<h3 class="mb-s">' + x(a.nama) + '</h3>' : '') + '<div class="grid g4 mb">' + [['Hadir', a.Hadir, 'w-hijau', 'check_circle'], ['Terlambat', a.Terlambat, 'w-kuning', 'schedule'], ['Izin/Sakit', a.Izin + a.Sakit, 'w-biru', 'medical_services'], ['Alpa', a.Alpa, 'w-merah', 'cancel']].map(function (k) { return '<div class="kartu kpi"><div class="ik ' + k[2] + '">' + ic(k[3]) + '</div><div><div class="l">' + k[0] + '</div><div class="v">' + k[1] + '</div></div></div>'; }).join('') + '</div><div class="kartu mb"><div class="kp-hd"><h3>Riwayat</h3><span class="bdg biru">' + ES.fAngka(a.persen) + '% hadir</span></div>' + ES.tabel([{ l: 'Tanggal', f: function (r) { return ES.fHari(r.tanggal); } }, { l: 'Jam', f: function (r) { return ES.fJam(r.jam); } }, { l: 'Status', f: function (r) { return ES.bdgStatus(r.status); } }, { l: 'Keterangan', f: function (r) { return x(r.ket || r.metode || ''); } }], a.riwayat, { kosong: 'Belum ada data kehadiran' }) + '</div>'; }).join('');
    });
  } });
})();
