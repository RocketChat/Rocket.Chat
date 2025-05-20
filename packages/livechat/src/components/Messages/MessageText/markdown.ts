/* eslint-disable import/no-unresolved */

import type { Renderer } from 'markdown-it';
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({
  html: true,
  breaks: true,
  linkify: true,
  typographer: true,
});

// Keep default render behavior for links
const defaultRender = md.renderer.rules.link_open || ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));

// Add target and rel to links
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const targetAttrIndex = tokens[idx].attrIndex('target');
  const relAttrIndex = tokens[idx].attrIndex('rel');

  if (targetAttrIndex < 0) {
    tokens[idx].attrPush(['target', '_blank']);
  } else {
    const { attrs } = tokens[idx];
    if (attrs) {
      attrs[targetAttrIndex][1] = '_blank';
    }
  }

  if (relAttrIndex < 0) {
    tokens[idx].attrPush(['rel', 'noopener noreferrer']);
  } else {
    const { attrs } = tokens[idx];
    if (attrs) {
      attrs[relAttrIndex][1] = 'noopener noreferrer';
    }
  }

  return defaultRender(tokens, idx, options, env, self);
};

// Bold style override: treat *italic* as <strong>
md.use((md) => {
  const renderStrong: Renderer.RenderRule = (tokens, idx, opts, _, slf) => {
    const token = tokens[idx];
    if (token.markup === '*') {
      token.tag = 'strong';
    }
    return slf.renderToken(tokens, idx, opts);
  };

  md.renderer.rules.em_open = renderStrong;
  md.renderer.rules.em_close = renderStrong;
});

// ~strikethrough~ custom rule
md.use((md) => {
  md.inline.ruler.push('strikethrough', (state, silent) => {
    const marker = state.src.charCodeAt(state.pos);
    if (silent || marker !== 0x7e /* ~ */) {
      return false;
    }

    const scanned = state.scanDelims(state.pos, true);
    const ch = String.fromCharCode(marker);
    const len = scanned.length;

    for (let i = 0; i < len; i++) {
      const token = state.push('text', '', 0);
      token.content = ch;

      state.delimiters.push({
        marker,
        length: 0,
        token: state.tokens.length - 1,
        end: -1,
        open: scanned.can_open,
        close: scanned.can_close,
      });
    }

    state.pos += scanned.length;
    return true;
  });
});

// ✅ Add <t:timestamp:format> parsing
md.use((md) => {
  const timestampRegex = /^<t:(\d+):([tTdDfFR])>$/;

  md.inline.ruler.before('emphasis', 'timestamp_tag', (state, silent) => {
    const match = state.src.slice(state.pos).match(timestampRegex);
    if (!match) return false;

    if (!silent) {
      const token = state.push('text', '', 0);
      const unix = Number(match[1]);
      const format = match[2];
      const date = new Date(unix * 1000);
      token.content = formatTimestamp(date, format);
    }

    state.pos += match[0].length;
    return true;
  });
});

// ✅ Date format converter
function formatTimestamp(date: Date, format: string): string {
  switch (format) {
    case 't': return date.toLocaleTimeString();        // short time
    case 'T': return date.toTimeString();              // long time
    case 'd': return date.toLocaleDateString();        // short date
    case 'D': return date.toDateString();              // long date
    case 'f': return date.toLocaleString();            // full date & time
    case 'F': return date.toString();                  // full long
    case 'R': return getRelativeTime(date);            // relative
    default: return date.toISOString();
  }
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = Math.round((date.getTime() - now.getTime()) / 1000);
  const seconds = Math.abs(diff);
  const isPast = diff < 0;

  if (seconds < 60) return isPast ? `${seconds}s ago` : `in ${seconds}s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return isPast ? `${minutes}m ago` : `in ${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return isPast ? `${hours}h ago` : `in ${hours}h`;
  const days = Math.round(hours / 24);
  return isPast ? `${days}d ago` : `in ${days}d`;
}

// Export render function
export const renderMarkdown = (...args: Parameters<typeof md.render>) => md.render(...args);
