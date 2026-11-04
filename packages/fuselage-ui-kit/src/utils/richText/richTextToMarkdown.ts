import type * as UiKit from '@rocket.chat/ui-kit';

import type { MentionNames } from './richTextToAst';

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
			return wrap(element.text, element.style);
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
	block.elements.map((container) => containerToMarkdown(container, names)).join('\n\n');
