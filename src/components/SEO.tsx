import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  ogImage?: string;
  ogType?: string;
  path?: string;
  keywords?: string;
}

const SITE_NAME = 'Mathemzi Edu';
const BASE_URL = (import.meta.env.VITE_SITE_URL || 'https://mathemziedu.vercel.app').replace(/\/$/, '');
const DEFAULT_OG_IMAGE = `${BASE_URL}/og.png`;

export default function SEO({ 
  title, 
  description, 
  ogImage = DEFAULT_OG_IMAGE, 
  ogType = 'website', 
  path = '',
  keywords,
}: SEOProps) {
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const url = `${BASE_URL}${path}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:alt" content={`${SITE_NAME} mathematics learning platform`} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content={`${SITE_NAME} mathematics learning platform`} />
    </Helmet>
  );
}
