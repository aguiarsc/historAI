import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import rehypeHighlight from 'rehype-highlight';
import rehypeSanitize from 'rehype-sanitize';
import { 
  sanitizeSchema, 
  sanitizeUrl, 
  sanitizeCssProperties,
  detectXssRisks,
  logSanitization 
} from '../../utils/sanitize';

/**
 * Props for the MarkdownPreview component.
 * @property {string} content - Markdown content to render
 * @property {string} theme - Theme name (e.g. 'dark', 'light')
 */
interface MarkdownPreviewProps {
  content: string;
  theme: string;
}

/**
 * Renders markdown content as sanitized HTML with syntax highlighting.
 * Blocks unsafe content and warns if XSS risks are detected.
 * @param {MarkdownPreviewProps} props
 */
const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content, theme }) => {
  const hasXssRisks = useMemo(() => {
    const result = detectXssRisks(content);
    if (result) {
      logSanitization('Detected potential XSS pattern in markdown content');
    }
    return result;
  }, [content]);
  
  if (hasXssRisks) {
    return (
      <div className={`markdown-preview ${theme}-theme warning`}>
        <div className="security-warning">
          <p><strong>⚠️ Security Warning:</strong> The content contains potentially unsafe patterns that have been blocked.</p>
          <p>If you trust the source of this content, you can edit it to remove potentially malicious code.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`markdown-preview ${theme}-theme`}>
      <ReactMarkdown
        children={content}
        remarkPlugins={[remarkParse, remarkGfm]}
        rehypePlugins={[
          [rehypeSanitize, sanitizeSchema],
          rehypeHighlight
        ]}
        components={{
          img: ({node, ...props}) => {
            const safeSrc = sanitizeUrl(props.src || '', true);
            
            const safeStyle = props.style ? 
              { ...props.style, maxWidth: '100%' } : 
              { maxWidth: '100%' };
            return <img 
              {...props} 
              src={safeSrc}
              alt={props.alt || ''} 
              style={safeStyle}
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = ''; 
                e.currentTarget.alt = 'Error loading image';
                logSanitization(`Failed to load image: ${props.src}`);
              }}
            />;
          },
          table: ({node, children, ...props}) => (
            <div className="table-wrapper">
              <table {...props}>{children}</table>
            </div>
          ),
          a: ({node, ...props}) => {
            const safeHref = sanitizeUrl(props.href || '');
            
            if (safeHref !== props.href) {
              logSanitization(`Sanitized potentially unsafe URL: ${props.href}`);
            }
            
            const safeTitle = props.title ? 
              props.title.replace(/[<>\"']/g, '') : 
              undefined;
            
            return (
              <a 
                {...props} 
                href={safeHref || '#'}
                title={safeTitle}
                target="_blank" 
                rel="noopener noreferrer nofollow"
              />
            );
          },
          div: ({ node, style, ...props }: any) => {
            if (style && typeof style === 'string') {
              const safeStyle = sanitizeCssProperties(style);
              return <div style={safeStyle} {...props} />;
            }
            return <div {...props} />;
          },
          span: ({ node, style, ...props }: any) => {
            if (style && typeof style === 'string') {
              const safeStyle = sanitizeCssProperties(style);
              return <span style={safeStyle} {...props} />;
            }
            return <span {...props} />;
          }
        }}
      />
    </div>
  );
};

export default MarkdownPreview;
