import { Blaze } from 'meteor/blaze';

import { Markdown } from '../lib/markdown';

Blaze.registerHelper('RocketChatMarkdown', (text) => Markdown.parse(text));
Blaze.registerHelper('RocketChatMarkdownUnescape', (text) => Markdown.parseNotEscaped(text));
Blaze.registerHelper('RocketChatMarkdownInline', (text) => {
	const output = Markdown.parse(text);
	return output.replace(/^<p>/, '').replace(/<\/p>$/, '');
});

export { Markdown };

export { createMarkdownMessageRenderer, createMarkdownNotificationRenderer } from '../lib/markdown';
