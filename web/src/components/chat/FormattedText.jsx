import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * A lightweight, zero-dependency Markdown parser for React.
 * Transforms **bold**, *italic*, and lists into semantic HTML.
 */
export const FormattedText = ({ text }) => {
  if (!text) return null;

  // Handle Budget Limit special case
  if (text.includes("Budget limit reached")) {
    return (
      <div style={{ background: 'rgba(255, 75, 75, 0.1)', border: '1px solid rgba(255, 75, 75, 0.2)', padding: '16px', borderRadius: '12px', display: 'flex', gap: '12px' }}>
        <AlertCircle color="#ff4b4b" size={20} style={{ flexShrink: 0 }} />
        <div>
          <strong style={{ color: '#ff4b4b', display: 'block', marginBottom: '4px' }}>Budget Protection Active</strong>
          <p style={{ fontSize: '13px', color: 'var(--ink-mid)', margin: 0 }}>{text}</p>
        </div>
      </div>
    );
  }

  const lines = text.split('\n');

  return (
    <div className="markdown-body">
      {lines.map((line, i) => {
        let content = line.trim();
        const key = `line-${i}`;

        if (!content) return <div key={key} style={{ height: '8px' }} />;

        // Dividers
        if (content === '---' || content === '***') {
          return <hr key={key} style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)', margin: '16px 0' }} />;
        }

        // Headers
        if (content.startsWith('### ')) {
          return <h3 key={key} style={{ fontSize: '18px', fontWeight: 800, color: 'var(--saffron)', margin: '16px 0 8px' }}>{parseInline(content.substring(4))}</h3>;
        }
        if (content.startsWith('## ')) {
          return <h2 key={key} style={{ fontSize: '20px', fontWeight: 900, color: '#fff', margin: '20px 0 10px' }}>{parseInline(content.substring(3))}</h2>;
        }

        // Bullet Points
        if (content.startsWith('* ') || content.startsWith('- ')) {
          return (
            <div key={key} style={{ display: 'flex', gap: '10px', marginBottom: '6px', paddingLeft: '8px' }}>
              <span style={{ color: 'var(--saffron)', fontWeight: 900, fontSize: '18px', lineHeight: 1 }}>•</span>
              <span style={{ flex: 1 }}>{parseInline(content.substring(2))}</span>
            </div>
          );
        }

        // Numbered Lists
        const numMatch = content.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={key} style={{ display: 'flex', gap: '10px', marginBottom: '8px', paddingLeft: '8px' }}>
              <span style={{ color: 'var(--saffron)', fontWeight: 800, fontSize: '14px' }}>{numMatch[1]}.</span>
              <span style={{ flex: 1 }}>{parseInline(numMatch[2])}</span>
            </div>
          );
        }

        // Regular Paragraph
        return (
          <p key={key} style={{ marginBottom: '10px', opacity: 0.9 }}>
            {parseInline(line)}
          </p>
        );
      })}
    </div>
  );
};

function parseInline(text) {
  if (!text) return '';
  
  // Handle bold **text**
  let parts = text.split(/(\*\*.*?\*\*)/g);
  
  let elements = parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={`b-${i}`} style={{ color: '#fff', fontWeight: 800 }}>{part.slice(2, -2)}</strong>;
    }
    
    // Handle italic *text* (but not bullets)
    let subParts = part.split(/(\*.*?\*)/g);
    return subParts.map((sub, j) => {
      if (sub.startsWith('*') && sub.endsWith('*')) {
        return <em key={`i-${i}-${j}`} style={{ color: 'var(--saffron)', fontStyle: 'normal', fontWeight: 600 }}>{sub.slice(1, -1)}</em>;
      }
      return sub;
    });
  });

  return elements;
}
