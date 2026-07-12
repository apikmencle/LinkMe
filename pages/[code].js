import { supabaseAdmin } from '../lib/supabaseAdmin';

const MILESTONES = [10, 50, 100, 500, 1000];

// Bot/crawler dikenal yang mengunjungi link untuk membuat preview (WhatsApp,
// Telegram, dsb), mesin pencari, atau tool command-line. Kunjungan ini bukan
// klik asli manusia - tetap di-redirect (supaya preview tetap muncul benar),
// tapi TIDAK dihitung sebagai klik.
const BOT_UA_PATTERN =
  /facebookexternalhit|WhatsApp|TelegramBot|Twitterbot|Slackbot|LinkedInBot|Discordbot|Googlebot|bingbot|YandexBot|DuckDuckBot|Applebot|SkypeUriPreview|redditbot|Pinterest|Embedly|Quora Link Preview|W3C_Validator|curl|wget|python-requests|node-fetch|Go-http-client|bytespider|SemrushBot|AhrefsBot|MJ12bot|PetalBot/i;

function isBot(ua = '') {
  return BOT_UA_PATTERN.test(ua);
}

export async function getServerSideProps({ params, req }) {
  const { code } = params;
  const ua = req.headers['user-agent'] || '';

  if (isBot(ua)) {
    // Bot: cukup baca URL tujuannya, jangan ikut menambah counter klik.
    const { data, error } = await supabaseAdmin
      .from('links')
      .select('url')
      .eq('code', code)
      .maybeSingle();

    if (error || !data) {
      return { notFound: true };
    }

    return {
      redirect: {
        destination: data.url,
        permanent: false,
      },
    };
  }

  // increment_link_clicks melakukan baca+tulis dalam satu statement SQL
  // (lihat migrasi 006_atomic_link_clicks.sql) - aman dari race condition
  // dibanding pola lama (select clicks, +1 di JS, lalu update terpisah).
  const { data, error } = await supabaseAdmin.rpc('increment_link_clicks', {
    p_code: code,
  });

  const row = Array.isArray(data) ? data[0] : data;

  if (error || !row) {
    return { notFound: true };
  }

  const newClicks = row.new_clicks;

  if (row.owner_id && MILESTONES.includes(newClicks)) {
    await supabaseAdmin.from('notifications').insert({
      user_id: row.owner_id,
      message: `Tautan /${code} mencapai ${newClicks} klik! \u{1F389}`,
    });
  }

  return {
    redirect: {
      destination: row.target_url,
      permanent: false,
    },
  };
}

export default function RedirectPage() {
  return null;
}
