import type * as MessageParser from '@rocket.chat/message-parser';
import type * as UiKit from '@rocket.chat/ui-kit';

export type MentionNames = {
	users: Readonly<Record<string, string>>;
	channels: Readonly<Record<string, string>>;
};

const plain = (value: string): MessageParser.Plain => ({ type: 'PLAIN_TEXT', value });

const styled = (value: string, style: UiKit.RichTextStyle | undefined): MessageParser.Inlines => {
	let node: MessageParser.Inlines = style?.code ? { type: 'INLINE_CODE', value: plain(value) } : plain(value);

	if (style?.strike) {
		node = { type: 'STRIKE', value: [node] };
	}
	if (style?.italic) {
		node = { type: 'ITALIC', value: [node] };
	}
	if (style?.bold) {
		node = { type: 'BOLD', value: [node] };
	}

	return node;
};

const broadcastNames = { here: 'here', channel: 'all', everyone: 'all' } as const;

const inlineToAst = (element: UiKit.RichTextInlineElement, names: MentionNames): MessageParser.Inlines => {
	switch (element.type) {
		case 'text':
			return styled(element.text, element.style);

		case 'link':
			return { type: 'LINK', value: { src: plain(element.url), label: plain(element.text ?? element.url) } };

		case 'emoji':
			return element.unicode
				? { type: 'EMOJI', value: undefined, unicode: element.unicode }
				: { type: 'EMOJI', value: plain(element.name), shortCode: element.name };

		case 'user':
			return { type: 'MENTION_USER', value: plain(names.users[element.user_id] ?? element.user_id) };

		case 'channel':
			return { type: 'MENTION_CHANNEL', value: plain(names.channels[element.channel_id] ?? element.channel_id) };

		case 'date':
			return { type: 'TIMESTAMP', value: { timestamp: String(element.timestamp), format: element.format ?? 'f' } };

		case 'broadcast':
			return { type: 'MENTION_USER', value: plain(broadcastNames[element.range]) };
	}
};

const inlinesToAst = (elements: UiKit.RichTextInlineElement[], names: MentionNames) =>
	elements.map((element) => inlineToAst(element, names));

const containerToAst = (container: UiKit.RichTextContainer, names: MentionNames): MessageParser.Paragraph | MessageParser.Blocks => {
	switch (container.type) {
		case 'rich_text_section':
			return { type: 'PARAGRAPH', value: inlinesToAst(container.elements, names) };

		// Lists are flat in the AST, so `indent` is dropped: a nested list renders at the top level.
		case 'rich_text_list': {
			const items = container.elements.map((section, index): MessageParser.ListItem => ({
				type: 'LIST_ITEM',
				value: inlinesToAst(section.elements, names),
				...(container.style === 'ordered' && { number: index + 1 }),
			}));
			return container.style === 'ordered' ? { type: 'ORDERED_LIST', value: items } : { type: 'UNORDERED_LIST', value: items };
		}

		case 'rich_text_quote':
			return { type: 'QUOTE', value: [{ type: 'PARAGRAPH', value: inlinesToAst(container.elements, names) }] };

		case 'rich_text_preformatted': {
			const text = container.elements.map((element) => ('text' in element && element.text) || '').join('');
			return {
				type: 'CODE',
				language: undefined,
				value: text.split('\n').map((line): MessageParser.CodeLine => ({ type: 'CODE_LINE', value: plain(line) })),
			};
		}
	}
};

export const richTextToAst = (block: Pick<UiKit.RichTextBlock, 'elements'>, names: MentionNames): MessageParser.Root =>
	block.elements.map((container) => containerToAst(container, names));
