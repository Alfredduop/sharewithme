import { ViewType } from './types';

interface SEOConfig {
  title: string;
  description: string;
  keywords: string[];
  canonical?: string;
  ogImage?: string;
  structuredData?: any;
  noindex?: boolean;
}

const baseUrl = 'https://sharewithme.io';
const defaultOgImage = `${baseUrl}/og-image.jpg`;

const seoConfigs: Record<ViewType, SEOConfig> = {
  landing: {
    title: 'Share With Me - Find Your Perfect Flatmate in Australia | AI-Powered Roommate Matching',
    description: 'Australia\'s #1 AI-powered flatmate matching platform. Find compatible housemates through personality-based matching. 100% free, verified users, secure messaging. Join thousands finding their perfect share house.',
    keywords: [
      'flatmate finder australia',
      'roommate matching',
      'share house australia',
      'find housemate',
      'ai personality matching',
      'compatible flatmates',
      'verified housemates',
      'free flatmate platform',
      'sydney flatmate',
      'melbourne flatmate',
      'brisbane flatmate',
      'perth flatmate',
      'adelaide flatmate',
      'student accommodation',
      'young professionals housing',
      'safe flatmate finder',
      'personality compatibility',
      'sharehouse community',
      'rental accommodation',
      'house sharing platform'
    ],
    canonical: baseUrl,
    ogImage: defaultOgImage,
    structuredData: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': `${baseUrl}/#organization`,
          name: 'Share With Me',
          url: baseUrl,
          logo: {
            '@type': 'ImageObject',
            url: `${baseUrl}/logo.png`,
            width: 200,
            height: 60
          },
          sameAs: [
            'https://www.facebook.com/sharewithme.au',
            'https://www.instagram.com/sharewithme.au',
            'https://www.linkedin.com/company/sharewithme-au'
          ],
          contactPoint: {
            '@type': 'ContactPoint',
            telephone: '+61-2-1234-5678',
            contactType: 'customer service',
            email: 'hello@sharewithme.io',
            availableLanguage: 'English'
          }
        },
        {
          '@type': 'WebSite',
          '@id': `${baseUrl}/#website`,
          url: baseUrl,
          name: 'Share With Me',
          description: 'Australia\'s smartest AI-powered flatmate matching platform',
          publisher: {
            '@id': `${baseUrl}/#organization`
          },
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: `${baseUrl}/search?q={search_term_string}`
            },
            'query-input': 'required name=search_term_string'
          }
        },
        {
          '@type': 'LocalBusiness',
          '@id': `${baseUrl}/#localbusiness`,
          name: 'Share With Me',
          image: `${baseUrl}/logo.png`,
          description: 'AI-powered flatmate matching platform for Australians',
          url: baseUrl,
          telephone: '+61-2-1234-5678',
          email: 'hello@sharewithme.io',
          address: {
            '@type': 'PostalAddress',
            streetAddress: 'Level 5, 126 Phillip Street',
            addressLocality: 'Sydney',
            addressRegion: 'NSW',
            postalCode: '2000',
            addressCountry: 'AU'
          },
          geo: {
            '@type': 'GeoCoordinates',
            latitude: -33.8688,
            longitude: 151.2093
          },
          areaServed: [
            {
              '@type': 'Country',
              name: 'Australia'
            },
            {
              '@type': 'State',
              name: 'New South Wales'
            },
            {
              '@type': 'State', 
              name: 'Victoria'
            },
            {
              '@type': 'State',
              name: 'Queensland'
            },
            {
              '@type': 'State',
              name: 'Western Australia'
            },
            {
              '@type': 'State',
              name: 'South Australia'
            },
            {
              '@type': 'State',
              name: 'Tasmania'
            }
          ],
          serviceType: 'Flatmate Matching Service',
          priceRange: 'Free',
          openingHours: 'Mo,Tu,We,Th,Fr,Sa,Su 00:00-23:59'
        },
        {
          '@type': 'Service',
          '@id': `${baseUrl}/#service`,
          name: 'AI-Powered Flatmate Matching',
          description: 'Advanced personality-based matching algorithm to find compatible housemates',
          provider: {
            '@id': `${baseUrl}/#organization`
          },
          areaServed: {
            '@type': 'Country',
            name: 'Australia'
          },
          hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name: 'Flatmate Services',
            itemListElement: [
              {
                '@type': 'Offer',
                itemOffered: {
                  '@type': 'Service',
                  name: 'AI Personality Quiz',
                  description: 'Comprehensive personality assessment for flatmate compatibility'
                },
                price: '0',
                priceCurrency: 'AUD'
              },
              {
                '@type': 'Offer',
                itemOffered: {
                  '@type': 'Service',
                  name: 'Verified User Matching',
                  description: 'ID-verified user database with secure messaging'
                },
                price: '0',
                priceCurrency: 'AUD'
              },
              {
                '@type': 'Offer',
                itemOffered: {
                  '@type': 'Service',
                  name: 'Property Listings',
                  description: 'Free property and room listing service'
                },
                price: '0',
                priceCurrency: 'AUD'
              }
            ]
          }
        },
        {
          '@type': 'FAQPage',
          '@id': `${baseUrl}/#faq`,
          mainEntity: [
            {
              '@type': 'Question',
              name: 'How does the AI flatmate matching work?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Our AI analyses your personality traits, lifestyle preferences, cleanliness habits, social tendencies, and living requirements through a comprehensive 19-question quiz. It then matches you with compatible flatmates based on compatibility scores across multiple dimensions.'
              }
            },
            {
              '@type': 'Question',
              name: 'Is Share With Me really free?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes, Share With Me is completely free forever. There are no fees, subscriptions, commissions, or hidden costs. We believe everyone deserves access to safe, compatible housing without financial barriers.'
              }
            },
            {
              '@type': 'Question',
              name: 'How are users verified?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'All users undergo comprehensive ID verification including government ID document verification and facial recognition matching. This ensures you\'re connecting with genuine, verified individuals in our community.'
              }
            },
            {
              '@type': 'Question',
              name: 'Which areas in Australia does Share With Me cover?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Share With Me covers all major Australian cities and regions including Sydney, Melbourne, Brisbane, Perth, Adelaide, Canberra, Hobart, and Darwin, as well as regional areas across all states and territories.'
              }
            },
            {
              '@type': 'Question',
              name: 'What makes Share With Me different from other flatmate platforms?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Share With Me uses advanced AI personality matching, requires full ID verification, offers secure in-app messaging, includes a community marketplace, and provides expert rental guides - all completely free with no fees or commissions.'
              }
            }
          ]
        }
      ]
    }
  },
  
  auth: {
    title: 'Sign Up | Join Share With Me - Australia\'s #1 Flatmate Platform',
    description: 'Create your free account on Share With Me. Take the AI personality quiz, get verified, and start finding compatible flatmates in Australia. Quick 5-minute setup, completely free.',
    keywords: [
      'sign up flatmate platform',
      'create flatmate account',
      'join share house community',
      'flatmate registration australia',
      'verified flatmate signup',
      'ai personality quiz',
      'free flatmate account'
    ],
    canonical: `${baseUrl}/signup`
  },
  
  quiz: {
    title: 'AI Personality Quiz | Find Compatible Flatmates | Share With Me',
    description: 'Take our comprehensive AI personality quiz to find your perfect flatmate match. 19 questions covering lifestyle, cleanliness, social preferences, and compatibility factors.',
    keywords: [
      'flatmate personality quiz',
      'ai compatibility test',
      'housemate matching quiz',
      'personality assessment flatmates',
      'compatibility quiz australia',
      'lifestyle matching test',
      'roommate personality test'
    ],
    canonical: `${baseUrl}/personality-quiz`,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Quiz',
      name: 'AI Flatmate Personality Quiz',
      description: 'Comprehensive personality assessment for finding compatible flatmates',
      about: 'Flatmate compatibility and lifestyle matching',
      educationalLevel: 'Adult',
      timeRequired: 'PT5M',
      interactivityType: 'active',
      learningResourceType: 'assessment',
      creator: {
        '@type': 'Organization',
        name: 'Share With Me'
      }
    }
  },
  
  chat: {
    title: 'Messages | Connect with Compatible Flatmates | Share With Me',
    description: 'Secure messaging with verified flatmate matches. Chat safely with potential housemates, share photos, and arrange meetups through our encrypted platform.',
    keywords: [
      'flatmate messaging',
      'secure housemate chat',
      'verified user messaging',
      'flatmate communication',
      'safe messaging platform',
      'encrypted flatmate chat'
    ],
    canonical: `${baseUrl}/messages`,
    noindex: true
  },
  
  marketplace: {
    title: 'Community Marketplace | Buy & Sell with Flatmates | Share With Me',
    description: 'Trade household items, furniture, and appliances with your flatmate community. Safe, verified marketplace for share house essentials across Australia.',
    keywords: [
      'flatmate marketplace',
      'share house furniture',
      'household items trading',
      'community marketplace australia',
      'verified user marketplace',
      'flatmate buy sell',
      'household goods sharing'
    ],
    canonical: `${baseUrl}/marketplace`
  },
  
  listing: {
    title: 'List Your Property Free | Post Rooms & Properties | Share With Me',
    description: 'List your spare rooms and properties completely free. No commission fees, unlimited photos, detailed preferences. Reach verified, compatible flatmates across Australia.',
    keywords: [
      'list property free australia',
      'post room listing',
      'free property advertising',
      'room rental listing',
      'no commission property listing',
      'flatmate property listing',
      'spare room advertising'
    ],
    canonical: `${baseUrl}/list-property`
  },
  
  blog: {
    title: 'Expert Guides & Tips | Share House Living Blog | Share With Me',
    description: 'Comprehensive guides for Australian renters. Share house tips, rental advice, moving guides, legal information, and lifestyle content for better flatmate experiences.',
    keywords: [
      'share house guides australia',
      'rental tips australia',
      'flatmate advice',
      'moving guides australia',
      'tenant rights australia',
      'share house living tips',
      'rental market insights'
    ],
    canonical: `${baseUrl}/blog`
  },
  
  'blog-post': {
    title: 'Share House Guide | Expert Rental Advice | Share With Me Blog',
    description: 'Expert advice and comprehensive guides for successful share house living in Australia. Tips from rental experts and experienced flatmates.',
    keywords: [
      'share house advice',
      'rental guide australia',
      'flatmate tips',
      'share house success',
      'rental experience'
    ],
    canonical: `${baseUrl}/blog/guide`
  },
  
  contact: {
    title: 'Contact Us | Get Help & Support | Share With Me Australia',
    description: 'Get help with Share With Me. Contact our support team for assistance with flatmate matching, account issues, or general inquiries. Fast, friendly Australian support.',
    keywords: [
      'contact share with me',
      'flatmate platform support',
      'customer service australia',
      'help with flatmate matching',
      'support contact'
    ],
    canonical: `${baseUrl}/contact`
  },
  
  terms: {
    title: 'Terms of Service | Share With Me Australia',
    description: 'Terms of Service for Share With Me flatmate platform. Read our user agreement, privacy policy, and community guidelines for Australian users.',
    keywords: [
      'terms of service',
      'privacy policy',
      'user agreement',
      'community guidelines',
      'legal terms australia'
    ],
    canonical: `${baseUrl}/terms`,
    noindex: true
  },
  
  'account-settings': {
    title: 'Account Settings | Manage Your Profile | Share With Me',
    description: 'Manage your Share With Me account settings. Update profile, preferences, privacy settings, and verification status.',
    keywords: [
      'account settings',
      'profile management',
      'privacy settings',
      'account preferences'
    ],
    canonical: `${baseUrl}/settings`,
    noindex: true
  }
};

