const generate =
	<Type extends string>(type: Type) =>
	<Value>(value: Value) =>
		({ type, value }) as const;

export const paragraph = generate('PARAGRAPH');
export const bold = generate('BOLD');

export const color = (r: number, g: number, b: number, a = 255) => ({
	type: 'COLOR' as const,
	value: { r, g, b, a },
});

export const heading = (value: unknown[], level = 1) => ({
	type: 'HEADING' as const,
	level,
	value,
});

export const code = (value: unknown[], language = 'none') => ({
	type: 'CODE' as const,
	language,
	value,
});

export const bigEmoji = generate('BIG_EMOJI');
export const task = (value: unknown[], status: boolean) => ({ type: 'TASK' as const, status, value });
export const inlineCode = generate('INLINE_CODE');
export const tasks = generate('TASKS');

export const italic = generate('ITALIC');
export const spoiler = generate('SPOILER');

export const plain = generate('PLAIN_TEXT');
export const strike = generate('STRIKE');

export const codeLine = generate('CODE_LINE');

export const link = (src: string, label?: unknown[]) => ({
	type: 'LINK' as const,
	value: { src: plain(src), label: label ?? [plain(src)] },
});

export const image = (src: string, label?: unknown) => ({
	type: 'IMAGE' as const,
	value: { src: plain(src), label: label ?? plain(src) },
});

export const quote = generate('QUOTE');
export const spoilerBlock = generate('SPOILER_BLOCK');

export const mentionChannel = (value: string) => ({
	type: 'MENTION_CHANNEL' as const,
	value: plain(value),
});

export const orderedList = generate('ORDERED_LIST');
export const unorderedList = generate('UNORDERED_LIST');

export const listItem = (value: unknown[], number?: number) => ({
	type: 'LIST_ITEM' as const,
	value,
	...(number !== undefined ? { number } : {}),
});

export const mentionUser = (value: string) => ({
	type: 'MENTION_USER' as const,
	value: plain(value),
});

export const emoji = (shortCode: string) => ({
	type: 'EMOJI' as const,
	value: plain(shortCode),
	shortCode,
});

export const emojiUnicode = (unicode: string) => ({
	type: 'EMOJI' as const,
	value: undefined,
	unicode,
});

export const emoticon = (value: string, shortCode: string) => ({
	type: 'EMOJI' as const,
	value: plain(value),
	shortCode,
});

export const lineBreak = () => ({
	type: 'LINE_BREAK' as const,
	value: undefined,
});

export const katex = (value: string) => ({
	type: 'KATEX' as const,
	value,
});

export const inlineKatex = (value: string) => ({
	type: 'INLINE_KATEX' as const,
	value,
});
