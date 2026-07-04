import { supabaseAdmin } from '../lib/supabaseAdmin';

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

  await supabaseAdmin
    .from('links')
    .update({ clicks: data.clicks + 1 })
    .eq('code', code);

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
