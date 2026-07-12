import Head from 'next/head';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://link-me-bay.vercel.app';
const OG_IMAGE = `${SITE_URL}/og-image.png`;

export default function Seo({ title, description, noindex }) {
  const fullTitle = title ? `${title} \u00B7 LinkMe` : 'LinkMe \u2014 Analisis Traffic Blog & Landing Page';
  const desc = description
    || 'LinkMe menganalisis traffic blog atau landing page kamu secara real-time, lengkap dengan pemendek tautan sebagai fitur pelengkap.';

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={SITE_URL} />
      <meta property="og:image" content={OG_IMAGE} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={'LinkMe \u2014 Analisis Traffic Blog & Landing Page'} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={OG_IMAGE} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
    </Head>
  );
    }
