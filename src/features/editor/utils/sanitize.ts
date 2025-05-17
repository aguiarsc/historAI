import { defaultSchema } from 'rehype-sanitize';
import type { Schema } from 'hast-util-sanitize';

const SAFE_CSS_PROPERTIES = [
  'color', 'background-color', 'text-align', 'margin', 'margin-top', 
  'margin-right', 'margin-bottom', 'margin-left', 'padding', 'padding-top', 
  'padding-right', 'padding-bottom', 'padding-left', 'display', 'border',
  'border-top', 'border-right', 'border-bottom', 'border-left', 'width',
  'height', 'max-width', 'max-height', 'min-width', 'min-height',
  'font-size', 'font-weight', 'font-style', 'font-family', 'text-decoration',
  'border-radius', 'line-height', 'vertical-align'
];

const SAFE_URL_SCHEMES = ['http', 'https', 'mailto', 'tel', '#', 'data'];

const ALLOWED_ELEMENTS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
  'br', 'b', 'i', 'strong', 'em', 'a', 'pre', 
  'code', 'img', 'tt', 'div', 'ins', 'del', 
  'sup', 'sub', 'p', 'ol', 'ul', 'table', 
  'thead', 'tbody', 'tfoot', 'blockquote',
  'dl', 'dt', 'dd', 'kbd', 'q', 'samp', 
  'var', 'hr', 'ruby', 'rt', 'rp', 'li', 
  'tr', 'td', 'th', 'span', 's', 'strike', 
  'summary', 'details'
];

/**
 * Sanitizes a CSS style string, allowing only safe properties.
 * @param {string} cssText
 * @returns {string}
 */
export function sanitizeCssProperties(cssText: string): string {
  if (!cssText || typeof cssText !== 'string') {
    return '';
  }
  
  try {
    const properties = cssText.split(';')
      .map(prop => prop.trim())
      .filter(Boolean);
    const safeProperties = properties.filter(prop => {
      const propertyName = prop.split(':')[0]?.trim().toLowerCase();
      return propertyName && SAFE_CSS_PROPERTIES.includes(propertyName);
    });

    return safeProperties.join('; ');
  } catch (e) {
    logSanitization(`Invalid CSS: ${cssText}`);
    return '';
  }
}

/**
 * Sanitizes a URL, blocking dangerous or unsafe schemes.
 * @param {string} url
 * @param {boolean} [allowDataUrls=false] - Allow data URLs for images and PDFs
 * @returns {string}
 */
export function sanitizeUrl(url: string, allowDataUrls = false): string {
  if (!url || typeof url !== 'string') {
    return '';
  }
  
  try {
    const trimmedUrl = url.trim().toLowerCase();
    const dangerousSchemes = ['javascript:', 'data:', 'vbscript:', 'file:', 'about:'];
    
    if (dangerousSchemes.some(scheme => trimmedUrl.startsWith(scheme))) {
      if (trimmedUrl.startsWith('data:') && allowDataUrls && 
          (trimmedUrl.startsWith('data:image/') || trimmedUrl.startsWith('data:application/pdf'))) {
        return url;
      }
      
      logSanitization(`Blocked dangerous URL: ${url}`);
      return '';
    }
    
    if (trimmedUrl.includes(':')) {
      const scheme = trimmedUrl.split(':')[0];
      if (!SAFE_URL_SCHEMES.includes(scheme)) {
        logSanitization(`Blocked URL with unsafe scheme: ${url}`);
        return '';
      }
    }
    
    return url;
  } catch (e) {
    logSanitization(`Invalid URL: ${url}`);
    return '';
  }
}

/**
 * Sanitization schema for rehype-sanitize, specifying allowed elements and attributes.
 * @type {Schema}
 */
export const sanitizeSchema: Schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    '*': ['className', 'id'],
    div: [...(defaultSchema.attributes?.div || []), 'className', 'style'],
    code: [...(defaultSchema.attributes?.code || []), 'className', 'dataLanguage'],
    span: [...(defaultSchema.attributes?.span || []), 'className', 'style'],
    table: [...(defaultSchema.attributes?.table || []), 'className'],
    pre: [...(defaultSchema.attributes?.pre || []), 'className'],
    img: ['alt', 'src', 'title', 'width', 'height', 'style', 'loading'],
    a: [...(defaultSchema.attributes?.a || []), 'href', 'title', 'rel', 'target'],
  },
  clobberPrefix: 'user-content-',
  allowComments: false,
  protocols: {
    href: SAFE_URL_SCHEMES,
    src: ['http', 'https', 'data'],
  },
  tagNames: ALLOWED_ELEMENTS,
  allowDoctypes: false
};

export function detectXssRisks(html: string): boolean {
  if (!html || typeof html !== 'string') {
    return false;
  }
  
  const xssPatterns = [
    /<script[\s\S]*?>/i,
    /javascript\:/i,
    /on\w+\s*=\s*['"]?[^\s'">]+/i,
    /behaviour\s*=|expression\s*\([^)]*\)/i,
    /<iframe[\s\S]*?>/i,
    /<embed[\s\S]*?>/i,
    /<object[\s\S]*?>/i,
    /<form[\s\S]*?>/i,
    /<svg[\s\S]*?>/i,
    /<img[^>]+onerror\s*=[^>]+>/i,
    /<link[\s\S]*?>/i,
    /<style[\s\S]*?>/i,
    /data:text\/html/i
  ];
  
  return xssPatterns.some(pattern => pattern.test(html));
}
export const logSanitization = (message: string): void => {
  if (process.env.NODE_ENV === 'development') {
    console.warn('🛡️ Sanitization:', message);
  }
};

export function createSafeDataUrl(mimeType: string, content: string): string {
  try {
    const safeMimeTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf'];
    if (!safeMimeTypes.includes(mimeType)) {
      logSanitization(`Blocked unsafe MIME type: ${mimeType}`);
      return '';
    }
    
    const dataUrl = `data:${mimeType};base64,${btoa(content)}`;
    return dataUrl;
  } catch (e) {
    logSanitization(`Failed to create data URL: ${e}`);
    return '';
  }
}
