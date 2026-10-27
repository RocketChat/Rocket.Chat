import type {
	BigEmoji,
	Blocks,
	Emoji,
	Inlines,
	ListItem,
	Markup,
	NestedList,
	Paragraph,
	Plain,
	Root,
	SourceRange,
	TableCell,
	TableCellAlignment,
	TableRow,
	Task,
} from './definitions';

export type CompactSpan = SourceRange;
export type CompactText = CompactSpan | string;

export type CompactBold = {
	t: 'b';
	c: CompactInline[];
};

export type CompactItalic = {
	t: 'i';
	c: CompactInline[];
};

export type CompactStrike = {
	t: 's';
	c: CompactInline[];
};

export type CompactSpoiler = {
	t: '||';
	c: CompactInline[];
};

export type CompactInlineCode = {
	t: '`';
	c: CompactText;
};

export type CompactMentionUser = {
	t: '@';
	c: CompactText;
};

export type CompactMentionChannel = {
	t: '#';
	c: CompactText;
};

export type CompactInlineKaTeX = {
	t: '$';
	c: CompactText;
};

export type CompactMarkup =
	| CompactSpan
	| string
	| CompactBold
	| CompactItalic
	| CompactStrike
	| CompactMentionChannel;

export type CompactLink = {
	t: 'a';
	src: CompactText;
	label: CompactMarkup | CompactMarkup[];
};

export type CompactImage = {
	t: 'img';
	src: CompactText;
	label: CompactMarkup;
};

export type CompactEmoji =
	| {
			t: ':';
			sc: string;
			c?: CompactText;
	  }
	| {
			t: ':';
			u: string;
	  };

export type CompactTimestamp = {
	t: 'ts';
	ts: string;
	f: 't' | 'T' | 'd' | 'D' | 'f' | 'F' | 'R';
	fb?: CompactSpan | string;
};

export type CompactColor = {
	t: 'c';
	v: [number, number, number, number];
};

export type CompactInline =
	| CompactSpan
	| string
	| CompactBold
	| CompactItalic
	| CompactStrike
	| CompactSpoiler
	| CompactInlineCode
	| CompactMentionUser
	| CompactMentionChannel
	| CompactInlineKaTeX
	| CompactLink
	| CompactImage
	| CompactEmoji
	| CompactTimestamp
	| CompactColor;

export type CompactParagraph = {
	t: 'p';
	c: CompactInline[];
};

export type CompactHeading = {
	t: 'h';
	l: 1 | 2 | 3 | 4;
	c: CompactInline[];
};

export type CompactCodeLine = {
	t: 'cl';
	c: CompactText;
};

export type CompactCode = {
	t: '```';
	lang?: string;
	c: CompactCodeLine[];
};

export type CompactQuote = {
	t: 'q' | '>';
	c: CompactParagraph[];
};

export type CompactSpoilerBlock = {
	t: '|||';
	c: CompactParagraph[];
};

export type CompactListItem = {
	t: 'li';
	c: CompactInline[];
	n?: number;
	nested?: CompactNestedList[];
};

export type CompactOrderedList = {
	t: 'ol';
	c: CompactListItem[];
};

export type CompactUnorderedList = {
	t: 'ul';
	c: CompactListItem[];
};

export type CompactTask = {
	t: 'task';
	s: boolean;
	c: CompactInline[];
	nested?: CompactNestedList[];
};

export type CompactTasks = {
	t: 'tl';
	c: CompactTask[];
};

export type CompactNestedList = CompactOrderedList | CompactUnorderedList | CompactTasks;

export type CompactTableCell = {
	t: 'td';
	a?: TableCellAlignment;
	c: CompactInline[];
};

export type CompactTableRow = {
	t: 'tr';
	c: CompactTableCell[];
};

export type CompactTable = {
	t: 'table';
	h: CompactTableCell[];
	r: CompactTableRow[];
	fb?: CompactSpan | string;
};

