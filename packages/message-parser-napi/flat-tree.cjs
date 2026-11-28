'use strict';

const SK_NAMES = [
  'PARAGRAPH', 'HEADING', 'CODE', 'BIG_EMOJI', 'ORDERED_LIST', 'UNORDERED_LIST',
  'TASKS', 'QUOTE', 'KATEX', 'LINE_BREAK', 'HORIZONTAL_RULE', 'SPOILER_BLOCK', 'TABLE',
  'TABLE_ROW', 'TABLE_CELL', 'CODE_LINE', 'LIST_ITEM', 'TASK',
  'BOLD', 'ITALIC', 'STRIKE', 'INLINE_CODE', 'EMOJI', 'EMOJI',
  'MENTION_USER', 'MENTION_CHANNEL', 'LINK', 'IMAGE', 'INLINE_KATEX', 'TIMESTAMP',
  'COLOR', 'SPOILER', 'PLAIN_TEXT',
];

const SK = {
  Paragraph: 0, Heading: 1, Code: 2, BigEmoji: 3, OrderedList: 4, UnorderedList: 5,
  Tasks: 6, Quote: 7, Katex: 8, LineBreak: 9, HorizontalRule: 10, SpoilerBlock: 11,
  Table: 12, TableRow: 13, TableCell: 14, CodeLine: 15, ListItem: 16, TaskItem: 17,
  Bold: 18, Italic: 19, Strike: 20, InlineCode: 21, EmojiUnicode: 22, EmojiShortCode: 23,
  MentionUser: 24, MentionChannel: 25, Link: 26, Image: 27, InlineKatex: 28,
  Timestamp: 29, Color: 30, Spoiler: 31, Plain: 32,
};

class FlatTree {
  constructor(buffer, input) {
    this.buf = buffer;
    this.view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    this.input = input;
    this.eventCount = this.view.getUint32(0, true);
    this.strTableOff = this.view.getUint32(4, true);
  }

  _str(off, len) {
    const start = this.strTableOff + off;
    return Buffer.from(this.buf.buffer, this.buf.byteOffset + start, len).toString('utf8');
  }

  readEvents() {
    const events = [];
    let pos = 8;
    const end = this.strTableOff;
    while (pos < end) {
      const tag = this.view.getUint8(pos);
      switch (tag) {
        case 1:
          events.push({ t: 1, sk: this.view.getUint8(pos + 1) });
          pos += 2;
          break;
        case 2:
          events.push({ t: 2, sk: this.view.getUint8(pos + 1) });
          pos += 2;
          break;
        case 3:
          events.push({
            t: 3,
            s: this.view.getUint32(pos + 1, true),
            e: this.view.getUint32(pos + 5, true),
          });
          pos += 9;
          break;
        case 4:
          events.push({
            t: 4,
            sk: this.view.getUint8(pos + 1),
            s: this.view.getUint32(pos + 2, true),
            e: this.view.getUint32(pos + 6, true),
          });
          pos += 10;
          break;
        case 5: {
          const off1 = this.view.getUint32(pos + 1, true);
          const len1 = this.view.getUint16(pos + 5, true);
          const off2 = this.view.getUint32(pos + 7, true);
          const len2 = this.view.getUint16(pos + 11, true);
          events.push({ t: 5, v: this._str(off1, len1), sc: this._str(off2, len2) });
          pos += 13;
          break;
        }
        case 6:
          events.push({
            t: 6,
            u: this._str(this.view.getUint32(pos + 1, true), this.view.getUint16(pos + 5, true)),
          });
          pos += 7;
          break;
        case 7:
          events.push({ t: 7 });
          pos += 1;
          break;
        case 8:
          events.push({ t: 8 });
          pos += 1;
          break;
        case 9:
          events.push({
            t: 9,
            d: this._str(this.view.getUint32(pos + 1, true), this.view.getUint16(pos + 5, true)),
          });
          pos += 7;
          break;
        case 10:
          events.push({ t: 10, v: this.view.getUint8(pos + 1) });
          pos += 2;
          break;
        default:
          throw new Error(`Unknown event tag ${tag} at ${pos}`);
      }
    }
    return events;
  }

  toJSON() {
    const events = this.readEvents();
    const ctx = { events, pos: 0, input: this.input };
    return buildBlocks(ctx);
  }
}

function plain(text) {
  return { type: 'PLAIN_TEXT', value: text };
}

function reducePlain(items) {
  const out = [];
  for (const item of items) {
    if (item.type === 'PLAIN_TEXT' && out.length > 0 && out[out.length - 1].type === 'PLAIN_TEXT') {
      out[out.length - 1].value += item.value;
    } else {
      out.push(item);
    }
  }
  return out;
}

