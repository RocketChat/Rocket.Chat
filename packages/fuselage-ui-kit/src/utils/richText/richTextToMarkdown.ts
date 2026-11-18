import * as UiKit from '@rocket.chat/ui-kit';

import type { MentionNames } from './richTextToAst';
import { messageHref } from './richTextToAst';

// Escapes the characters of plain text that the Markdown parser reads as syntax: the inline
// markers, a `#` or a list number that starts a line. Styled text cannot hold an escape.
const escapeText = (text: string) =>
	text
		.replace(/[*_~`]/g, '\\$&')
		.replace(/^(\s*)#/gm, '$1\\#')
		.replace(/^(\s*\d+)\./gm, '$1\\.');

const hasStyle = (style: UiKit.RichTextStyle | undefined) => Boolean(style?.code || style?.bold || style?.italic || style?.strike);

const wrap = (text: string, style: UiKit.RichTextStyle | undefined) => {
	let result = text;
	if (style?.code) result = `\`${result}\``;
	if (style?.strike) result = `~${result}~`;
	if (style?.italic) result = `_${result}_`;
	if (style?.bold) result = `**${result}**`;
	return result;
};

const broadcastNames = { here: 'here', channel: 'all', everyone: 'all' } as const;

const inlineToMarkdown = (element: UiKit.RichTextInlineElement, names: MentionNames): string => {
	switch (element.type) {
		case 'text':
			return wrap(hasStyle(element.style) ? element.text : escapeText(element.text), element.style);
		case 'link':
			return wrap(`[${element.text ?? element.url}](${element.url})`, element.style);
		case 'emoji':
			return element.unicode ?? `:${element.name}:`;
		case 'user':
			return `@${names.users[element.user_id] ?? element.user_id}`;
		case 'channel':
			return `#${names.channels[element.channel_id] ?? element.channel_id}`;
		case 'date':
			return `<t:${element.timestamp}:${element.format ?? 'f'}>`;
		case 'broadcast':
			return `@${broadcastNames[element.range]}`;
		case 'color':
			return element.value;
		case 'tag':
			return wrap(element.text, element.style);
		case 'citation':
			return UiKit.isSafeUrl(element.url) ? `[${element.index}](${element.url})` : `[${element.index}]`;
		case 'message_mention': {
			const href = messageHref(element, names);
			return wrap(href ? `[${element.text ?? names.messageLabel}](${href})` : (element.text ?? names.messageLabel), element.style);
		}
		case 'attachment_mention':
			return wrap(
				UiKit.isSafeUrl(element.url) ? `[${element.text ?? element.url}](${element.url})` : (element.text ?? element.url),
				element.style,
			);
		case 'usergroup':
			return wrap(`@${names.teams[element.usergroup_id] ?? element.usergroup_id}`, element.style);
		case 'team':
			return wrap(`#${names.teams[element.team_id] ?? element.team_id}`, element.style);
	}
};

const inlinesToMarkdown = (elements: UiKit.RichTextInlineElement[], names: MentionNames) =>
	elements.map((element) => inlineToMarkdown(element, names)).join('');

const containerToMarkdown = (container: UiKit.RichTextContainer, names: MentionNames): string => {
	switch (container.type) {
		case 'rich_text_section':
			return inlinesToMarkdown(container.elements, names);

		case 'rich_text_list': {
			const padding = '  '.repeat(container.indent ?? 0);
			return container.elements
				.map(
					(item, index) => `${padding}${container.style === 'ordered' ? `${index + 1}.` : '-'} ${inlinesToMarkdown(item.elements, names)}`,
				)
				.join('\n');
		}

		case 'rich_text_quote':
			return inlinesToMarkdown(container.elements, names)
				.split('\n')
				.map((line) => `> ${line}`)
				.join('\n');

		case 'rich_text_preformatted':
			return `\`\`\`\n${container.elements.map((element) => ('text' in element ? element.text : '')).join('')}\n\`\`\``;
	}
};

/** Writes a `rich_text` block as the Markdown a user would type to produce it. */
export const richTextToMarkdown = (block: Pick<UiKit.RichTextBlock, 'elements'>, names: MentionNames): string =>
	block.elements
		.map((container, index) => {
			const previous = block.elements[index - 1];
			if (!previous) {
				return containerToMarkdown(container, names);
			}
			// A nested list and its parent are one list in Markdown, so no blank line may separate them.
			const isNesting =
				previous.type === 'rich_text_list' && container.type === 'rich_text_list' && (previous.indent ?? 0) !== (container.indent ?? 0);
			return `${isNesting ? '\n' : '\n\n'}${containerToMarkdown(container, names)}`;
		})
		.join('');