export type CompactHorizontalRule = {
	t: 'hr';
	fb?: CompactSpan | string;
};

export type CompactKaTeX = {
	t: '$$';
	c: CompactText;
};

export type CompactLineBreak = {
	t: 'br';
};

export type CompactBigEmoji = {
	t: 'E';
	c: CompactEmoji[];
};

export type CompactBlock =
	| CompactHeading
	| CompactCode
	| CompactQuote
	| CompactSpoilerBlock
	| CompactOrderedList
	| CompactUnorderedList
	| CompactTasks
	| CompactTable
	| CompactHorizontalRule
	| CompactKaTeX
	| CompactLineBreak
	| CompactListItem;

export type CompactNode = CompactParagraph | CompactBlock | CompactInline | CompactBigEmoji;

export type CompactRoot = Array<CompactParagraph | CompactBlock> | [CompactBigEmoji];

export interface CompressionRatio {
	originalBytes: number;
	compactBytes: number;
	ratio: number;
	percentReduction: number;
}

interface CompactionState {
	cursor: number;
}

/** Checks if a value is a two-number tuple representing a source range span. */
function isSpan(value: unknown): value is SourceRange {
	return (
		Array.isArray(value) &&
		value.length === 2 &&
		typeof value[0] === 'number' &&
		typeof value[1] === 'number'
	);
}

/** Converts a text string into a [start, end] span tuple or returns string fallback. */
function compactText(str: string, msg: string, state: CompactionState): CompactText {
	if (str === '') {
		return [state.cursor, state.cursor];
	}

	const idx = msg.indexOf(str, state.cursor);
	if (idx !== -1) {
		const start = idx;
		const end = idx + str.length;
		state.cursor = end;
		return [start, end];
	}

	const fallbackIdx = msg.indexOf(str, 0);
	if (fallbackIdx !== -1) {
		const start = fallbackIdx;
		const end = fallbackIdx + str.length;
		state.cursor = Math.max(state.cursor, end);
		return [start, end];
	}

	return str;
}

/** Extracts a text string from a [start, end] span reference or string literal. */
function expandText(spanOrStr: CompactText, msg: string): string {
	if (isSpan(spanOrStr)) {
		return msg.slice(spanOrStr[0], spanOrStr[1]);
	}
	return String(spanOrStr);
}

/** Compacts a PLAIN_TEXT AST node into a span reference or string. */
function compactPlain(node: Plain, msg: string, state: CompactionState): CompactText {
	return compactText(node.value, msg, state);
}

/** Expands a span reference or string back into a PLAIN_TEXT AST node. */
function expandPlain(spanOrStr: CompactText, msg: string): Plain {
	return {
		type: 'PLAIN_TEXT',
		value: expandText(spanOrStr, msg),
	};
}

/** Compacts markup nodes (Bold, Italic, Strike, MentionChannel) into compact markup representations. */
function compactMarkup(node: Markup, msg: string, state: CompactionState): CompactMarkup {
	switch (node.type) {
		case 'PLAIN_TEXT':
			return compactPlain(node, msg, state);
		case 'BOLD':
			return {
				t: 'b',
				c: compactInlines(node.value as Inlines[], msg, state),
			};
		case 'ITALIC':
			return {
				t: 'i',
				c: compactInlines(node.value as Inlines[], msg, state),
			};
		case 'STRIKE':
			return {
				t: 's',
				c: compactInlines(node.value as Inlines[], msg, state),
			};
		case 'MENTION_CHANNEL':
			return {
				t: '#',
				c: compactPlain(node.value, msg, state),
			};
	}
}

/** Expands compact markup representations back into verbose Markup AST nodes. */
function expandMarkup(node: CompactMarkup, msg: string): Markup {
	if (isSpan(node) || typeof node === 'string') {
		return expandPlain(node, msg);
	}

	switch (node.t) {
		case 'b':
			return {
				type: 'BOLD',
				value: node.c.map((child) => expandInline(child, msg)) as any,
			};
		case 'i':
			return {
				type: 'ITALIC',
				value: node.c.map((child) => expandInline(child, msg)) as any,
			};
		case 's':
			return {
				type: 'STRIKE',
				value: node.c.map((child) => expandInline(child, msg)) as any,
			};
		case '#':
			return {
				type: 'MENTION_CHANNEL',
				value: expandPlain(node.c, msg),
			};
	}
}

