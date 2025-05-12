import type * as MessageParser from '@rocket.chat/message-parser';

import { getEmojiClassNameAndDataTitle } from '../../../../client/lib/utils/renderEmoji';

export const escapeHTML = (str: string): string =>
	str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');

const renderInline = (tokens: (MessageParser.Inlines | { fallback: MessageParser.Plain; type: undefined })[]): string =>
	tokens
		.map((token) => {
			if (token.type === undefined && 'fallback' in token) {
				return escapeHTML(token.fallback.value);
			}

			switch (token.type) {
				case 'PLAIN_TEXT':
					return escapeHTML(token.value);

				case 'LINK':
					// return `<span>[<a href="${escapeHTML(token.value.src.value)}">${renderInline(
					// 	Array.isArray(token.value.label) ? token.value.label : [token.value.label],
					// )}</a>](${escapeHTML(token.value.src.value)})</span>`;
					console.log('Unexpected LINK token encountered:', token.value);
					return '';

				case 'MENTION_USER':
					const classes =
						token.value.value === 'all'
							? 'rcx-box rcx-box--full rcx-message__highlight rcx-message__highlight--relevant'
							: 'rcx-box rcx-box--full rcx-message__highlight rcx-message__highlight--critical rcx-message__highlight--clickable';

					return `<span class="${classes}">@${escapeHTML(token.value.value)}</span>`;

				case 'MENTION_CHANNEL':
					return `<span class="mention-channel">#${escapeHTML(token.value.value)}</span>`;

				case 'BOLD':
					return `*<b>${renderInline(token.value)}</b>*`;

				case 'ITALIC':
					return `_<i>${renderInline(token.value)}</i>_`;

				case 'STRIKE':
					return `~<del>${renderInline(token.value)}</del>~`;

				case 'INLINE_CODE':
					return `\`<code class="code-colors inline">${escapeHTML(token.value.value)}</code>\``;

				case 'EMOJI':
					if ('shortCode' in token) {
						const emoji = getEmojiClassNameAndDataTitle(`:${escapeHTML(token.shortCode)}:`);

						// Checking emojione to replace the shortCode with Unicode emoji
						if (emoji.className?.includes('emojione')) {
							return emoji.children ?? '';
						}

						// Changing the shortcode to display rendition of the custom uploaded
						if (emoji.image) {
							const rawUrl = emoji.image.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
							return (
								`<span style="font-size:0.1px">` +
								`<img src="${rawUrl}" style="width:1.5rem;height:1.5rem;vertical-align:middle"/>` +
								`:${token.shortCode}:</span>`
							);
						}
					} else return escapeHTML(token.unicode || '');

				// case 'COLOR':
				// 	return `<span style="color: ${escapeHTML(token.value.color)}">${renderInline(token.value.value)}</span>`;

				// case 'IMAGE':
				// 	return `<img src="${escapeHTML(token.value.src.value)}" alt="${escapeHTML(token.value.label.value as string)}" />`;

				// case 'TIMESTAMP':
				// 	return `<time data-timestamp="${escapeHTML(token.value.timestamp.toString())}">${escapeHTML(
				// 		token.value.timestamp.toString(),
				// 	)}</time>`;

				// case 'INLINE_KATEX':
				// 	return `<span class="katex">${escapeHTML(token.value)}</span>`;

				// eslint-disable-next-line no-fallthrough
				default:
					return '';
			}
		})
		.join('');

export const parseAST = (tokens: MessageParser.Root): string => {
	return tokens
		.map((block) => {
			switch (block.type) {
				case 'BIG_EMOJI':
					return `<p>${renderInline(block.value)}</p>`;

				case 'PARAGRAPH':
					return `${renderInline(block.value)}\n`;

				case 'HEADING':
					return `<h${block.level}>${'#'.repeat(block.level)} ${renderInline(block.value)}</h${block.level}>`;

				case 'UNORDERED_LIST':
					return `<ul>${block.value.map((item) => `<li>- ${renderInline(item.value)}</li>`).join('')}</ul>`;

				case 'ORDERED_LIST':
					return `<ol>${block.value.map((item) => `<li value="${item.number}">${item.number}. ${renderInline(item.value)}</li>`).join('')}</ol>`;

				case 'TASKS':
					return `<ul class="task-list">${block.value
						.map((task) => `<li><input type="checkbox" disabled ${task.status ? 'checked' : ''}> ${renderInline(task.value)}</li>`)
						.join('')}</ul>`;

				case 'QUOTE':
					return `<blockquote>${block.value.map((item) => `<div>\> ${renderInline(item.value)}</div>`).join('')}</blockquote>`;

				case 'CODE':
					return `<pre><p>\`\`\`${block.language}\n</p><code>${block.value.map((item) => `${item.value.value}`).join('\n')}</code><p>\`\`\`</p></pre>`;

				case 'KATEX':
					return `<span class="katex">${escapeHTML(block.value)}</span>`;

				case 'LINE_BREAK':
					return `\n`;

				default:
					return '';
			}
		})
		.join('');
};