export const updateSEO = (viewType: ViewType, customData?: Partial<SEOConfig>) => {
  const config = { ...seoConfigs[viewType], ...customData };
  
  // Update document title
  document.title = config.title;
  
  // Update or create meta tags
  updateMetaTag('description', config.description);
  updateMetaTag('keywords', config.keywords.join(', '));
  
  // Canonical URL
  if (config.canonical) {
    updateLinkTag('canonical', config.canonical);
  }
  
  // Open Graph tags
  updateMetaTag('og:title', config.title, 'property');
  updateMetaTag('og:description', config.description, 'property');
  updateMetaTag('og:url', config.canonical || window.location.href, 'property');
  updateMetaTag('og:type', 'website', 'property');
  updateMetaTag('og:site_name', 'Share With Me', 'property');
  updateMetaTag('og:locale', 'en_AU', 'property');
  
  if (config.ogImage) {
    updateMetaTag('og:image', config.ogImage, 'property');
    updateMetaTag('og:image:width', '1200', 'property');
    updateMetaTag('og:image:height', '630', 'property');
    updateMetaTag('og:image:alt', config.title, 'property');
  }
  
  // Twitter Card tags
  updateMetaTag('twitter:card', 'summary_large_image', 'name');
  updateMetaTag('twitter:title', config.title, 'name');
  updateMetaTag('twitter:description', config.description, 'name');
  updateMetaTag('twitter:site', '@sharewithme_au', 'name');
  updateMetaTag('twitter:creator', '@sharewithme_au', 'name');
  
  if (config.ogImage) {
    updateMetaTag('twitter:image', config.ogImage, 'name');
    updateMetaTag('twitter:image:alt', config.title, 'name');
  }
  
  // Additional SEO meta tags
  updateMetaTag('robots', config.noindex ? 'noindex,nofollow' : 'index,follow');
  updateMetaTag('author', 'Share With Me');
  updateMetaTag('publisher', 'Share With Me');
  updateMetaTag('application-name', 'Share With Me');
  updateMetaTag('apple-mobile-web-app-title', 'Share With Me');
  updateMetaTag('theme-color', '#7c3aed');
  updateMetaTag('msapplication-TileColor', '#7c3aed');
  updateMetaTag('mobile-web-app-capable', 'yes');
  updateMetaTag('apple-mobile-web-app-capable', 'yes');
  updateMetaTag('apple-mobile-web-app-status-bar-style', 'default');
  
  // Geographic targeting
  updateMetaTag('geo.region', 'AU');
  updateMetaTag('geo.country', 'Australia');
  updateMetaTag('geo.placename', 'Australia');
  updateMetaTag('ICBM', '-25.2744, 133.7751'); // Australia center coordinates
  
  // Language and locale
  updateMetaTag('language', 'English');
  updateMetaTag('content-language', 'en-AU');
  
  // Structured data
  if (config.structuredData) {
    updateStructuredData(config.structuredData);
  }
  
  // Update HTML lang attribute
  document.documentElement.lang = 'en-AU';
};