/** Converts an inline AST node into its compact representation. */
function compactInline(node: Inlines, msg: string, state: CompactionState): CompactInline {
	switch (node.type) {
		case 'PLAIN_TEXT':
			return compactPlain(node, msg, state);
		case 'BOLD':
			return {
				t: 'b',
				c: compactInlines(node.value as Inlines[], msg, state),
			};
		case 'ITALIC':
			return {
				t: 'i',
				c: compactInlines(node.value as Inlines[], msg, state),
			};
		case 'STRIKE':
			return {
				t: 's',
				c: compactInlines(node.value as Inlines[], msg, state),
			};
		case 'SPOILER':
			return {
				t: '||',
				c: compactInlines(node.value as Inlines[], msg, state),
			};
		case 'INLINE_CODE':
			return {
				t: '`',
				c: compactPlain(node.value, msg, state),
			};
		case 'MENTION_USER':
			return {
				t: '@',
				c: compactPlain(node.value, msg, state),
			};
		case 'MENTION_CHANNEL':
			return {
				t: '#',
				c: compactPlain(node.value, msg, state),
			};
		case 'INLINE_KATEX':
			return {
				t: '$',
				c: compactText(node.value, msg, state),
			};
		case 'LINK':
			return {
				t: 'a',
				src: compactPlain(node.value.src, msg, state),
				label: Array.isArray(node.value.label)
					? (node.value.label.map((l) => compactMarkup(l, msg, state)) as CompactMarkup[])
					: compactMarkup(node.value.label, msg, state),
			};
		case 'IMAGE':
			return {
				t: 'img',
				src: compactPlain(node.value.src, msg, state),
				label: compactMarkup(node.value.label, msg, state),
			};
		case 'EMOJI':
			return compactEmoji(node, msg, state);
		case 'TIMESTAMP':
			return {
				t: 'ts',
				ts: node.value.timestamp,
				f: node.value.format,
				...(node.fallback !== undefined && { fb: compactFallback(node.fallback) }),
			};
		case 'COLOR':
			return {
				t: 'c',
				v: [node.value.r, node.value.g, node.value.b, node.value.a],
			};
	}
}

/** Reconstructs a verbose inline AST node from its compact representation. */
function expandInline(node: CompactInline, msg: string): Inlines {
	if (isSpan(node) || typeof node === 'string') {
		return expandPlain(node, msg);
	}

	switch (node.t) {
		case 'b':
			return {
				type: 'BOLD',
				value: node.c.map((child) => expandInline(child, msg)) as any,
			};
		case 'i':
			return {
				type: 'ITALIC',
				value: node.c.map((child) => expandInline(child, msg)) as any,
			};
		case 's':
			return {
				type: 'STRIKE',
				value: node.c.map((child) => expandInline(child, msg)) as any,
			};
		case '||':
			return {
				type: 'SPOILER',
				value: node.c.map((child) => expandInline(child, msg)) as any,
			};
		case '`':
			return {
				type: 'INLINE_CODE',
				value: expandPlain(node.c, msg),
			};
		case '@':
			return {
				type: 'MENTION_USER',
				value: expandPlain(node.c, msg),
			};
		case '#':
			return {
				type: 'MENTION_CHANNEL',
				value: expandPlain(node.c, msg),
			};
		case '$':
			return {
				type: 'INLINE_KATEX',
				value: expandText(node.c, msg),
			};
		case 'a': {
			const label =
				isSpan(node.label) || typeof node.label === 'string' || 't' in (node.label as object)
					? expandMarkup(node.label as CompactMarkup, msg)
					: (node.label as CompactMarkup[]).map((l) => expandMarkup(l, msg));

			return {
				type: 'LINK',
				value: {
					src: expandPlain(node.src, msg),
					label,
				},
			};
		}
		case 'img':
			return {
				type: 'IMAGE',
				value: {
					src: expandPlain(node.src, msg),
					label: expandMarkup(node.label, msg),
				},
			};
		case ':':
			return expandEmoji(node, msg);
		case 'ts':
			return {
				type: 'TIMESTAMP',
				value: {
					timestamp: node.ts,
					format: node.f,
				},
				...(node.fb !== undefined && { fallback: expandFallback(node.fb, msg) }),
			};
		case 'c':
			return {
				type: 'COLOR',
				value: {
					r: node.v[0],
					g: node.v[1],
					b: node.v[2],
					a: node.v[3],
				},
			};
	}
}

