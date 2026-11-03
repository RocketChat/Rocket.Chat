import type * as MessageParser from '@rocket.chat/message-parser';

const canRenderInline = (inline: MessageParser.Inlines, parent?: 'BOLD' | 'ITALIC' | 'STRIKE' | 'LINK'): boolean => {
	switch (inline.type) {
		case 'PLAIN_TEXT':
			return true;

		case 'EMOJI':
			return parent !== 'LINK';

		case 'BOLD':
		case 'ITALIC':
		case 'STRIKE':
			return inline.type !== parent && inline.value.every((child) => canRenderInline(child, inline.type));

		case 'LINK':
			return (
				parent !== 'LINK' &&
				(Array.isArray(inline.value.label) ? inline.value.label : [inline.value.label]).every((child) => canRenderInline(child, 'LINK'))
			);

		case 'SPOILER':
			return !parent && inline.value.every((child) => canRenderInline(child));

		case 'INLINE_CODE':
		case 'MENTION_USER':
		case 'MENTION_CHANNEL':
			return !parent;

		default:
			return false;
	}
};

const canRenderBlock = (block: MessageParser.Root[number]): boolean => {
	switch (block.type) {
		case 'PARAGRAPH':
		case 'HEADING':
			return block.value.every((inline) => canRenderInline(inline));

		case 'UNORDERED_LIST':
		case 'ORDERED_LIST':
			return block.value.every(
				({ value, nested }) => value.every((inline) => canRenderInline(inline)) && (!nested || nested.every(canRenderBlock)),
			);

		case 'BIG_EMOJI':
		case 'CODE':
		case 'LINE_BREAK':
		case 'HORIZONTAL_RULE':
			return true;

		default:
			return false;
	}
};

export const canRenderMarkup = (tokens: MessageParser.Root): boolean => tokens.every(canRenderBlock);
