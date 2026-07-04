import { supabaseAdmin } from '../lib/supabaseAdmin';

const MILESTONES = [10, 50, 100, 500, 1000];

export async function getServerSideProps({ params }) {
  const { code } = params;

  const { data, error } = await supabaseAdmin
    .from('links')
    .select('*')
    .eq('code', code)
    .maybeSingle();

  if (error || !data) {
    return { notFound: true };
  }

  const newClicks = data.clicks + 1;

  await supabaseAdmin
    .from('links')
    .update({ clicks: newClicks })
    .eq('code', code);

  if (data.user_id && MILESTONES.includes(newClicks)) {
    await supabaseAdmin.from('notifications').insert({
      user_id: data.user_id,
      message: `Tautan /${code} mencapai ${newClicks} klik! 🎉`,
    });
  }

  return {
    redirect: {
      destination: data.url,
      permanent: false,
    },
  };
}

export default function RedirectPage() {
  return null;
}

