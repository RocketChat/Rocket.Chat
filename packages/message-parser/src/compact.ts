/**
 * Bidirectional converter between the verbose (current) and compact (span-based)
 * message-parser AST formats.
 *
 *   compactify(oldMd, msg) → compact AST with spans referencing msg
 *   expand(compactMd, msg) → verbose AST with self-contained strings
 *   validateRoundtrip(oldMd, msg) → test both directions
 */

import type {
	BigEmoji,
	Blockquote,
	Bold,
	ChannelMention,
	Code,
	CodeLine,
	Color,
	Emoji,
	Heading,
	Image,
	InlineCode,
	InlineKaTeX,
	Inlines,
	Italic,
	KaTeX,
	LineBreak,
	Link,
	ListItem,
	Markup,
	OrderedList,
	Paragraph,
	Plain,
	Quote,
	Root,
	Spoiler,
	SpoilerBlock,
	Strike,
	Task,
	Tasks,
	Timestamp,
	UnorderedList,
	UserMention,
} from './definitions';

// ═══════════════════════════════════════════════════════════════════════════════
// Compact Format Types
// ═══════════════════════════════════════════════════════════════════════════════

export type Span = [start: number, end: number];

export type CInline = Span | CInlineNode;

export type CInlineNode =
	| { t: 'b'; c: CInline[] }
	| { t: 'i'; c: CInline[] }
	| { t: 's'; c: CInline[] }
	| { t: '||'; c: CInline[] }
	| { t: '`'; r: Span }
	| { t: '@'; r: Span }
	| { t: '#'; r: Span }
	| { t: '$'; r: Span }
	| { t: 'a'; r: Span; s?: string }
	| { t: 'a'; c: CInline[]; s: string }
	| { t: 'img'; r: Span; s: string }
	| { t: ':'; r: Span; u?: true; s?: string }
	| { t: 'ts'; r: Span; f: string }
	| { t: 'c'; v: [number, number, number, number] };

export type CBlock =
	| { t: 'p'; c: CInline[] }
	| { t: 'h'; l: 1 | 2 | 3 | 4; r: Span }
	| { t: '```'; l?: string; r: Span }
	| { t: '>'; c: CBlock[] }
	| { t: 'q'; c: CBlock[] }
	| { t: '|||'; c: CBlock[] }
	| { t: 'ol'; c: CLI[] }
	| { t: 'ul'; c: CLI[] }
	| { t: 'tl'; c: CTK[] }
	| { t: '$$'; r: Span }
	| { t: 'br' };

export type CLI = { t: 'li'; n?: number; c: CInline[] };
export type CTK = { t: 'tk'; s: boolean; c: CInline[] };
export type CBigEmoji = { t: 'E'; c: CInlineNode[] };
export type CRoot = CBlock[] | [CBigEmoji];

// ═══════════════════════════════════════════════════════════════════════════════
// expand(compactMd, msg) → verbose Root
// ═══════════════════════════════════════════════════════════════════════════════

function isSpan(v: CInline): v is Span {
	return Array.isArray(v) && v.length === 2 && typeof v[0] === 'number' && typeof v[1] === 'number';
}

function makePlain(msg: string, r: Span): Plain {
	return { type: 'PLAIN_TEXT', value: msg.slice(r[0], r[1]) };
}