function buildBlocks(ctx) {
  const nodes = [];
  while (ctx.pos < ctx.events.length) {
    const ev = ctx.events[ctx.pos];
    if (ev.t === 1) {
      ctx.pos++;
      const { inlines } = collectInlines(ctx, ev.sk);
      let node;
      switch (ev.sk) {
        case SK.Paragraph:
          node = { type: 'PARAGRAPH', value: reducePlain(inlines) };
          break;
        case SK.BigEmoji:
          node = { type: 'BIG_EMOJI', value: inlines };
          break;
        case SK.Heading:
          node = { type: 'HEADING', value: reducePlain(inlines), level: 1 };
          break;
        case SK.Code:
          node = { type: 'CODE', value: [], language: undefined };
          break;
        case SK.OrderedList:
          node = { type: 'ORDERED_LIST', value: [] };
          break;
        case SK.UnorderedList:
          node = { type: 'UNORDERED_LIST', value: [] };
          break;
        case SK.Tasks:
          node = { type: 'TASKS', value: [] };
          break;
        case SK.Quote:
          node = { type: 'QUOTE', value: [{ type: 'PARAGRAPH', value: inlines }] };
          break;
        case SK.SpoilerBlock:
          node = { type: 'SPOILER_BLOCK', value: [{ type: 'PARAGRAPH', value: inlines }] };
          break;
        default:
          node = { type: 'PARAGRAPH', value: inlines };
      }
      nodes.push(node);
    } else if (ev.t === 7) {
      nodes.push({ type: 'LINE_BREAK', value: null });
      ctx.pos++;
    } else if (ev.t === 8) {
      nodes.push({ type: 'HORIZONTAL_RULE', value: null });
      ctx.pos++;
    } else if (ev.t === 3) {
      nodes.push({ type: 'PARAGRAPH', value: [plain(ctx.input.slice(ev.s, ev.e))] });
      ctx.pos++;
    } else if (ev.t === 5 || ev.t === 6) {
      const emojiValues = [];
      while (ctx.pos < ctx.events.length) {
        const e = ctx.events[ctx.pos];
        if (e.t === 5) {
          emojiValues.push({ type: 'EMOJI', value: plain(e.v), shortCode: e.sc });
          ctx.pos++;
        } else if (e.t === 6) {
          emojiValues.push({ type: 'EMOJI', value: null, unicode: e.u });
          ctx.pos++;
        } else if (e.t === 3) {
          const text = ctx.input.slice(e.s, e.e);
          if (text.trim() === '') { ctx.pos++; } else { break; }
        } else {
          break;
        }
      }
      nodes.push({ type: 'BIG_EMOJI', value: emojiValues });
    } else {
      ctx.pos++;
    }
  }
  if (nodes.length === 0) {
    return [{ type: 'PARAGRAPH', value: [plain('')] }];
  }
  return nodes;
}

function collectInlines(ctx, parent) {
  const inlines = [];
  let dataStr = null;
  while (ctx.pos < ctx.events.length) {
    const ev = ctx.events[ctx.pos];

    if (ev.t === 2 && ev.sk === parent) {
      ctx.pos++;
      return { inlines, dataStr };
    }

    if (ev.t === 1) {
      ctx.pos++;
      const { inlines: children, dataStr: childData } = collectInlines(ctx, ev.sk);
      const reduced = reducePlain(children);
      switch (ev.sk) {
        case SK.Bold:
          inlines.push({ type: 'BOLD', value: reduced });
          break;
        case SK.Italic:
          inlines.push({ type: 'ITALIC', value: reduced });
          break;
        case SK.Strike:
          inlines.push({ type: 'STRIKE', value: reduced });
          break;
        case SK.Spoiler:
          inlines.push({ type: 'SPOILER', value: reduced });
          break;
        case SK.Link: {
          const href = childData || '';
          const label = reduced.length > 0 ? reduced : (href ? [plain(href)] : []);
          inlines.push({ type: 'LINK', value: { src: plain(href), label } });
          break;
        }
        case SK.Image:
          inlines.push({ type: 'IMAGE', value: { src: plain(''), label: plain('') } });
          break;
        case SK.Paragraph:
        case SK.BigEmoji:
          inlines.push(...children);
          break;
        default:
          inlines.push(...children);
      }
      continue;
    }

    if (ev.t === 9) {
      dataStr = ev.d;
      ctx.pos++;
      continue;
    }

    if (ev.t === 3) {
      inlines.push(plain(ctx.input.slice(ev.s, ev.e)));
      ctx.pos++;
      continue;
    }

    if (ev.t === 4) {
      const text = ctx.input.slice(ev.s, ev.e);
      switch (ev.sk) {
        case SK.InlineCode:
          inlines.push({ type: 'INLINE_CODE', value: plain(text) });
          break;
        case SK.MentionUser:
          inlines.push({ type: 'MENTION_USER', value: plain(text) });
          break;
        case SK.MentionChannel:
          inlines.push({ type: 'MENTION_CHANNEL', value: plain(text) });
          break;
        case SK.InlineKatex:
          inlines.push({ type: 'INLINE_KATEX', value: text });
          break;
        default:
          inlines.push(plain(text));
      }
      ctx.pos++;
      continue;
    }

    if (ev.t === 5) {
      inlines.push({ type: 'EMOJI', value: plain(ev.v), shortCode: ev.sc });
      ctx.pos++;
      continue;
    }

    if (ev.t === 6) {
      inlines.push({ type: 'EMOJI', value: null, unicode: ev.u });
      ctx.pos++;
      continue;
    }

    if (ev.t === 2) {
      ctx.pos++;
      return { inlines, dataStr };
    }

    ctx.pos++;
  }
  return { inlines, dataStr };
}

module.exports = { FlatTree, SK, SK_NAMES };
