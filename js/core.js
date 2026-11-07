/* EduSmart Suite — inti frontend: API (fetch → GAS REST), cache SWR berlapis, router hash, komponen UI.
   Prinsip instan: tampilkan data cache seketika (memori → localStorage), segarkan di latar, tulis optimistik bila aman. */
(function () {
  'use strict';
  const ES = window.ES = window.ES || {};
  const CFG = window.ESCONFIG || {};
  ES.URL = String(CFG.GAS_URL || '').trim();
  ES.VERSI = '1.0.0';

  // ---------------- util ----------------
  const x = ES.x = function (v) { return String(v === null || v === undefined ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  const IKON_HILANG = {};
  ES.ic = function (n, k) { if (window.IKON && !window.IKON[n] && !IKON_HILANG[n]) { IKON_HILANG[n] = 1; console.warn('ikon hilang: ' + n); } const p = (window.IKON || {})[n] || (window.IKON || {}).info || ''; return '<svg class="ic ' + (k || '') + '" viewBox="0 -960 960 960" aria-hidden="true">' + p + '</svg>'; };
  const ls = ES.ls = {
    get: function (k, d) { try { const v = localStorage.getItem('es_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('es_' + k, JSON.stringify(v)); return true; } catch (e) { try { ls.bersihCache(); localStorage.setItem('es_' + k, JSON.stringify(v)); } catch (e2) { } return false; } },
    del: function (k) { try { localStorage.removeItem('es_' + k); } catch (e) { } },
    bersihCache: function () { try { Object.keys(localStorage).filter(function (k) { return k.indexOf('es_c:') === 0; }).forEach(function (k) { localStorage.removeItem(k); }); } catch (e) { } }
  };
  ES.$ = function (s, el) { return (el || document).querySelector(s); };
  ES.$$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  ES.debounce = function (fn, ms) { let t; return function () { const a = arguments, self = this; clearTimeout(t); t = setTimeout(function () { fn.apply(self, a); }, ms || 300); }; };
  ES.tunggu = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  ES.salin = function (o) { return JSON.parse(JSON.stringify(o)); };
  ES.uid = function () { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); };
  const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'], BULAN_P = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'], HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  ES.HARI = HARI; ES.BULAN = BULAN_P;
  function tgl(s) { if (!s) return null; if (s instanceof Date) return s; const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/); if (!m) return null; return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0)); }
  ES.tgl = tgl;
  ES.fTgl = function (s, panjang) { const d = tgl(s); if (!d) return s ? String(s) : '–'; return d.getDate() + ' ' + (panjang ? BULAN_P : BULAN)[d.getMonth()] + ' ' + d.getFullYear(); };
  ES.fTglJam = function (s) { const d = tgl(s); if (!d) return s ? String(s) : '–'; return ES.fTgl(s) + ', ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
  ES.fJam = function (s) { return String(s || '').slice(0, 5) || '–'; };
  ES.fHari = function (s) { const d = tgl(s); return d ? HARI[d.getDay()] + ', ' + ES.fTgl(s, true) : '–'; };
  ES.relatif = function (s) { const d = tgl(s); if (!d) return '–'; const df = (Date.now() - d.getTime()) / 1000; if (df < 60) return 'baru saja'; if (df < 3600) return Math.floor(df / 60) + ' mnt lalu'; if (df < 86400) return Math.floor(df / 3600) + ' jam lalu'; if (df < 172800) return 'kemarin'; return ES.fTgl(s); };
  ES.fAngka = function (n, d) { if (n === null || n === undefined || n === '') return '–'; return Number(n).toLocaleString('id-ID', { maximumFractionDigits: d === undefined ? 1 : d }); };
  ES.hariIni = function () { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  ES.tambahHari = function (s, n) { const d = tgl(s) || new Date(); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  ES.inisial = function (n) { return String(n || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase(); };
  ES.hp = function (v) { let s = String(v || '').replace(/[^0-9+]/g, '').replace(/^\+/, ''); if (s.indexOf('62') === 0) s = '0' + s.slice(2); else if (s.indexOf('8') === 0) s = '0' + s; return s; };

  // ---------------- API ----------------
  ES.s = { token: ls.get('token', ''), exp: ls.get('exp', 0), me: ls.get('me', null), boot: ls.get('boot', null) };
  let drainT = null, offline = !navigator.onLine;
  ES.api = function (action, data, opt) {
    opt = opt || {};
    if (!ES.URL || /PASTE|GANTI|example/i.test(ES.URL)) return Promise.reject(Object.assign(new Error('Alamat backend (GAS_URL) belum diisi di js/config.js.'), { code: 'CONFIG' }));
    const ctl = new AbortController(), batas = setTimeout(function () { ctl.abort(); }, opt.timeout || 45000);
    const body = JSON.stringify({ action: action, data: data || {}, token: ES.s.token || '' });
    return fetch(ES.URL, { method: 'POST', body: body, headers: { 'Content-Type': 'text/plain;charset=utf-8' }, redirect: 'follow', signal: ctl.signal })
      .then(function (r) { if (!r.ok) throw new Error('Server merespons ' + r.status + '. Coba lagi.'); return r.json(); })
      .catch(function (e) {
        clearTimeout(batas);
        if (e.name === 'AbortError') throw Object.assign(new Error('Server terlalu lama merespons. Periksa koneksi lalu coba lagi.'), { code: 'TIMEOUT' });
        if (e.code) throw e;
        throw Object.assign(new Error(navigator.onLine ? 'Tidak dapat menghubungi server. Coba lagi sebentar.' : 'Anda sedang offline.'), { code: 'NET' });
      })
      .then(function (res) {
        clearTimeout(batas);
        if (res && res.nq > 0 && action !== 'notif.drain') { clearTimeout(drainT); drainT = setTimeout(function () { ES.api('notif.drain', {}, { diam: true }).catch(function () { }); }, 600); }
        if (!res || !res.success) {
          const err = Object.assign(new Error((res && res.message) || 'Permintaan gagal.'), { code: res && res.code, data: res && res.data });
          if (err.code === 'AUTH' && action.indexOf('auth.') !== 0 && ES.s.token) { ES.keluar(true); }
          throw err;
        }
        if (res.message && opt.pesan) ES.toast(res.message, 'ok');
        return res.data;
      });
  };
  /** tulis: tampilkan pesan sukses otomatis, bersihkan cache baca terkait */
  ES.tulis = function (action, data, opt) {
    opt = opt || {};
    return ES.api(action, data, opt).then(function (d) { if (opt.bersih !== false) ES.invalidasi(opt.bersih || null); return d; }, function (e) { if (!opt.diam) ES.toast(e.message, 'err'); throw e; });
  };
  ES.tulisPesan = function (action, data, opt) { return ES.tulis(action, data, Object.assign({ pesan: true }, opt || {})); };

  // ---------------- Cache SWR (memori + localStorage) ----------------
  const MEM = {}, TERBANG = {};
  const SIMPAN_LS = /^(boot|dash\.data|lms\.|kur\.dok\.list|kur\.rekap|bk\.master|bk\.rekap|pres\.harian|nilai\.|cbt\.ujian\.list|de\.template\.list|crm\.stats|admin\.siswa\.list|master\.all|lap\.daftar|kur\.soal\.list|kur\.paket\.list|bk\.saya|pres\.saya)/;
  function kunci(a, d) { return a + '|' + (ES.s.me ? ES.s.me.id : '') + '|' + JSON.stringify(d || {}); }
  /** baca dengan SWR: kembalikan cache seketika (bila ada) + perbarui di latar → panggil cb(data, segar) maksimal 2× */
  ES.baca = function (action, data, cb, opt) {
    opt = opt || {};
    const k = kunci(action, data); let ada = MEM[k];
    if (!ada && SIMPAN_LS.test(action)) { ada = ls.get('c:' + k, null); if (ada) MEM[k] = ada; }
    const segar = ada && (Date.now() - ada.t) < (opt.ttl || 15000);
    if (ada) { try { cb(ada.d, false); } catch (e) { console.error(e); } }
    if (segar && !opt.paksa) return Promise.resolve(ada.d);
    return ES.ambil(action, data).then(function (d) {
      if (!ada || JSON.stringify(ada.d) !== JSON.stringify(d)) { try { cb(d, true); } catch (e) { console.error(e); } }
      return d;
    }, function (e) { if (!ada) throw e; if (e.code !== 'NET') ES.toast(e.message, 'err'); return ada.d; });
  };
  /** ambil segar (dedupe permintaan identik yang sedang berjalan) */
  ES.ambil = function (action, data) {
    const k = kunci(action, data);
    if (TERBANG[k]) return TERBANG[k];
    const p = ES.api(action, data).then(function (d) { const o = { t: Date.now(), d: d }; MEM[k] = o; if (SIMPAN_LS.test(action)) ls.set('c:' + k, o); delete TERBANG[k]; return d; }, function (e) { delete TERBANG[k]; throw e; });
    return (TERBANG[k] = p);
  };
  ES.cache = function (action, data) { const k = kunci(action, data); const m = MEM[k] || (SIMPAN_LS.test(action) ? ls.get('c:' + k, null) : null); return m ? m.d : null; };
  ES.setCache = function (action, data, d) { const k = kunci(action, data), o = { t: Date.now(), d: d }; MEM[k] = o; if (SIMPAN_LS.test(action)) ls.set('c:' + k, o); };
  /** pra-muat (hover menu) — tidak menampilkan galat */
  ES.prefetch = function (list) { (list || []).forEach(function (a) { const k = kunci(a[0], a[1]); if (MEM[k] && Date.now() - MEM[k].t < 20000) return; ES.ambil(a[0], a[1]).catch(function () { }); }); };
  ES.invalidasi = function (awalan) {
    Object.keys(MEM).forEach(function (k) { if (!awalan || [].concat(awalan).some(function (a) { return k.indexOf(a) === 0; })) MEM[k].t = 0; });
    if (!awalan) { try { Object.keys(localStorage).forEach(function (k) { if (k.indexOf('es_c:') === 0) { const o = JSON.parse(localStorage.getItem(k)); if (o) { o.t = 0; localStorage.setItem(k, JSON.stringify(o)); } } }); } catch (e) { } }
  };
  /** batch baca: banyak aksi dalam 1 permintaan (hemat kuota, satu RTT) */
  ES.batch = function (calls) {
    return ES.api('batch', { calls: calls.map(function (c) { return { action: c[0], data: c[1] || {} }; }) }).then(function (d) {
      return d.results.map(function (r, i) { if (r.success) ES.setCache(calls[i][0], calls[i][1], r.data); return r.success ? r.data : null; });
    });
  };

  // ---------------- UI dasar ----------------
  ES.toast = function (pesan, tipe, ms) {
    let w = ES.$('.toast-w'); if (!w) { w = document.createElement('div'); w.className = 'toast-w'; w.setAttribute('role', 'status'); document.body.appendChild(w); }
    const t = document.createElement('div'); t.className = 'toast ' + (tipe || '');
    t.innerHTML = ES.ic(tipe === 'err' ? 'error' : tipe === 'warn' ? 'warning' : tipe === 'ok' ? 'check_circle' : 'info') + '<div>' + x(pesan) + '</div>';
    w.appendChild(t); setTimeout(function () { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(function () { t.remove(); }, 300); }, ms || (tipe === 'err' ? 5000 : 3000));
  };
  ES.modal = function (o) {
    const lp = document.createElement('div'); lp.className = 'lapis';
    lp.innerHTML = '<div class="modal ' + (o.lebar ? (o.lebar === true ? 'lebar' : o.lebar) : '') + '" role="dialog" aria-modal="true"><div class="modal-hd"><div><h3>' + x(o.judul || '') + '</h3>' + (o.sub ? '<div class="redup kecil">' + x(o.sub) + '</div>' : '') + '</div><button class="btn-ik" data-tutup aria-label="Tutup">' + ES.ic('close') + '</button></div><div class="modal-bd"></div>' + (o.tombol ? '<div class="modal-kk"></div>' : '') + '</div>';
    const bd = lp.querySelector('.modal-bd'); if (typeof o.isi === 'string') bd.innerHTML = o.isi; else if (o.isi) bd.appendChild(o.isi);
    const m = { el: lp, bd: bd, tutup: function (v) { lp.remove(); document.removeEventListener('keydown', esc); if (o.saatTutup) o.saatTutup(v); } };
    function esc(e) { if (e.key === 'Escape' && !o.wajib) m.tutup(); }
    document.addEventListener('keydown', esc);
    lp.addEventListener('click', function (e) { if ((e.target === lp && !o.wajib) || e.target.closest('[data-tutup]')) m.tutup(); });
    if (o.tombol) { const kk = lp.querySelector('.modal-kk'); o.tombol.forEach(function (b) { const el = document.createElement('button'); el.className = 'btn ' + (b.kelas || 's'); el.innerHTML = (b.ikon ? ES.ic(b.ikon) : '') + x(b.teks); el.onclick = function () { if (b.klik) { const r = b.klik(m, el); if (r && r.then) { el.classList.add('mem'); r.then(function () { el.classList.remove('mem'); }, function () { el.classList.remove('mem'); }); } } else m.tutup(); }; kk.appendChild(el); }); }
    document.body.appendChild(lp);
    setTimeout(function () { const f = lp.querySelector('input:not([type=hidden]):not([readonly]),select,textarea'); if (f && !o.tanpaFokus) f.focus(); }, 30);
    return m;
  };
  ES.konfirmasi = function (pesan, o) {
    o = o || {};
    return new Promise(function (res) {
      let v = false;
      ES.modal({ judul: o.judul || 'Konfirmasi', isi: '<p style="margin:0;line-height:22px">' + x(pesan) + '</p>' + (o.alasan ? '<div class="fld mt-s"><label>' + x(o.alasan) + '</label><textarea class="inp" id="alasanKf" rows="2"></textarea></div>' : ''),
        saatTutup: function () { res(v); },
        tombol: [{ teks: 'Batal', kelas: 'g' }, { teks: o.ok || 'Ya, lanjutkan', kelas: o.bahaya ? 'd' : 'p', klik: function (m) { if (o.alasan) { const a = ES.$('#alasanKf', m.el).value.trim(); if (a.length < 3) { ES.toast('Isi alasan terlebih dulu.', 'warn'); return; } v = a; } else v = true; m.tutup(); } }] });
    });
  };
  /** form dari spesifikasi bidang → HTML. f: {k, l, t:'text|number|date|time|datetime-local|select|textarea|checkbox|switch|hidden|password|email|tel|file', o:[[v,l]], w:true(penuh), req, ph, bantu, v} */
  ES.form = function (bidang, nilai, kelas) {
    nilai = nilai || {};
    return '<div class="form ' + (kelas || '') + '">' + bidang.map(function (f) {
      if (f.html) return '<div class="' + (f.w ? 'penuh' : '') + '">' + f.html + '</div>';
      const v = nilai[f.k] !== undefined && nilai[f.k] !== null ? nilai[f.k] : (f.v !== undefined ? f.v : ''), id = 'f_' + f.k, req = f.req ? ' required' : '';
      let inp;
      if (f.t === 'hidden') return '<input type="hidden" name="' + f.k + '" value="' + x(v) + '">';
      if (f.t === 'select') inp = '<select class="inp" id="' + id + '" name="' + f.k + '"' + req + (f.multi ? ' multiple size="5"' : '') + '>' + (f.kosong !== false ? '<option value="">' + x(f.kosong || '— pilih —') + '</option>' : '') + (f.o || []).map(function (o) { const ov = Array.isArray(o) ? o[0] : o, ol = Array.isArray(o) ? o[1] : o; return '<option value="' + x(ov) + '"' + (String(ov) === String(v) || (Array.isArray(v) && v.indexOf(ov) >= 0) ? ' selected' : '') + '>' + x(ol) + '</option>'; }).join('') + '</select>';
      else if (f.t === 'textarea') inp = '<textarea class="inp" id="' + id + '" name="' + f.k + '" rows="' + (f.rows || 3) + '" placeholder="' + x(f.ph || '') + '"' + req + '>' + x(v) + '</textarea>';
      else if (f.t === 'checkbox') return '<label class="cek ' + (f.w ? 'penuh' : '') + '"><input type="checkbox" name="' + f.k + '"' + (v === true || v === 'YA' ? ' checked' : '') + '> ' + x(f.l) + '</label>';
      else if (f.t === 'switch') return '<label class="baris ' + (f.w ? 'penuh' : '') + '" style="justify-content:space-between"><span><b>' + x(f.l) + '</b>' + (f.bantu ? '<br><span class="redup kecil">' + x(f.bantu) + '</span>' : '') + '</span><span class="sw"><input type="checkbox" name="' + f.k + '"' + (v === true || v === 'YA' ? ' checked' : '') + '><span></span></span></label>';
      else inp = '<input class="inp" id="' + id + '" name="' + f.k + '" type="' + (f.t || 'text') + '" value="' + x(v) + '" placeholder="' + x(f.ph || '') + '"' + req + (f.min !== undefined ? ' min="' + f.min + '"' : '') + (f.max !== undefined ? ' max="' + f.max + '"' : '') + (f.step ? ' step="' + f.step + '"' : '') + (f.ro ? ' readonly' : '') + (f.inputmode ? ' inputmode="' + f.inputmode + '"' : '') + (f.auto ? ' autocomplete="' + f.auto + '"' : '') + (f.accept ? ' accept="' + f.accept + '"' : '') + '>';
      return '<div class="fld ' + (f.w ? 'penuh' : '') + '"><label for="' + id + '">' + x(f.l) + (f.req ? ' <span class="wajib">*</span>' : '') + '</label>' + inp + (f.bantu ? '<span class="bantu">' + x(f.bantu) + '</span>' : '') + '</div>';
    }).join('') + '</div>';
  };
  ES.ambilForm = function (el, wajibCek) {
    const o = {}; let galat = '';
    ES.$$('[name]', el).forEach(function (i) {
      if (i.type === 'checkbox') o[i.name] = i.checked;
      else if (i.multiple) o[i.name] = Array.prototype.slice.call(i.selectedOptions).map(function (op) { return op.value; });
      else if (i.type === 'file') o[i.name] = i.files;
      else o[i.name] = i.type === 'number' ? (i.value === '' ? '' : Number(i.value)) : i.value.trim();
      if (wajibCek !== false && i.required && (o[i.name] === '' || o[i.name] === undefined)) { i.classList.add('err'); if (!galat) galat = (i.closest('.fld') && i.closest('.fld').querySelector('label') ? i.closest('.fld').querySelector('label').textContent.replace('*', '').trim() : i.name) + ' wajib diisi.'; } else i.classList.remove('err');
    });
    if (galat) { ES.toast(galat, 'warn'); return null; }
    return o;
  };
  /** dialog formulir: resolve nilai (atau null bila batal). simpan(values) boleh mengembalikan Promise (tombol menunggu) */
  ES.dialogForm = function (o) {
    return new Promise(function (res) {
      let hasil = null;
      ES.modal({ judul: o.judul, sub: o.sub, lebar: o.lebar, isi: (o.atas || '') + ES.form(o.bidang, o.nilai, o.kelas) + (o.bawah || ''), saatTutup: function () { res(hasil); }, tanpaFokus: o.tanpaFokus,
        tombol: [{ teks: 'Batal', kelas: 'g' }, { teks: o.ok || 'Simpan', kelas: o.bahaya ? 'd' : 'p', ikon: o.ikonOk, klik: function (m) {
          const v = ES.ambilForm(m.el); if (!v) return;
          if (o.simpan) return Promise.resolve(o.simpan(v, m)).then(function (r) { if (r !== false) { hasil = r === undefined ? v : r; m.tutup(); } }, function () { });
          hasil = v; m.tutup();
        } }] });
      if (o.setelah) setTimeout(function () { o.setelah(ES.$('.lapis:last-child')); }, 0);
    });
  };
  ES.menuPop = function (anchor, items) {
    ES.$$('.menu-pop').forEach(function (m) { m.remove(); });
    const m = document.createElement('div'); m.className = 'menu-pop';
    m.innerHTML = items.map(function (it, i) { return it === '-' ? '<hr style="border:0;border-top:1px solid var(--garis);margin:4px 0">' : '<button data-i="' + i + '"' + (it.bahaya ? ' style="color:var(--merah)"' : '') + '>' + (it.ikon ? ES.ic(it.ikon) : '') + x(it.teks) + '</button>'; }).join('');
    document.body.appendChild(m);
    const r = anchor.getBoundingClientRect(); m.style.top = Math.min(window.innerHeight - m.offsetHeight - 8, r.bottom + 6) + 'px'; m.style.left = Math.max(8, Math.min(window.innerWidth - m.offsetWidth - 8, r.right - m.offsetWidth)) + 'px';
    setTimeout(function () { document.addEventListener('click', function tutup(e) { if (!m.contains(e.target)) { m.remove(); document.removeEventListener('click', tutup); } }); }, 0);
    m.addEventListener('click', function (e) { const b = e.target.closest('button[data-i]'); if (!b) return; m.remove(); items[+b.dataset.i].klik(); });
  };
  ES.kosong = function (judul, teks, ikon, aksi) { return '<div class="kosong">' + ES.ic(ikon || 'inbox') + '<h4>' + x(judul) + '</h4>' + (teks ? '<div>' + x(teks) + '</div>' : '') + (aksi || '') + '</div>'; };
  ES.skeleton = function (n, tinggi) { let s = ''; for (let i = 0; i < (n || 4); i++) s += '<div class="sk" style="height:' + (tinggi || 52) + 'px;margin-bottom:10px"></div>'; return '<div class="kp">' + s + '</div>'; };
  ES.galat = function (e, ulang) { return '<div class="kosong">' + ES.ic('cloud_off') + '<h4>Gagal memuat</h4><div>' + x(e && e.message || e) + '</div>' + (ulang ? '<button class="btn s mt-s" data-ulang>' + ES.ic('refresh') + 'Coba lagi</button>' : '') + '</div>'; };
  ES.bdgStatus = function (s) {
    const m = { Hadir: 'hijau', Terlambat: 'kuning', Sakit: 'biru', Izin: 'biru', Alpa: 'merah', 'Belum Hadir': '', Divalidasi: 'hijau', Diajukan: 'kuning', Draft: '', Ditolak: 'merah', Terbit: 'hijau', Draf: '', Selesai: 'hijau', Berlangsung: 'biru', Terjadwal: 'ungu', Terkunci: 'merah', Berjalan: 'biru', Dibuka_Ulang: 'kuning', Belum: '', TERBIT: 'hijau', MENUNGGU_TTD: 'kuning', DITARIK: 'merah', DITOLAK: 'merah', DRAF: '', Antri: 'kuning', Terkirim: 'hijau', Gagal: 'merah', Batal: '', Dikirim: 'hijau', 'Akan dikirim': 'kuning', 'Tidak dikirim': '', Baru: 'kuning', Diproses: 'biru', Terbuka: 'kuning', Berlanjut: 'biru', 'Menunggu TTD': 'kuning', Dihentikan: '', Aktif: 'hijau', Tuntas: 'hijau', 'Belum tuntas': 'merah', Dikumpulkan: 'biru', Dinilai: 'hijau', Terdaftar: 'hijau', 'Tidak Terdaftar': 'merah' };
    const lbl = { Dibuka_Ulang: 'Dibuka ulang', MENUNGGU_TTD: 'Menunggu TTD', TERBIT: 'Terbit', DITARIK: 'Ditarik', DITOLAK: 'Ditolak', DRAF: 'Draf' };
    return '<span class="bdg ' + (m[s] || '') + '"><span class="tt"></span>' + x(lbl[s] || s || '–') + '</span>';
  };
  /** tabel dengan reflow kartu di HP. kolom: {l, f(row)->html, k, kelas, n:true(angka), c:true} */
  ES.tabel = function (kolom, rows, o) {
    o = o || {};
    if (!rows || !rows.length) return ES.kosong(o.kosong || 'Belum ada data', o.kosongTeks || '', o.kosongIkon || 'inbox', o.kosongAksi);
    return '<div class="tbl-w"' + (o.tinggi ? ' style="max-height:' + o.tinggi + 'px"' : '') + '><table class="tbl ' + (o.reflow === false ? '' : 'reflow') + '"><thead><tr>' + kolom.map(function (k) { return '<th class="' + (k.n ? 'n' : k.c ? 'c' : '') + '">' + (k.lh || x(k.l)) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rows.map(function (r, i) { return '<tr' + (o.idBaris ? ' data-id="' + x(o.idBaris(r)) + '"' : '') + (o.klik ? ' style="cursor:pointer"' : '') + (o.kelasBaris ? ' class="' + o.kelasBaris(r) + '"' : '') + '>' + kolom.map(function (k, j) { const v = k.f ? k.f(r, i) : x(r[k.k]); return '<td data-l="' + x(k.l) + '" class="' + (k.n ? 'n ' : k.c ? 'c ' : '') + (j === 0 ? 'utama-c ' : '') + (k.kelas || '') + '">' + (v === undefined || v === null || v === '' ? '<span class="redup">–</span>' : v) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
  };
  ES.tabs = function (el, items, aktif, cb) {
    el.innerHTML = '<div class="tabs" role="tablist">' + items.map(function (t) { return '<button role="tab" data-t="' + x(t[0]) + '" class="' + (t[0] === aktif ? 'on' : '') + '">' + (t[2] ? ES.ic(t[2], 's') : '') + x(t[1]) + (t[3] ? ' <span class="bdg merah">' + t[3] + '</span>' : '') + '</button>'; }).join('') + '</div>';
    el.querySelector('.tabs').addEventListener('click', function (e) { const b = e.target.closest('button[data-t]'); if (!b) return; ES.$$('button', el).forEach(function (z) { z.classList.toggle('on', z === b); }); cb(b.dataset.t); });
  };
  ES.sibuk = function (btn, fn) { if (btn.classList.contains('mem')) return Promise.resolve(); btn.classList.add('mem'); return Promise.resolve().then(fn).then(function (r) { btn.classList.remove('mem'); return r; }, function (e) { btn.classList.remove('mem'); throw e; }); };
  ES.opsi = function (list, kv, kl) { return (list || []).map(function (o) { return [o[kv || 'id'], typeof kl === 'function' ? kl(o) : o[kl || 'nama']]; }); };

  // ---------------- berkas ----------------
  ES.unduhB64 = function (nama, mime, b64) { const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); ES.unduhBlob(nama, new Blob([u], { type: mime || 'application/octet-stream' })); };
  ES.unduhBlob = function (nama, blob) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nama; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500); };
  ES.bukaB64 = function (mime, b64) { const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); const url = URL.createObjectURL(new Blob([u], { type: mime })); window.open(url, '_blank'); };
  ES.bacaBerkas = function (file) { return new Promise(function (res, rej) { const r = new FileReader(); r.onload = function () { res(String(r.result).split(',')[1]); }; r.onerror = function () { rej(new Error('Berkas tidak bisa dibaca.')); }; r.readAsDataURL(file); }); };
  /** unggah: ≤ 2 MB satu permintaan; lebih besar dipotong 2 MB (progres) */
  ES.unggah = function (file, tujuan, onProg) {
    const MAKS = Number(((ES.s.boot || {}).setelan || {}).MAKS_UPLOAD_MB || 10) * 1048576;
    if (file.size > Math.min(MAKS, 25 * 1048576)) return Promise.reject(new Error('Ukuran berkas melebihi ' + Math.round(MAKS / 1048576) + ' MB.'));
    const P = 2 * 1048576, total = Math.max(1, Math.ceil(file.size / P)), uid = 'UP-' + ES.uid();
    let i = 0;
    function kirim() {
      const blob = file.slice(i * P, (i + 1) * P);
      return ES.bacaBerkas(blob).then(function (b64) { return ES.api('file.upload', { nama: file.name, mime: file.type, b64: b64, tujuan: tujuan, ukuran: file.size, part: i, total: total, uploadId: uid }, { timeout: 120000 }); })
        .then(function (d) { i++; if (onProg) onProg(Math.round(i / total * 100)); return i < total ? kirim() : d; });
    }
    return kirim();
  };
  const SKRIP = {};
  ES.muatSkrip = function (src) { if (SKRIP[src]) return SKRIP[src]; SKRIP[src] = new Promise(function (res, rej) { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = function () { delete SKRIP[src]; rej(new Error('Gagal memuat ' + src)); }; document.head.appendChild(s); }); return SKRIP[src]; };
  ES.chart = function () { return ES.muatSkrip('vendor/chart.umd.min.js').then(function () { const gelap = document.documentElement.dataset.theme === 'dark'; Chart.defaults.font.family = 'Inter, system-ui, sans-serif'; Chart.defaults.color = gelap ? '#94a3b8' : '#64748b'; Chart.defaults.borderColor = gelap ? '#1e293b' : '#e2e8f0'; return window.Chart; }); };
  ES.xlsx = function (nama, lembar) { return ES.muatSkrip('vendor/xlsx.full.min.js').then(function () { const wb = XLSX.utils.book_new(); lembar.forEach(function (l) { const ws = Array.isArray(l.data[0]) ? XLSX.utils.aoa_to_sheet(l.data) : XLSX.utils.json_to_sheet(l.data); if (l.lebar) ws['!cols'] = l.lebar.map(function (w) { return { wch: w }; }); XLSX.utils.book_append_sheet(wb, ws, String(l.nama || 'Data').slice(0, 31)); }); XLSX.writeFile(wb, nama); }); };
  ES.bacaXlsx = function (file) { return ES.muatSkrip('vendor/xlsx.full.min.js').then(function () { return file.arrayBuffer(); }).then(function (buf) { const wb = XLSX.read(buf, { type: 'array', cellDates: true }); return wb.SheetNames.map(function (n) { return { nama: n, rows: XLSX.utils.sheet_to_json(wb.Sheets[n], { defval: '', raw: false, dateNF: 'yyyy-mm-dd' }) }; }); }); };
  ES.pdfTabel = function (nama, judul, sub, kolom, baris, o) {
    o = o || {};
    return ES.muatSkrip('vendor/jspdf.umd.min.js').then(function () { return ES.muatSkrip('vendor/jspdf.plugin.autotable.min.js'); }).then(function () {
      const doc = new window.jspdf.jsPDF({ orientation: o.lanskap ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' }), st = (ES.s.boot || {}).setelan || {};
      doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.text(st.NAMA_SEKOLAH || 'EduSmart Suite', 14, 14);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.text(String(st.ALAMAT || ''), 14, 19); doc.setLineWidth(.5); doc.line(14, 22, doc.internal.pageSize.getWidth() - 14, 22);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.text(judul, 14, 29); doc.setFont('helvetica', 'normal'); doc.setFontSize(9); if (sub) doc.text(sub, 14, 34);
      doc.autoTable({ head: [kolom], body: baris, startY: sub ? 38 : 33, styles: { fontSize: o.kecil ? 7 : 8.5, cellPadding: 1.6 }, headStyles: { fillColor: [0, 22, 78] }, alternateRowStyles: { fillColor: [241, 245, 249] }, margin: { left: 14, right: 14 } });
      const n = doc.internal.getNumberOfPages(); for (let i = 1; i <= n; i++) { doc.setPage(i); doc.setFontSize(7); doc.setTextColor(120); doc.text('Dicetak ' + ES.fTglJam(new Date()) + ' · EduSmart Suite · hal ' + i + '/' + n, 14, doc.internal.pageSize.getHeight() - 8); }
      doc.save(nama);
    });
  };
  ES.qrDataUrl = function (teks, sel) { return ES.muatSkrip('vendor/qrcode.js').then(function () { const q = qrcode(0, 'M'); q.addData(teks); q.make(); return q.createDataURL(sel || 6, 2); }); };
  ES.sha256 = function (s) { return crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)).then(function (b) { return Array.from(new Uint8Array(b)).map(function (v) { return v.toString(16).padStart(2, '0'); }).join(''); }); };

  // ---------------- router ----------------
  const HAL = ES.HAL = {};
  ES.hal = function (id, def) { HAL[id] = def; };
  ES.rute = { path: '', param: [] };
  ES.buka = function (p) { if (location.hash === '#/' + p) ES.render(); else location.hash = '#/' + p; };
  ES.kembali = function (fallback) { if (history.length > 1) history.back(); else ES.buka(fallback || 'dashboard'); };
  let renderKe = 0;
  ES.render = function () {
    const h = decodeURIComponent(location.hash.replace(/^#\/?/, '')), seg = h.split('/').filter(Boolean);
    if (seg[0] === 'v' || seg[0] === 'lap') return ES.publik(seg);
    if (!ES.s.token || ES.s.exp < Date.now()) return ES.layarLogin();
    if (!ES.$('.app')) ES.pasangShell();
    const id = seg[0] || 'dashboard', def = HAL[id] || HAL.dashboard;
    if (def.peran && !ES.punya(def.peran)) { ES.toast('Menu ini tidak tersedia untuk peran Anda.', 'warn'); return ES.buka('dashboard'); }
    ES.rute = { path: h, id: id, param: seg.slice(1) };
    ES.$$('.sb a, .btm-nav a').forEach(function (a) { a.classList.toggle('aktif', a.dataset.h === id || (a.dataset.alias || '').split(',').indexOf(id) >= 0); });
    ES.$('.app').classList.remove('buka');
    const el = ES.$('#isi'); el.className = 'isi' + (def.lebar ? ' lebar' : ''); const ke = ++renderKe;
    el.innerHTML = ''; window.scrollTo(0, 0);
    document.title = (def.judul ? def.judul + ' · ' : '') + (((ES.s.boot || {}).setelan || {}).NAMA_APP || 'EduSmart Suite');
    try { const r = def.render(el, seg.slice(1), function () { return ke === renderKe; }); if (r && r.catch) r.catch(function (e) { if (ke === renderKe) { el.innerHTML = ES.galat(e, true); const b = el.querySelector('[data-ulang]'); if (b) b.onclick = ES.render; } }); }
    catch (e) { console.error(e); el.innerHTML = ES.galat(e, true); }
  };
  window.addEventListener('hashchange', function () { ES.$$('.menu-pop').forEach(function (m) { m.remove(); }); if (ES.saatPindah) { try { ES.saatPindah(); } catch (e) { } ES.saatPindah = null; } ES.render(); });

  // ---------------- peran ----------------
  ES.punya = function (roles) { const r = (ES.s.me || {}).roles || []; return [].concat(roles).some(function (x) { return r.indexOf(x) >= 0; }); };
  ES.staf = function () { return (ES.s.me || {}).tipe === 'staf' || (ES.s.me || {}).tipe === 'darurat'; };
  ES.master = function () { return ((ES.s.boot || {}).master) || { kelas: [], mapel: [], guru: [], siswa: [], pengampu: [] }; };
  ES.namaKelas = function (id) { const k = ES.master().kelas.filter(function (z) { return z.id === id; })[0]; return k ? k.nama : ''; };
  ES.namaMapel = function (id) { const k = ES.master().mapel.filter(function (z) { return z.id === id; })[0]; return k ? k.nama : ''; };
  ES.namaGuru = function (id) { const k = ES.master().guru.filter(function (z) { return z.id === id; })[0]; return k ? k.nama : ''; };
  ES.kelasSaya = function () { const me = ES.s.me || {}, m = ES.master(); if (ES.punya(['SUPER_ADMIN', 'KEPSEK', 'KURIKULUM', 'BK'])) return m.kelas; const ids = (me.pengampu || []).map(function (p) { return p.kelas; }).concat(me.kelasWali || []); return m.kelas.filter(function (k) { return ids.indexOf(k.id) >= 0; }); };
  ES.ampuan = function () { const me = ES.s.me || {}; if (ES.punya('SUPER_ADMIN')) return ES.master().pengampu.map(function (p) { return { kelas: p.kelas, mapel: p.mapel }; }); return me.pengampu || []; };

  // ---------------- sesi ----------------
  ES.simpanSesi = function (d) { ES.s.token = d.token; ES.s.exp = d.exp; ES.s.me = d.me; ls.set('token', d.token); ls.set('exp', d.exp); ls.set('me', d.me); };
  ES.keluar = function (kedaluwarsa) {
    const t = ES.s.token; ES.s = { token: '', exp: 0, me: null, boot: null }; ['token', 'exp', 'me', 'boot'].forEach(ls.del); ls.bersihCache();
    Object.keys(MEM).forEach(function (k) { delete MEM[k]; });
    if (t && !kedaluwarsa) fetch(ES.URL, { method: 'POST', body: JSON.stringify({ action: 'auth.logout', token: t }), headers: { 'Content-Type': 'text/plain;charset=utf-8' } }).catch(function () { });
    if (kedaluwarsa) ES.toast('Sesi berakhir. Silakan masuk kembali.', 'warn');
    location.hash = '#/'; ES.layarLogin();
  };
  ES.muatBoot = function () { return ES.api('boot', {}).then(function (b) { ES.s.boot = b; ES.s.me = b.me; ls.set('boot', b); ls.set('me', b.me); return b; }); };
  ES.tema = function (t) { t = t || (ls.get('tema', '') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')); document.documentElement.dataset.theme = t; ls.set('tema', t); const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = t === 'dark' ? '#0b1220' : '#00164e'; };

  // ---------------- daring/luring ----------------
  function pita() { let p = ES.$('.pita-off'); if (offline) { if (!p) { p = document.createElement('div'); p.className = 'pita-off'; p.textContent = 'Anda offline — data tersimpan di perangkat dan dikirim otomatis saat online.'; document.body.appendChild(p); } } else if (p) p.remove(); }
  window.addEventListener('online', function () { offline = false; pita(); if (ES.sinkronAntrean) ES.sinkronAntrean(); });
  window.addEventListener('offline', function () { offline = true; pita(); });
  ES.daring = function () { return !offline; };
  // tombol cetak tanpa handler inline (aman untuk Content-Security-Policy)
  document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('[data-cetak]')) window.print(); });
  document.addEventListener('DOMContentLoaded', pita);
})();
