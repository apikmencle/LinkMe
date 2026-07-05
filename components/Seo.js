import Head from 'next/head';

export default function Seo({ title, description, noindex }) {
  const fullTitle = title ? `${title} · LinkMe` : 'LinkMe — Pemendek Tautan Modern';
  const desc = description
    || 'LinkMe memendekkan tautan panjang, mencatat setiap klik, dan menyajikan analitik lengkap dalam satu dasbor.';

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