function expandInline(msg: string, node: CInline): Inlines {
	if (isSpan(node)) {
		return makePlain(msg, node);
	}

	switch (node.t) {
		case 'b':
			return { type: 'BOLD', value: node.c.map((c) => expandInline(msg, c)) } as Bold;
		case 'i':
			return { type: 'ITALIC', value: node.c.map((c) => expandInline(msg, c)) } as Italic;
		case 's':
			return { type: 'STRIKE', value: node.c.map((c) => expandInline(msg, c)) } as Strike;
		case '||':
			return { type: 'SPOILER', value: node.c.map((c) => expandInline(msg, c)) } as Spoiler;
		case '`':
			return { type: 'INLINE_CODE', value: makePlain(msg, node.r) } as InlineCode;
		case '@':
			return { type: 'MENTION_USER', value: makePlain(msg, node.r) } as UserMention;
		case '#':
			return { type: 'MENTION_CHANNEL', value: makePlain(msg, node.r) } as ChannelMention;
		case '$':
			return { type: 'INLINE_KATEX', value: msg.slice(node.r[0], node.r[1]) } as InlineKaTeX;
		case 'a': {
			if ('c' in node && Array.isArray((node as any).c)) {
				const rich = node as { t: 'a'; c: CInline[]; s: string };
				return {
					type: 'LINK',
					value: {
						src: { type: 'PLAIN_TEXT', value: rich.s } as Plain,
						label: rich.c.map((c) => expandInline(msg, c)) as Markup[],
					},
				} as Link;
			}
			const span = node as { t: 'a'; r: Span; s?: string };
			const text = msg.slice(span.r[0], span.r[1]);
			const href = span.s ?? text;
			return {
				type: 'LINK',
				value: {
					src: { type: 'PLAIN_TEXT', value: href } as Plain,
					label: [{ type: 'PLAIN_TEXT', value: text } as Plain],
				},
			} as Link;
		}
		case 'img':
			return {
				type: 'IMAGE',
				value: {
					src: { type: 'PLAIN_TEXT', value: node.s } as Plain,
					label: makePlain(msg, node.r),
				},
			} as Image;
		case ':': {
			if (node.u) {
				return { type: 'EMOJI', value: undefined, unicode: msg.slice(node.r[0], node.r[1]) } as Emoji;
			}
			const raw = msg.slice(node.r[0], node.r[1]);
			const sc = node.s ?? raw;
			if (node.s && node.s !== raw) {
				return { type: 'EMOJI', value: { type: 'PLAIN_TEXT', value: raw } as Plain, shortCode: sc } as Emoji;
			}
			return { type: 'EMOJI', value: { type: 'PLAIN_TEXT', value: sc } as Plain, shortCode: sc } as Emoji;
		}
		case 'ts': {
			const v = msg.slice(node.r[0], node.r[1]);
			return {
				type: 'TIMESTAMP',
				value: { timestamp: v, format: node.f as Timestamp['value']['format'] },
				fallback: { type: 'PLAIN_TEXT', value: `<t:${v}:${node.f}>` } as Plain,
			} as Timestamp;
		}
		case 'c':
			return { type: 'COLOR', value: { r: node.v[0], g: node.v[1], b: node.v[2], a: node.v[3] } } as Color;
		default:
			throw new Error(`Unknown compact inline type: ${(node as any).t}`);
	}
}

function expandBlock(
	msg: string,
	block: CBlock,
): Paragraph | Heading | Code | Blockquote | Quote | SpoilerBlock | OrderedList | UnorderedList | Tasks | KaTeX | LineBreak {
	switch (block.t) {
		case 'p':
			return { type: 'PARAGRAPH', value: block.c.map((c) => expandInline(msg, c)) } as Paragraph;
		case 'h':
			return { type: 'HEADING', level: block.l, value: [makePlain(msg, block.r)] } as Heading;
		case '```': {
			const content = msg.slice(block.r[0], block.r[1]);
			const lines: CodeLine[] = content.split('\n').map((line) => ({
				type: 'CODE_LINE' as const,
				value: { type: 'PLAIN_TEXT' as const, value: line },
			}));
			return { type: 'CODE', language: block.l || 'none', value: lines } as Code;
		}
		case '>':
			return { type: 'BLOCKQUOTE', value: block.c.map((c) => expandBlock(msg, c)) } as Blockquote;
		case 'q':
			return { type: 'QUOTE', value: block.c.map((c) => expandBlock(msg, c)) } as Quote;
		case '|||':
			return { type: 'SPOILER_BLOCK', value: block.c.map((c) => expandBlock(msg, c)) } as SpoilerBlock;
		case 'ol':
			return {
				type: 'ORDERED_LIST',
				value: block.c.map(
					(li): ListItem => ({
						type: 'LIST_ITEM',
						value: li.c.map((c) => expandInline(msg, c)),
						...(li.n != null && { number: li.n }),
					}),
				),
			} as OrderedList;
		case 'ul':
			return {
				type: 'UNORDERED_LIST',
				value: block.c.map(
					(li): ListItem => ({
						type: 'LIST_ITEM',
						value: li.c.map((c) => expandInline(msg, c)),
					}),
				),
			} as UnorderedList;
		case 'tl':
			return {
				type: 'TASKS',
				value: block.c.map(
					(tk): Task => ({
						type: 'TASK',
						status: tk.s,
						value: tk.c.map((c) => expandInline(msg, c)),
					}),
				),
			} as Tasks;
		case '$$':
			return { type: 'KATEX', value: msg.slice(block.r[0], block.r[1]) } as KaTeX;
		case 'br':
			return { type: 'LINE_BREAK', value: undefined } as LineBreak;
		default:
			throw new Error(`Unknown compact block type: ${(block as any).t}`);
	}
}

