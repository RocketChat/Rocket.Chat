import { getPageMeta } from './getPageMeta';

const DEFAULT_MARKDOWN_PARSER_LIMIT = 30_000;

export const getMarkdownParserLimit = (): number => {
	const value = getPageMeta('rc-markdown-max-length');
	if (value === null) return DEFAULT_MARKDOWN_PARSER_LIMIT;
	const parsed = parseInt(value, 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MARKDOWN_PARSER_LIMIT;
};
