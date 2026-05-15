import { BlockSplitter, BlockType } from './BlockSplitter';
import type { Paragraph, Root } from './definitions';
import * as grammar from './grammar.pegjs';
import { paragraph, plain } from './utils';

export type * from './definitions';

export { isNodeOfType } from './guards';

export type Options = {
	colors?: boolean;
	emoticons?: boolean;
	katex?: {
		dollarSyntax?: boolean;
		parenthesisSyntax?: boolean;
	};
	customDomains?: string[];
};

const MARKDOWN_TRIGGER = /[\r\n*_~`@#:<>|!+$\\[\]()\-]|\.[A-Za-z]|^\d+\.|[⌀-➿☀-⛿\uD800-\uDBFF]/;

const trivialParse = (input: string): Root | null => {
	if (input.length === 0) return [];
	if (input.length > 1024) return null;
	if (MARKDOWN_TRIGGER.test(input)) return null;
	return [paragraph([plain(input)]) as Paragraph];
};

const PARSE_CACHE_LIMIT = 512;
const PARSE_CACHE_MAX_INPUT = 4096;
const parseCache = new Map<string, Root>();

const cacheKey = (input: string, options?: Options): string => {
	if (!options) return `|${input}`;
	const k = options.katex;
	return `${options.colors ? 'c' : ''}${options.emoticons ? 'e' : ''}${k?.dollarSyntax ? 'd' : ''}${k?.parenthesisSyntax ? 'p' : ''}${
		options.customDomains?.join(',') ?? ''
	}|${input}`;
};

export const parse = (input: string, options?: Options): Root => {
	const fast = trivialParse(input);
	if (fast) return fast;

	if (input.length <= PARSE_CACHE_MAX_INPUT) {
		const key = cacheKey(input, options);
		const hit = parseCache.get(key);
		if (hit !== undefined) {
			parseCache.delete(key);
			parseCache.set(key, hit);
			return hit;
		}
		const result = grammar.parse(input, options) as Root;
		if (parseCache.size >= PARSE_CACHE_LIMIT) {
			const firstKey = parseCache.keys().next().value;
			if (firstKey !== undefined) parseCache.delete(firstKey);
		}
		parseCache.set(key, result);
		return result;
	}

	return grammar.parse(input, options) as Root;
};

const yieldToEventLoop = (): Promise<void> =>
	new Promise((resolve) => {
		if (typeof queueMicrotask === 'function') {
			queueMicrotask(resolve);
		} else {
			setTimeout(resolve, 0);
		}
	});

const canChunk = (input: string): boolean => {
	if (input.length < 32) return false;
	if (input.includes('||')) return false;
	return true;
};

const blockToInput = (block: ReturnType<typeof BlockSplitter.split>[number]): string => {
	if (block.type === BlockType.CODE) {
		const fence = '```';
		return `${fence}${block.language ? block.language : ''}\n${block.content}\n${fence}`;
	}
	return block.content;
};

export async function* parseStream(input: string, options?: Options): AsyncGenerator<Root[number], void, void> {
	if (input.length === 0) return;

	if (!canChunk(input)) {
		const all = parse(input, options);
		for (const node of all) {
			yield node;
		}
		return;
	}

	const blocks = BlockSplitter.split(input);
	for (let i = 0; i < blocks.length; i++) {
		const blockInput = blockToInput(blocks[i]);
		if (blockInput.length === 0) continue;
		const parsed = parse(blockInput, options);
		for (const node of parsed) {
			yield node;
		}
		if (i < blocks.length - 1) await yieldToEventLoop();
	}
}

export const clearParseCache = (): void => {
	parseCache.clear();
};

export type { Root as MarkdownAST };
export { parse as parser };