export function expand(root: CRoot, msg: string): Root {
	if (root.length === 1 && 't' in root[0] && root[0].t === 'E') {
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- narrow CRoot[0] to CBigEmoji
		const bigE = root[0] as CBigEmoji;
		return [{ type: 'BIG_EMOJI', value: bigE.c.map((c) => expandInline(msg, c)) } as BigEmoji];
	}
	return (root as CBlock[]).map((b) => expandBlock(msg, b)) as Root;
}

// ═══════════════════════════════════════════════════════════════════════════════
// compactify(oldMd, msg) → compact CRoot
// ═══════════════════════════════════════════════════════════════════════════════

// eslint-disable-next-line @typescript-eslint/naming-convention -- Ctx is a local context type, not a public API
interface Ctx {
	msg: string;
	pos: number;
}

function peek(ctx: Ctx, len = 1): string {
	return ctx.msg.slice(ctx.pos, ctx.pos + len);
}

function advance(ctx: Ctx, n: number) {
	ctx.pos += n;
}

function advancePast(ctx: Ctx, str: string) {
	const i = ctx.msg.indexOf(str, ctx.pos);
	if (i >= 0) ctx.pos = i + str.length;
}

function skipNewlines(ctx: Ctx) {
	while (ctx.pos < ctx.msg.length && ctx.msg[ctx.pos] === '\n') ctx.pos++;
}

function skipWhitespace(ctx: Ctx) {
	while (ctx.pos < ctx.msg.length && /\s/.test(ctx.msg[ctx.pos])) ctx.pos++;
}

function spanFor(ctx: Ctx, text: string): Span {
	const i = ctx.msg.indexOf(text, ctx.pos);
	if (i === -1) {
		throw new Error(`Cannot find "${text.slice(0, 40)}" at pos ${ctx.pos} in msg`);
	}
	ctx.pos = i + text.length;
	return [i, i + text.length];
}

function textOf(node: Plain | Markup | Inlines): string {
	if ((node as Plain).type === 'PLAIN_TEXT') return (node as Plain).value;
	const { value } = node as { value?: Plain };
	if (value?.type === 'PLAIN_TEXT') return value.value;
	return '';
}

function flatLabel(label: Markup | Markup[]): Array<Markup> {
	return Array.isArray(label) ? label : [label];
}

// ── Inline ───────────────────────────────────────────────────────────────────