/** Converts an array of inline AST nodes into compact inline nodes. */
function compactInlines(inlines: Inlines[], msg: string, state: CompactionState): CompactInline[] {
	return inlines.map((item) => compactInline(item, msg, state));
}

/** Reconstructs an array of inline AST nodes from compact inline representations. */
function expandInlines(compactInlines: CompactInline[], msg: string): Inlines[] {
	return compactInlines.map((item) => expandInline(item, msg));
}

/** Converts an Emoji node into its compact representation. */
function compactEmoji(node: Emoji, msg: string, state: CompactionState): CompactEmoji {
	if (node.value !== undefined) {
		return {
			t: ':',
			sc: node.shortCode,
			c: compactPlain(node.value, msg, state),
		};
	}
	return {
		t: ':',
		u: node.unicode,
	};
}

/** Reconstructs an Emoji node from its compact representation. */
function expandEmoji(node: CompactEmoji, msg: string): Emoji {
	if ('sc' in node) {
		return {
			type: 'EMOJI',
			shortCode: node.sc,
			value: node.c !== undefined ? expandPlain(node.c, msg) : { type: 'PLAIN_TEXT', value: node.sc },
		};
	}
	return {
		type: 'EMOJI',
		unicode: node.u,
		value: undefined,
	};
}

/** Converts a BigEmoji root node into a compact BigEmoji node. */
function compactBigEmoji(node: BigEmoji, msg: string, state: CompactionState): CompactBigEmoji {
	return {
		t: 'E',
		c: node.value.map((e) => compactEmoji(e, msg, state)),
	};
}

/** Reconstructs a BigEmoji node from its compact representation. */
function expandBigEmoji(node: CompactBigEmoji, msg: string): BigEmoji {
	return {
		type: 'BIG_EMOJI',
		value: node.c.map((e) => expandEmoji(e, msg)) as any,
	};
}

/** Converts a Paragraph node into its compact representation. */
function compactParagraph(node: Paragraph, msg: string, state: CompactionState): CompactParagraph {
	return {
		t: 'p',
		c: compactInlines(node.value, msg, state),
	};
}

/** Reconstructs a Paragraph node from its compact representation. */
function expandParagraph(node: CompactParagraph, msg: string): Paragraph {
	return {
		type: 'PARAGRAPH',
		value: expandInlines(node.c, msg) as any,
	};
}

/** Compacts an array of Paragraph nodes. */
function compactParagraphs(
	nodes: Paragraph[],
	msg: string,
	state: CompactionState
): CompactParagraph[] {
	return nodes.map((p) => compactParagraph(p, msg, state));
}

/** Expands an array of compact Paragraph nodes. */
function expandParagraphs(nodes: CompactParagraph[], msg: string): Paragraph[] {
	return nodes.map((p) => expandParagraph(p, msg));
}

/** Compacts a ListItem node into its compact representation. */
function compactListItem(node: ListItem, msg: string, state: CompactionState): CompactListItem {
	return {
		t: 'li',
		c: compactInlines(node.value, msg, state),
		...(node.number !== undefined && { n: node.number }),
		...(node.nested !== undefined && { nested: compactNestedLists(node.nested, msg, state) }),
	};
}

