import type * as MessageParser from '@rocket.chat/message-parser';
import * as UiKit from '@rocket.chat/ui-kit';

export type MentionNames = {
	users: Readonly<Record<string, string>>;
	channels: Readonly<Record<string, string>>;
	teams: Readonly<Record<string, string>>;
	/** Permalinks of the messages a rich text mentions without a `url`, by message id. */
	messageLinks: Readonly<Record<string, string>>;
	messageLabel: string;
};

const plain = (value: string): MessageParser.Plain => ({ type: 'PLAIN_TEXT', value });

const styleNode = (
	base: MessageParser.Plain | MessageParser.InlineCode | MessageParser.Link | MessageParser.UserMention | MessageParser.ChannelMention,
	style: UiKit.RichTextStyle | undefined,
): MessageParser.Inlines => {
	let node: MessageParser.Inlines = base;

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

const styled = (value: string, style: UiKit.RichTextStyle | undefined): MessageParser.Inlines =>
	styleNode(style?.code ? { type: 'INLINE_CODE', value: plain(value) } : plain(value), style);

const link = (url: string, label: string, style?: UiKit.RichTextStyle): MessageParser.Inlines =>
	UiKit.isSafeUrl(url) ? styleNode({ type: 'LINK', value: { src: plain(url), label: plain(label) } }, style) : styled(label, style);

const hexColor = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})?$/i;

/** Elements drawn by the block itself, because the message-parser AST has no token for them. */
export const isCustomInline = (element: UiKit.RichTextInlineElement): element is UiKit.RichTextTagElement | UiKit.RichTextCitationElement =>
	element.type === 'tag' || (element.type === 'citation' && UiKit.isSafeUrl(element.url));

export const messageHref = (element: UiKit.RichTextMessageMentionElement, names: MentionNames) =>
	element.url && UiKit.isSafeUrl(element.url) ? element.url : names.messageLinks[element.message_id];

const broadcastNames = { here: 'here', channel: 'all', everyone: 'all' } as const;

export const inlineToAst = (element: UiKit.RichTextInlineElement, names: MentionNames): MessageParser.Inlines => {
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

		case 'color': {
			const match = hexColor.exec(element.value);
			if (!match) return plain(element.value);
			const [, r, g, b, a] = match;
			return { type: 'COLOR', value: { r: parseInt(r, 16), g: parseInt(g, 16), b: parseInt(b, 16), a: a ? parseInt(a, 16) : 255 } };
		}

		case 'tag':
			return styled(element.text, element.style);

		case 'citation':
			return link(element.url, `[${element.index}]`);

		case 'message_mention': {
			const href = messageHref(element, names);
			const label = element.text ?? names.messageLabel;
			return href ? link(href, label, element.style) : styled(label, element.style);
		}

		case 'attachment_mention':
			return link(element.url, element.text ?? element.url, element.style);

		case 'usergroup':
			return styleNode({ type: 'MENTION_USER', value: plain(names.teams[element.usergroup_id] ?? element.usergroup_id) }, element.style);

		case 'team':
			return styleNode({ type: 'MENTION_CHANNEL', value: plain(names.teams[element.team_id] ?? element.team_id) }, element.style);
	}
};

const inlinesToAst = (elements: UiKit.RichTextInlineElement[], names: MentionNames) =>
	elements.map((element) => inlineToAst(element, names));

export const containerToAst = (container: UiKit.RichTextContainer, names: MentionNames): MessageParser.Paragraph | MessageParser.Blocks => {
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
