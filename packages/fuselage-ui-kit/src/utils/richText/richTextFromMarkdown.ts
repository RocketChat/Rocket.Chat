import { parse } from '@rocket.chat/message-parser';
import type * as MessageParser from '@rocket.chat/message-parser';
import type * as UiKit from '@rocket.chat/ui-kit';

type Style = UiKit.RichTextStyle;

const labelText = (label: MessageParser.Link['value']['label']): string =>
	[label]
		.flat()
		.map((node) => (typeof node.value === 'string' ? node.value : ''))
		.join('');

const inlinesFromAst = (nodes: readonly MessageParser.Inlines[], style: Style = {}): UiKit.RichTextInlineElement[] =>
	nodes.flatMap((node): UiKit.RichTextInlineElement[] => {
		const withStyle = Object.keys(style).length > 0 ? { style } : {};

		switch (node.type) {
			case 'PLAIN_TEXT':
				return [{ type: 'text', text: node.value, ...withStyle }];

			case 'BOLD':
				return inlinesFromAst(node.value, { ...style, bold: true });

			case 'ITALIC':
				return inlinesFromAst(node.value, { ...style, italic: true });

			case 'STRIKE':
				return inlinesFromAst(node.value, { ...style, strike: true });

			case 'INLINE_CODE':
				return [{ type: 'text', text: node.value.value, style: { ...style, code: true } }];

			case 'LINK':
				return [{ type: 'link', url: node.value.src.value, text: labelText(node.value.label), ...withStyle }];

			case 'EMOJI':
				return ['unicode' in node ? { type: 'emoji', name: node.unicode, unicode: node.unicode } : { type: 'emoji', name: node.shortCode }];

			// Mentions are typed by name and the client holds no ids for them, so only the broadcast ones stay structured.
			case 'MENTION_USER':
				return node.value.value === 'here' || node.value.value === 'all'
					? [{ type: 'broadcast', range: node.value.value === 'here' ? 'here' : 'channel' }]
					: [{ type: 'text', text: `@${node.value.value}`, ...withStyle }];

			case 'MENTION_CHANNEL':
				return [{ type: 'text', text: `#${node.value.value}`, ...withStyle }];

			case 'TIMESTAMP':
				return [{ type: 'date', timestamp: Number(node.value.timestamp), format: node.value.format }];

			case 'SPOILER':
				return inlinesFromAst(node.value, style);

			default:
				return [];
		}
	});

const section = (nodes: readonly MessageParser.Inlines[]): UiKit.RichTextSection => ({
	type: 'rich_text_section',
	elements: inlinesFromAst(nodes),
});

const newline: UiKit.RichTextInlineElement = { type: 'text', text: '\n' };

const joinParagraphs = (paragraphs: readonly MessageParser.Paragraph[]) =>
	paragraphs.flatMap((paragraph, index) => [...(index > 0 ? [newline] : []), ...inlinesFromAst(paragraph.value)]);

// A nested list is emitted after the items that precede it, with `indent` set to its depth.
const listFromAst = (
	list: MessageParser.OrderedList | MessageParser.UnorderedList | MessageParser.Tasks,
	indent: number,
): UiKit.RichTextList[] => {
	const style = list.type === 'ORDERED_LIST' ? 'ordered' : 'bullet';
	const result: UiKit.RichTextList[] = [];
	let current: UiKit.RichTextList | undefined;

	for (const item of list.value) {
		if (!current) {
			current = { type: 'rich_text_list', style, ...(indent > 0 && { indent }), elements: [] };
			result.push(current);
		}
		current.elements.push(section(item.value));

		if (item.nested?.length) {
			result.push(...item.nested.flatMap((nested) => listFromAst(nested, indent + 1)));
			current = undefined;
		}
	}

	return result;
};

const containersFromAst = (node: MessageParser.Root[number]): UiKit.RichTextContainer[] => {
	switch (node.type) {
		case 'PARAGRAPH':
			return [section(node.value)];

		case 'HEADING':
			return [{ type: 'rich_text_section', elements: inlinesFromAst(node.value, { bold: true }) }];

		case 'QUOTE':
			return [{ type: 'rich_text_quote', elements: joinParagraphs(node.value) }];

		case 'CODE':
			return [
				{ type: 'rich_text_preformatted', elements: [{ type: 'text', text: node.value.map((line) => line.value.value).join('\n') }] },
			];

		case 'UNORDERED_LIST':
		case 'ORDERED_LIST':
		case 'TASKS':
			return listFromAst(node, 0);

		case 'BIG_EMOJI':
			return [section(node.value)];

		default:
			return [];
	}
};

/** Parses Markdown the way a chat message is parsed and returns it as a `rich_text` block. */
export const richTextFromMarkdown = (markdown: string): UiKit.RichTextBlock => ({
	type: 'rich_text',
	elements: parse(markdown, { emoticons: false }).flatMap(containersFromAst),
});
