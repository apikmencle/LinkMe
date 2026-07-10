(function () {
  try {
    // document.currentScript tidak bisa diandalkan kalau script ini
    // di-defer/dieksekusi-ulang oleh optimizer pihak ketiga (mis. Cloudflare
    // Rocket Loader, lazy-load plugin, dsb) - di kondisi itu currentScript
    // jadi null. Jadi kita cari sendiri elemen <script> yang src-nya
    // mengarah ke file ini, sebagai fallback yang lebih tahan banting.
    var thisScript = document.currentScript;

    if (!thisScript) {
      var scripts = document.getElementsByTagName('script');
      for (var i = 0; i < scripts.length; i++) {
        var s = scripts[i];
        if (s.src && /\/t\.js(\?|$)/.test(s.src)) {
          thisScript = s;
          break;
        }
      }
    }

    if (!thisScript) return;

    var siteKey = thisScript.getAttribute('data-site');
    if (!siteKey) return;

    // Ambil origin dari lokasi script ini sendiri, supaya beacon selalu
    // dikirim ke domain LinkMe yang benar (aman dipakai di custom domain).
    var scriptUrl = new URL(thisScript.src, location.href);
    var endpoint = scriptUrl.origin + '/api/collect';

    var payload = {
      site_key: siteKey,
      path: location.pathname || '/',
      referrer: document.referrer || '',
    };

    var body = JSON.stringify(payload);

    if (navigator.sendBeacon) {
      var blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon(endpoint, blob);
    } else {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body,
        keepalive: true,
      }).catch(function () {});
    }
  } catch (e) {
    // Diam saja - tracking tidak boleh pernah mengganggu halaman user.
  }
})();