/** Reconstructs a ListItem node from its compact representation. */
function expandListItem(node: CompactListItem, msg: string): ListItem {
	return {
		type: 'LIST_ITEM',
		value: expandInlines(node.c, msg),
		...(node.n !== undefined && { number: node.n }),
		...(node.nested !== undefined && { nested: expandNestedLists(node.nested, msg) }),
	};
}

/** Compacts an array of ListItem nodes. */
function compactListItems(
	items: ListItem[],
	msg: string,
	state: CompactionState
): CompactListItem[] {
	return items.map((item) => compactListItem(item, msg, state));
}

/** Expands an array of compact ListItem nodes. */
function expandListItems(items: CompactListItem[], msg: string): ListItem[] {
	return items.map((item) => expandListItem(item, msg));
}

/** Compacts a Task node into its compact representation. */
function compactTask(node: Task, msg: string, state: CompactionState): CompactTask {
	return {
		t: 'task',
		s: node.status,
		c: compactInlines(node.value, msg, state),
		...(node.nested !== undefined && { nested: compactNestedLists(node.nested, msg, state) }),
	};
}

/** Reconstructs a Task node from its compact representation. */
function expandTask(node: CompactTask, msg: string): Task {
	return {
		type: 'TASK',
		status: node.s,
		value: expandInlines(node.c, msg),
		...(node.nested !== undefined && { nested: expandNestedLists(node.nested, msg) }),
	};
}

/** Compacts an array of Task nodes. */
function compactTasks(tasks: Task[], msg: string, state: CompactionState): CompactTask[] {
	return tasks.map((task) => compactTask(task, msg, state));
}

/** Expands an array of compact Task nodes. */
function expandTasks(tasks: CompactTask[], msg: string): Task[] {
	return tasks.map((task) => expandTask(task, msg));
}

/** Compacts an array of nested lists (ordered, unordered, tasks). */
function compactNestedLists(
	lists: NestedList[] | undefined,
	msg: string,
	state: CompactionState
): CompactNestedList[] | undefined {
	if (!lists) return undefined;
	return lists.map((list) => {
		switch (list.type) {
			case 'ORDERED_LIST':
				return {
					t: 'ol',
					c: compactListItems(list.value, msg, state),
				};
			case 'UNORDERED_LIST':
				return {
					t: 'ul',
					c: compactListItems(list.value, msg, state),
				};
			case 'TASKS':
				return {
					t: 'tl',
					c: compactTasks(list.value, msg, state),
				};
		}
	});
}

/** Reconstructs nested list nodes from compact nested list representations. */
function expandNestedLists(lists: CompactNestedList[], msg: string): NestedList[] {
	return lists.map((list) => {
		switch (list.t) {
			case 'ol':
				return {
					type: 'ORDERED_LIST',
					value: expandListItems(list.c, msg),
				};
			case 'ul':
				return {
					type: 'UNORDERED_LIST',
					value: expandListItems(list.c, msg),
				};
			case 'tl':
				return {
					type: 'TASKS',
					value: expandTasks(list.c, msg),
				};
		}
	});
}

/** Compacts a TableCell node into its compact representation. */
function compactTableCell(cell: TableCell, msg: string, state: CompactionState): CompactTableCell {
	return {
		t: 'td',
		...(cell.align !== undefined && { a: cell.align }),
		c: compactInlines(cell.value, msg, state),
	};
}

/** Reconstructs a TableCell node from its compact representation. */
function expandTableCell(cell: CompactTableCell, msg: string): TableCell {
	return {
		type: 'TABLE_CELL',
		align: cell.a,
		value: expandInlines(cell.c, msg),
	};
}

/** Compacts a TableRow node into its compact representation. */
function compactTableRow(row: TableRow, msg: string, state: CompactionState): CompactTableRow {
	return {
		t: 'tr',
		c: row.value.map((cell) => compactTableCell(cell, msg, state)),
	};
}

