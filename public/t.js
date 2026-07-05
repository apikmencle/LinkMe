(function () {
  try {
    var currentScript = document.currentScript;
    var siteKey = currentScript ? currentScript.getAttribute('data-site') : null;
    if (!siteKey) return;

    // Ambil origin dari lokasi script ini sendiri, supaya beacon selalu
    // dikirim ke domain LinkMe yang benar (aman dipakai di custom domain).
    var scriptUrl = new URL(currentScript.src);
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
