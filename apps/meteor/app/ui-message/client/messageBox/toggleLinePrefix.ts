import type { ComposerAPI } from '../../../../client/lib/chats/ChatAPI';

const UNORDERED_MARKER = String.raw`[-*][ \t]+(?!\[[ x]\][ \t]+)`;
const ORDERED_MARKER = String.raw`\d+\.[ \t]+`;

const ANY_LINE_PREFIX = new RegExp(String.raw`^(?:${UNORDERED_MARKER}|${ORDERED_MARKER})`);

export type LinePrefix = {
	build: (index: number) => string;
	match: RegExp;
};

export const UNORDERED_LINE_PREFIX: LinePrefix = {
	build: () => '- ',
	match: new RegExp(String.raw`^${UNORDERED_MARKER}`),
};

export const ORDERED_LINE_PREFIX: LinePrefix = {
	build: (index) => `${index + 1}. `,
	match: new RegExp(String.raw`^${ORDERED_MARKER}`),
};

const ORDERED_LINE = new RegExp(String.raw`^(\d+)\.[ \t]+`);

export const continueLinePrefix = (text: string, caret: number): string | undefined => {
	const lineStart = caret === 0 ? 0 : text.lastIndexOf('\n', caret - 1) + 1;
	const line = text.slice(lineStart, caret);

	const ordered = ORDERED_LINE.exec(line);

	if (ordered) {
		return ORDERED_LINE_PREFIX.build(parseInt(ordered[1], 10));
	}

	if (UNORDERED_LINE_PREFIX.match.test(line)) {
		return UNORDERED_LINE_PREFIX.build(0);
	}

	return undefined;
};

export const bareLinePrefixRange = (text: string, caret: number): { start: number; end: number } | undefined => {
	const start = caret === 0 ? 0 : text.lastIndexOf('\n', caret - 1) + 1;
	const nextBreak = text.indexOf('\n', caret);
	const end = nextBreak === -1 ? text.length : nextBreak;

	if (caret !== end) {
		return undefined;
	}

	const marker = ANY_LINE_PREFIX.exec(text.slice(start, end));

	if (!marker || text.slice(start + marker[0].length, end).trim() !== '') {
		return undefined;
	}

	return { start, end };
};

const blockRange = (text: string, start: number, end: number): { blockStart: number; blockEnd: number } => {
	const blockStart = start === 0 ? 0 : text.lastIndexOf('\n', start - 1) + 1;
	const nextBreak = text.indexOf('\n', end);

	return { blockStart, blockEnd: nextBreak === -1 ? text.length : nextBreak };
};

export const applyLinePrefix = (
	text: string,
	selection: { readonly start: number; readonly end: number },
	prefix: LinePrefix,
): { value: string; blockStart: number; blockEnd: number } => {
	const { blockStart, blockEnd } = blockRange(text, selection.start, selection.end);

	const lines = text.slice(blockStart, blockEnd).split('\n');
	const filled = lines.filter((line) => line.trim() !== '');
	const removing = filled.length > 0 && filled.every((line) => prefix.match.test(line));

	let index = 0;
	const value = lines
		.map((line) => {
			if (removing) {
				return line.replace(prefix.match, '');
			}

			if (filled.length > 0 && line.trim() === '') {
				return line;
			}

			const built = `${prefix.build(index)}${line.replace(ANY_LINE_PREFIX, '')}`;
			index += 1;

			return built;
		})
		.join('\n');

	return { value, blockStart, blockEnd };
};

export const toggleLinePrefix = (composer: ComposerAPI, prefix: LinePrefix): void => {
	const { value, blockStart, blockEnd } = applyLinePrefix(composer.text, composer.selection, prefix);

	composer.replaceText(value, { start: blockStart, end: blockEnd });
};