function compactInline(ctx: Ctx, node: Inlines): CInline {
	switch (node.type) {
		case 'PLAIN_TEXT':
			return spanFor(ctx, node.value);

		case 'BOLD': {
			const d = peek(ctx, 2) === '**' ? '**' : '__';
			advance(ctx, d.length);
			const c = node.value.map((ch) => compactInline(ctx, ch as Inlines));
			advance(ctx, d.length);
			return { t: 'b', c };
		}
		case 'ITALIC': {
			const d = peek(ctx) === '*' ? '*' : '_';
			advance(ctx, d.length);
			const c = node.value.map((ch) => compactInline(ctx, ch as Inlines));
			advance(ctx, d.length);
			return { t: 'i', c };
		}
		case 'STRIKE': {
			advance(ctx, 2);
			const c = node.value.map((ch) => compactInline(ctx, ch as Inlines));
			advance(ctx, 2);
			return { t: 's', c };
		}
		case 'SPOILER': {
			advance(ctx, 2);
			const c = node.value.map((ch) => compactInline(ctx, ch as Inlines));
			advance(ctx, 2);
			return { t: '||', c };
		}

		case 'INLINE_CODE': {
			advance(ctx, 1);
			const r = spanFor(ctx, node.value.value);
			advance(ctx, 1);
			return { t: '`', r };
		}

		case 'MENTION_USER': {
			advance(ctx, 1);
			const r = spanFor(ctx, node.value.value);
			return { t: '@', r };
		}
		case 'MENTION_CHANNEL': {
			advance(ctx, 1);
			const r = spanFor(ctx, node.value.value);
			return { t: '#', r };
		}

		case 'EMOJI': {
			if ('unicode' in node && node.unicode) {
				const r = spanFor(ctx, node.unicode);
				return { t: ':', r, u: true };
			}
			const emoji = node as Emoji & { value: Plain; shortCode: string };
			const raw = emoji.value.value;
			const isEmoticon = emoji.shortCode !== raw;

			if (isEmoticon) {
				const r = spanFor(ctx, raw);
				return { t: ':', r, s: emoji.shortCode };
			}

			advance(ctx, 1); // opening :
			const r = spanFor(ctx, emoji.shortCode);
			advance(ctx, 1); // closing :
			return { t: ':', r };
		}

		case 'LINK': {
			const src = node.value.src.value;
			const labels = flatLabel(node.value.label);
			const labelTexts = labels.map(textOf);
			const labelJoined = labelTexts.join('');

			if (peek(ctx) === '[') {
				advance(ctx, 1); // [

				const isSimpleLabel = labels.length === 1 && labels[0].type === 'PLAIN_TEXT';

				if (isSimpleLabel) {
					const r = spanFor(ctx, labelJoined);
					advance(ctx, 2); // ](
					advancePast(ctx, ')');
					return src === labelJoined ? { t: 'a', r } : { t: 'a', r, s: src };
				}

				const c = labels.map((l) => compactInline(ctx, l as Inlines));
				advance(ctx, 2); // ](
				advancePast(ctx, ')');
				return { t: 'a', c, s: src };
			}

			const r = spanFor(ctx, labelJoined);
			return src === labelJoined ? { t: 'a', r } : { t: 'a', r, s: src };
		}

		case 'IMAGE': {
			advance(ctx, 2); // ![
			const altText = textOf(node.value.label);
			const r = spanFor(ctx, altText);
			advance(ctx, 2); // ](
			advancePast(ctx, ')');
			return { t: 'img', r, s: node.value.src.value };
		}

		case 'INLINE_KATEX': {
			advance(ctx, 1); // $
			const r = spanFor(ctx, node.value);
			advance(ctx, 1); // $
			return { t: '$', r };
		}

		case 'TIMESTAMP': {
			advance(ctx, 3); // <t:
			const r = spanFor(ctx, node.value.timestamp);
			advance(ctx, 1); // :
			advance(ctx, node.value.format.length);
			advance(ctx, 1); // >
			return { t: 'ts', r, f: node.value.format };
		}

		case 'COLOR':
			return { t: 'c', v: [node.value.r, node.value.g, node.value.b, node.value.a] };

		default:
			throw new Error(`Unknown inline type: ${(node as any).type}`);
	}
}

// ── Block ────────────────────────────────────────────────────────────────────