/** Reconstructs a TableRow node from its compact representation. */
function expandTableRow(row: CompactTableRow, msg: string): TableRow {
	return {
		type: 'TABLE_ROW',
		value: row.c.map((cell) => expandTableCell(cell, msg)),
	};
}

/** Preserves table, rule, or timestamp fallback values during compaction. */
function compactFallback(
	fb: SourceRange | Plain | undefined
): CompactSpan | string | undefined {
	if (!fb) return undefined;
	if (Array.isArray(fb)) {
		return fb;
	}
	return fb.value;
}

/** Reconstructs a fallback value (SourceRange or Plain) during expansion. */
function expandFallback(
	fb: CompactSpan | string | undefined,
	msg: string
): SourceRange | Plain | undefined {
	if (!fb) return undefined;
	if (Array.isArray(fb)) {
		return fb;
	}
	return {
		type: 'PLAIN_TEXT',
		value: expandText(fb, msg),
	};
}

/** Compacts a block or paragraph AST node into its compact representation. */
function compactBlockOrParagraph(
	node: Paragraph | Blocks,
	msg: string,
	state: CompactionState
): CompactParagraph | CompactBlock {
	switch (node.type) {
		case 'PARAGRAPH':
			return compactParagraph(node, msg, state);
		case 'HEADING':
			return {
				t: 'h',
				l: node.level,
				c: compactInlines(node.value, msg, state),
			};
		case 'CODE':
			return {
				t: '```',
				...(node.language !== undefined && { lang: node.language }),
				c: node.value.map((line) => ({
					t: 'cl',
					c: compactPlain(line.value, msg, state),
				})),
			};
		case 'QUOTE':
			return {
				t: 'q',
				c: compactParagraphs(node.value, msg, state),
			};
		case 'SPOILER_BLOCK':
			return {
				t: '|||',
				c: compactParagraphs(node.value, msg, state),
			};
		case 'ORDERED_LIST':
			return {
				t: 'ol',
				c: compactListItems(node.value, msg, state),
			};
		case 'UNORDERED_LIST':
			return {
				t: 'ul',
				c: compactListItems(node.value, msg, state),
			};
		case 'TASKS':
			return {
				t: 'tl',
				c: compactTasks(node.value, msg, state),
			};
		case 'TABLE':
			return {
				t: 'table',
				h: node.value.header.map((cell) => compactTableCell(cell, msg, state)),
				r: node.value.rows.map((row) => compactTableRow(row, msg, state)),
				...(node.fallback !== undefined && { fb: compactFallback(node.fallback) }),
			};
		case 'HORIZONTAL_RULE':
			return {
				t: 'hr',
				...(node.fallback !== undefined && { fb: compactFallback(node.fallback) }),
			};
		case 'KATEX':
			return {
				t: '$$',
				c: compactText(node.value, msg, state),
			};
		case 'LINE_BREAK':
			return {
				t: 'br',
			};
		case 'LIST_ITEM':
			return compactListItem(node, msg, state);
	}
}

