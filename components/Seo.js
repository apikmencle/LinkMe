import Head from 'next/head';

export default function Seo({ title, description, noindex }) {
  const fullTitle = title ? `${title} · LinkMe` : 'LinkMe — Analisis Traffic Blog & Landing Page';
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
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
    </Head>
  );
      }
  