const updateMetaTag = (name: string, content: string, attribute: 'name' | 'property' = 'name') => {
  let meta = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
  
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attribute, name);
    document.head.appendChild(meta);
  }
  
  meta.content = content;
};

const updateLinkTag = (rel: string, href: string) => {
  let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
  
  if (!link) {
    link = document.createElement('link');
    link.rel = rel;
    document.head.appendChild(link);
  }
  
  link.href = href;
};

const updateStructuredData = (data: any) => {
  // Remove existing structured data
  const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
  existingScripts.forEach(script => script.remove());
  
  // Add new structured data
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data, null, 2);
  document.head.appendChild(script);
};

// Preconnect to important domains for performance
export const addPreconnects = () => {
  const domains = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    'https://cdn.supabase.com'
  ];
  
  domains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
};

// Add hreflang for international SEO (future expansion)
export const addHrefLang = () => {
  const hreflangs = [
    { lang: 'en-AU', href: baseUrl },
    { lang: 'en', href: baseUrl },
    { lang: 'x-default', href: baseUrl }
  ];
  
  hreflangs.forEach(({ lang, href }) => {
    const link = document.createElement('link');
    link.rel = 'alternate';
    link.hrefLang = lang;
    link.href = href;
    document.head.appendChild(link);
  });
};

// Performance and Core Web Vitals optimization
export const optimizePageLoad = () => {
  // Add resource hints
  const resourceHints = [
    { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
    { rel: 'dns-prefetch', href: '//fonts.gstatic.com' },
    { rel: 'preconnect', href: 'https://fonts.googleapis.com', crossOrigin: 'anonymous' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' }
  ];
  
  resourceHints.forEach(hint => {
    const link = document.createElement('link');
    link.rel = hint.rel;
    link.href = hint.href;
    if (hint.crossOrigin) link.crossOrigin = hint.crossOrigin;
    document.head.appendChild(link);
  });
};

// Initialize SEO optimizations
export const initializeSEO = () => {
  addPreconnects();
  addHrefLang();
  optimizePageLoad();
  
  // Set initial meta tags that don't change
  updateMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=5');
  updateMetaTag('format-detection', 'telephone=no');
  updateMetaTag('referrer', 'origin-when-cross-origin');
};