/** Reconstructs a block or paragraph AST node from its compact representation. */
function expandBlockOrParagraph(
	cnode: CompactParagraph | CompactBlock,
	msg: string
): Paragraph | Blocks {
	switch (cnode.t) {
		case 'p':
			return expandParagraph(cnode, msg);
		case 'h':
			return {
				type: 'HEADING',
				level: cnode.l,
				value: expandInlines(cnode.c, msg),
			};
		case '```':
			return {
				type: 'CODE',
				language: cnode.lang,
				value: cnode.c.map((line) => ({
					type: 'CODE_LINE',
					value: expandPlain(line.c, msg),
				})),
			};
		case 'q':
		case '>':
			return {
				type: 'QUOTE',
				value: expandParagraphs(cnode.c, msg),
			};
		case '|||':
			return {
				type: 'SPOILER_BLOCK',
				value: expandParagraphs(cnode.c, msg),
			};
		case 'ol':
			return {
				type: 'ORDERED_LIST',
				value: expandListItems(cnode.c, msg),
			};
		case 'ul':
			return {
				type: 'UNORDERED_LIST',
				value: expandListItems(cnode.c, msg),
			};
		case 'tl':
			return {
				type: 'TASKS',
				value: expandTasks(cnode.c, msg),
			};
		case 'table':
			return {
				type: 'TABLE',
				value: {
					header: cnode.h.map((cell) => expandTableCell(cell, msg)),
					rows: cnode.r.map((row) => expandTableRow(row, msg)),
				},
				...(cnode.fb !== undefined && { fallback: expandFallback(cnode.fb, msg) }),
			};
		case 'hr':
			return {
				type: 'HORIZONTAL_RULE',
				value: undefined,
				...(cnode.fb !== undefined && { fallback: expandFallback(cnode.fb, msg) }),
			};
		case '$$':
			return {
				type: 'KATEX',
				value: expandText(cnode.c, msg),
			};
		case 'br':
			return {
				type: 'LINE_BREAK',
				value: undefined,
			};
		case 'li':
			return expandListItem(cnode, msg);
	}
}

/** Recursively compares two values for structural deep equality. */
function deepEqual(a: unknown, b: unknown): boolean {
	if (a === b) return true;
	if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') {
		return false;
	}
	if (Array.isArray(a) !== Array.isArray(b)) return false;
	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) return false;
		for (let i = 0; i < a.length; i++) {
			if (!deepEqual(a[i], b[i])) return false;
		}
		return true;
	}
	const keysA = Object.keys(a as Record<string, unknown>);
	const keysB = Object.keys(b as Record<string, unknown>);
	if (keysA.length !== keysB.length) return false;
	for (const key of keysA) {
		if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
		if (!deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
			return false;
		}
	}
	return true;
}

/**
 * Converts a verbose AST + original message into a compact AST.
 * Replaces self-contained string nodes with span references ([start, end]) into the message.
 */
export function compactify(ast: Root, msg: string): CompactRoot {
	const state: CompactionState = { cursor: 0 };

	if (ast.length === 1 && ast[0].type === 'BIG_EMOJI') {
		return [compactBigEmoji(ast[0], msg, state)];
	}

	return (ast as Array<Paragraph | Blocks>).map((item) =>
		compactBlockOrParagraph(item, msg, state)
	);
}

/**
 * Reconstructs the full verbose AST from a compact AST + original message.
 */
export function expand(compactAst: CompactRoot, msg: string): Root {
	if (compactAst.length === 1 && compactAst[0].t === 'E') {
		return [expandBigEmoji(compactAst[0] as CompactBigEmoji, msg)];
	}

	return (compactAst as Array<CompactParagraph | CompactBlock>).map((item) =>
		expandBlockOrParagraph(item, msg)
	);
}

/**
 * Verifies that expand(compactify(ast, msg), msg) equals the original AST.
 */
export function validateRoundtrip(ast: Root, msg: string): boolean {
	const compacted = compactify(ast, msg);
	const restored = expand(compacted, msg);
	return deepEqual(restored, ast);
}

/**
 * Measures the serialization size reduction achieved by the compact AST format.
 */
export function calculateCompressionRatio(ast: Root, compactAst: CompactRoot): CompressionRatio {
	const originalJson = JSON.stringify(ast);
	const compactJson = JSON.stringify(compactAst);
	const encoder = new TextEncoder();
	const originalBytes = encoder.encode(originalJson).byteLength;
	const compactBytes = encoder.encode(compactJson).byteLength;
	const ratio = originalBytes === 0 ? 1 : compactBytes / originalBytes;
	const percentReduction = (1 - ratio) * 100;

	return {
		originalBytes,
		compactBytes,
		ratio,
		percentReduction: Math.round(percentReduction * 100) / 100,
	};
}
