import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

// Widget verifikasi anti-bot Cloudflare Turnstile. Tokennya nanti dikirim
// sebagai `captchaToken` ke supabase.auth.signUp / signInWithPassword -
// verifikasi sebenarnya terjadi di server Supabase (bukan di sini), jadi
// aman walau Secret Key tidak pernah ada di kode frontend.
const Turnstile = forwardRef(function Turnstile({ onVerify, onExpire }, ref) {
  const containerRef = useRef(null);
  const widgetId = useRef(null);

  useImperativeHandle(ref, () => ({
    reset() {
      if (window.turnstile && widgetId.current !== null) {
        window.turnstile.reset(widgetId.current);
      }
    },
  }));

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey) return;

    function render() {
      if (!window.turnstile || !containerRef.current || widgetId.current !== null) return;
      widgetId.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: onVerify,
        'expired-callback': onExpire,
        'error-callback': onExpire,
      });
    }

    if (window.turnstile) {
      render();
    } else {
      // Script dimuat async di _document.js, mungkin belum siap saat mount.
      const interval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(interval);
          render();
        }
      }, 200);
      return () => clearInterval(interval);
    }

    return () => {
      if (window.turnstile && widgetId.current !== null) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!siteKey) {
    // Biar dev tidak bingung form kenapa tidak bisa submit kalau env belum diisi.
    return (
      <div className="auth-err" style={{ fontSize: '12.5px' }}>
        NEXT_PUBLIC_TURNSTILE_SITE_KEY belum diisi di .env.local
      </div>
    );
  }

  return <div ref={containerRef} className="turnstile-box" />;
});

export default Turnstile;
