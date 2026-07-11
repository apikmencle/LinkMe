import { supabaseAdmin } from '../lib/supabaseAdmin';

const MILESTONES = [10, 50, 100, 500, 1000];

export async function getServerSideProps({ params }) {
  const { code } = params;

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
      message: `Tautan /${code} mencapai ${newClicks} klik! 🎉`,
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
