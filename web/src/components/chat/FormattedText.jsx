import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

/**
 * A professional Markdown parser for React.
 * Designed for Civic Intelligence outputs.
 */
export const FormattedText = ({ text }) => {
  if (!text) return null;

  // Budget Limit UI
  if (text.includes("Budget limit reached")) {
    return (
      <div style={{ background: '#FEF2F2', border: '1px solid #EF4444', padding: '16px', borderRadius: '12px', display: 'flex', gap: '12px' }}>
        <AlertCircle color="#EF4444" size={20} style={{ flexShrink: 0 }} />
        <div>
          <strong style={{ color: '#EF4444', display: 'block', marginBottom: '4px' }}>Budget Protection Active</strong>
          <p style={{ fontSize: '13px', color: '#7F1D1D', margin: 0 }}>{text}</p>
        </div>
      </div>
    );
  }

  const lines = text.split('\n');

  return (
    <div className="civic-markdown">
      {lines.map((line, i) => {
        let content = line.trim();
        const key = `line-${i}`;

        if (!content) return <div key={key} style={{ height: '12px' }} />;

        // Headers
        if (content.startsWith('### ')) {
          return <h3 key={key} style={{ fontSize: '18px', fontWeight: 900, color: 'var(--ashoka-blue)', margin: '20px 0 10px' }}>{parseInline(content.substring(4))}</h3>;
        }
        if (content.startsWith('## ')) {
          return <h2 key={key} style={{ fontSize: '22px', fontWeight: 900, color: 'var(--ashoka-blue)', margin: '24px 0 12px', borderBottom: '2px solid var(--border)' }}>{parseInline(content.substring(3))}</h2>;
        }

        // List Handling
        const isBullet = content.startsWith('* ') || content.startsWith('- ');
        const numMatch = content.match(/^(\d+)\.\s+(.*)/);

        if (isBullet) {
          return (
            <div key={key} style={{ display: 'flex', gap: '12px', marginBottom: '8px', paddingLeft: '8px' }}>
              <div style={{ marginTop: '8px', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--eci-saffron)', flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: '15px', color: 'var(--text-main)' }}>{parseInline(content.substring(2))}</div>
            </div>
          );
        }

        if (numMatch) {
          return (
            <div key={key} style={{ display: 'flex', gap: '12px', marginBottom: '8px', paddingLeft: '8px' }}>
              <span style={{ color: 'var(--ashoka-blue)', fontWeight: 900, fontSize: '14px', minWidth: '20px' }}>{numMatch[1]}.</span>
              <div style={{ flex: 1, fontSize: '15px', color: 'var(--text-main)' }}>{parseInline(numMatch[2])}</div>
            </div>
          );
        }

        // Regular Paragraph
        return (
          <p key={key} style={{ marginBottom: '12px', fontSize: '15px', color: 'var(--text-main)', opacity: 0.9 }}>
            {parseInline(line)}
          </p>
        );
      })}
    </div>
  );
};

function parseInline(text) {
  if (!text) return '';
  
  // Regex to match **bold**, *italic*, and `code`
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
  
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ color: 'var(--ashoka-blue)', fontWeight: 800 }}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <span key={i} style={{ color: 'var(--eci-saffron)', fontWeight: 600 }}>{part.slice(1, -1)}</span>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} style={{ background: 'var(--bg-aside)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.9em', color: 'var(--ashoka-blue)' }}>{part.slice(1, -1)}</code>;
    }
    return part;
  });
}
