import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  type?: string;
  image?: string;
}

const defaultSEO = {
  title: 'Philippine Cornet - Graphothérapeute à Chargé (37)',
  description: 'Graphothérapeute diplômée à Chargé près d\'Amboise. Rééducation de l\'écriture pour enfants, adolescents et adultes.',
  image: 'https://philippinecornet.com/og-image.jpg',
  type: 'website',
};

const pageSEO: Record<string, SEOProps> = {
  '/': {
    title: 'Philippine Cornet - Graphothérapeute à Chargé (37) | Rééducation de l\'écriture',
    description: 'Graphothérapeute diplômée à Chargé près d\'Amboise (37). Rééducation de l\'écriture pour enfants, adolescents et adultes. Bilan graphomoteur, séances personnalisées.',
  },
  '/methode': {
    title: 'La Méthode de Graphothérapie | Philippine Cornet Graphothérapeute',
    description: 'Découvrez la méthode de graphothérapie : rééducation de l\'écriture pour enfants, adolescents et adultes. Bilan initial, séances de rééducation et suivi personnalisé à Chargé (37).',
  },
  '/tarifs': {
    title: 'Tarifs Graphothérapie - Bilan et Séances | Philippine Cornet',
    description: 'Tarifs des séances de graphothérapie à Chargé (37) : bilan initial 170€, séance de suivi 50€. Informations sur le remboursement par les mutuelles.',
  },
  '/faq': {
    title: 'FAQ Graphothérapie - Questions Fréquentes | Philippine Cornet',
    description: 'Réponses aux questions fréquentes sur la graphothérapie : âge minimum, nombre de séances, remboursement, différence avec ergothérapie.',
  },
  '/contact': {
    title: 'Contact et Prise de RDV | Philippine Cornet Graphothérapeute Chargé',
    description: 'Prenez rendez-vous avec Philippine Cornet, graphothérapeute à Chargé (37). Consultations mercredi, jeudi et samedi. Cabinet accessible PMR près d\'Amboise.',
  },
  '/mentions-legales': {
    title: 'Mentions Légales | Philippine Cornet Graphothérapeute',
    description: 'Mentions légales du site philippinecornet.com - Cabinet de graphothérapie.',
  },
  '/politique-confidentialite': {
    title: 'Politique de Confidentialité | Philippine Cornet Graphothérapeute',
    description: 'Politique de confidentialité et protection des données personnelles du cabinet de graphothérapie Philippine Cornet.',
  },
};

export function SEO({ title, description, canonical, type, image }: SEOProps) {
  const location = useLocation();
  const path = location.pathname;
  
  const currentPageSEO = pageSEO[path] || {};
  
  const seo = {
    title: title || currentPageSEO.title || defaultSEO.title,
    description: description || currentPageSEO.description || defaultSEO.description,
    canonical: canonical || `https://philippinecornet.com${path === '/' ? '' : path}`,
    type: type || defaultSEO.type,
    image: image || defaultSEO.image,
  };

  useEffect(() => {
    // Update title
    document.title = seo.title;
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', seo.description);
    }
    
    // Update canonical
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.setAttribute('href', seo.canonical);
    }
    
    // Update Open Graph
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDescription = document.querySelector('meta[property="og:description"]');
    const ogUrl = document.querySelector('meta[property="og:url"]');
    const ogType = document.querySelector('meta[property="og:type"]');
    
    if (ogTitle) ogTitle.setAttribute('content', seo.title);
    if (ogDescription) ogDescription.setAttribute('content', seo.description);
    if (ogUrl) ogUrl.setAttribute('content', seo.canonical);
    if (ogType) ogType.setAttribute('content', seo.type);
    
    // Update Twitter Card
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    
    if (twitterTitle) twitterTitle.setAttribute('content', seo.title);
    if (twitterDescription) twitterDescription.setAttribute('content', seo.description);
    
  }, [seo.title, seo.description, seo.canonical, seo.type]);

  return null;
}
