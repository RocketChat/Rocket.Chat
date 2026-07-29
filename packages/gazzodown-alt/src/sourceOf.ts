import type * as MessageParser from '@rocket.chat/message-parser';

export type SourceNode = MessageParser.Inlines | MessageParser.Blocks | MessageParser.BigEmoji;

const fallbackSlice = (fallback: MessageParser.SourceRange | MessageParser.Plain | undefined, source: string): string => {
	if (!fallback) {
		return '';
	}

	if (Array.isArray(fallback)) {
		return source.slice(fallback[0], fallback[1]);
	}

	return fallback.value;
};

const emojiSource = (emoji: MessageParser.Emoji): string => {
	if ('unicode' in emoji) {
		return emoji.unicode;
	}

	const literal = emoji.value?.value;

	return literal && literal !== emoji.shortCode ? literal : `:${emoji.shortCode}:`;
};

// Rebuild the markup a node was parsed from, so nodes the composer has no renderer for still show
// their literal text instead of disappearing. Returns '' when the source cannot be recovered; the
// caller's text guard then falls back to the raw input.
export const sourceOf = (node: SourceNode, source: string): string => {
	const inner = (nodes: SourceNode[]): string => nodes.map((child) => sourceOf(child, source)).join('');

	switch (node.type) {
		case 'PLAIN_TEXT':
			return node.value;

		case 'BOLD':
			return `*${inner(node.value)}*`;

		case 'ITALIC':
			return `_${inner(node.value)}_`;

		case 'STRIKE':
			return `~${inner(node.value)}~`;

		case 'SPOILER':
			return `||${inner(node.value)}||`;

		case 'INLINE_CODE':
			return `\`${node.value.value}\``;

		case 'MENTION_USER':
			return `@${node.value.value}`;

		case 'MENTION_CHANNEL':
			return `#${node.value.value}`;

		case 'EMOJI':
			return emojiSource(node);

		case 'BIG_EMOJI':
			return node.value.map(emojiSource).join('');

		case 'LINK': {
			const src = node.value.src.value;
			const label = inner(Array.isArray(node.value.label) ? node.value.label : [node.value.label]);

			// Autolinked URLs and emails keep the typed text as their label, with the scheme added to the href.
			if (src === label || src === `//${label}` || src === `mailto:${label}`) {
				return label;
			}

			return `[${label}](${src})`;
		}

		case 'IMAGE': {
			const src = node.value.src.value;
			const label = inner([node.value.label]);

			return label === src ? `![](${src})` : `![${label}](${src})`;
		}

		case 'TIMESTAMP':
		case 'HORIZONTAL_RULE':
		case 'TABLE':
			return fallbackSlice(node.fallback, source);

		default:
			return '';
	}
};