function compactBlock(ctx: Ctx, node: Paragraph | Root[number]): CBlock {
	const n = node as any;
	switch (n.type) {
		case 'PARAGRAPH': {
			const para = node as Paragraph;
			const c = para.value.map((ch) => compactInline(ctx, ch));
			return { t: 'p', c };
		}

		case 'HEADING': {
			const heading = node as Heading;
			advance(ctx, heading.level); // #, ##, ###, ####
			advance(ctx, 1); // space
			const text = heading.value.map(textOf).join('');
			const r = spanFor(ctx, text);
			return { t: 'h', l: heading.level, r };
		}

		case 'CODE': {
			const code = node as Code;
			advance(ctx, 3); // ```
			const lang = code.language && code.language !== 'none' ? code.language : undefined;
			if (lang) advance(ctx, lang.length);
			advance(ctx, 1); // \n after lang line

			const lines = code.value.map((cl: CodeLine) => cl.value.value);
			const content = lines.join('\n');
			const r = spanFor(ctx, content);

			advance(ctx, 1); // \n before closing ```
			advance(ctx, 3); // ```
			return lang ? { t: '```', l: lang, r } : { t: '```', r };
		}

		case 'BLOCKQUOTE': {
			const bq = node as unknown as Blockquote;
			const c: CBlock[] = bq.value.map((para, i) => {
				if (i > 0) skipNewlines(ctx);
				advancePast(ctx, '> ');
				return compactBlock(ctx, para);
			});
			return { t: '>', c };
		}

		case 'QUOTE': {
			const q = node as Quote;
			const c: CBlock[] = q.value.map((para, i) => {
				if (i > 0) skipNewlines(ctx);
				advancePast(ctx, '> ');
				return compactBlock(ctx, para);
			});
			return { t: 'q', c };
		}

		case 'SPOILER_BLOCK': {
			const sb = node as SpoilerBlock;
			advance(ctx, 2); // ||
			const c: CBlock[] = sb.value.map((para) => compactBlock(ctx, para));
			advance(ctx, 2); // ||
			return { t: '|||', c };
		}

		case 'ORDERED_LIST': {
			const ol = node as OrderedList;
			const c: CLI[] = ol.value.map((item, i) => {
				if (i > 0) advance(ctx, 1); // \n
				const num = item.number ?? i + 1;
				advancePast(ctx, `${num}. `);
				const children = item.value.map((ch) => compactInline(ctx, ch));
				return { t: 'li' as const, n: num, c: children };
			});
			return { t: 'ol', c };
		}

		case 'UNORDERED_LIST': {
			const ul = node as UnorderedList;
			const c: CLI[] = ul.value.map((item, i) => {
				if (i > 0) advance(ctx, 1); // \n
				advancePast(ctx, '- ');
				const children = item.value.map((ch) => compactInline(ctx, ch));
				return { t: 'li' as const, c: children };
			});
			return { t: 'ul', c };
		}

		case 'TASKS': {
			const tasks = node as Tasks;
			const c: CTK[] = tasks.value.map((task, i) => {
				if (i > 0) advance(ctx, 1); // \n
				advancePast(ctx, task.status ? '- [x] ' : '- [ ] ');
				const children = task.value.map((ch) => compactInline(ctx, ch));
				return { t: 'tk' as const, s: task.status, c: children };
			});
			return { t: 'tl', c };
		}

		case 'KATEX': {
			const katex = node as KaTeX;
			advance(ctx, 2); // $$
			const r = spanFor(ctx, katex.value);
			advance(ctx, 2); // $$
			return { t: '$$', r };
		}

		case 'LINE_BREAK':
			advance(ctx, 1); // \n
			return { t: 'br' };

		default:
			throw new Error(`Unknown block type: ${n.type}`);
	}
}

export function compactify(root: Root, msg: string): CRoot {
	const ctx: Ctx = { msg, pos: 0 };

	if (root.length === 1 && root[0].type === 'BIG_EMOJI') {
		skipWhitespace(ctx);
		const emojis = root[0].value.map((e) => {
			skipWhitespace(ctx);
			return compactInline(ctx, e) as CInlineNode;
		});
		return [{ t: 'E', c: emojis }];
	}

	const blocks: CBlock[] = [];
	for (let i = 0; i < root.length; i++) {
		if (i > 0 && root[i].type !== 'LINE_BREAK') {
			skipNewlines(ctx);
		}
		blocks.push(compactBlock(ctx, root[i]));
	}
	return blocks;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Validation
// ═══════════════════════════════════════════════════════════════════════════════

function deepEqual(a: unknown, b: unknown): boolean {
	if (a === b) return true;
	if (a == null || b == null) return a === b;
	if (typeof a !== typeof b) return false;
	if (typeof a !== 'object') return false;

	if (Array.isArray(a) !== Array.isArray(b)) return false;
	if (Array.isArray(a)) {
		if (a.length !== (b as unknown[]).length) return false;
		return a.every((v, i) => deepEqual(v, (b as unknown[])[i]));
	}

	const objA = a as Record<string, unknown>;
	const objB = b as Record<string, unknown>;
	const keysA = Object.keys(objA).sort();
	const keysB = Object.keys(objB).sort();
	if (!deepEqual(keysA, keysB)) return false;
	return keysA.every((k) => deepEqual(objA[k], objB[k]));
}

export function validateRoundtrip(
	oldMd: Root,
	msg: string,
): {
	ok: boolean;
	compact: CRoot;
	expanded: Root;
	sizeOld: number;
	sizeNew: number;
	reduction: string;
} {
	const compact = compactify(oldMd, msg);
	const expanded = expand(compact, msg);
	const ok = deepEqual(oldMd, expanded);

	const sizeOld = JSON.stringify(oldMd).length;
	const sizeNew = JSON.stringify(compact).length;
	const reduction = `${((1 - sizeNew / sizeOld) * 100).toFixed(1)}%`;

	return { ok, compact, expanded, sizeOld, sizeNew, reduction };
}
