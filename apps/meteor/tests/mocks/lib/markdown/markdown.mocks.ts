import { original as originalParser } from '../../../../lib/markdown/parser/original/original';

export type MarkdownToken = { token: string; type?: string; text: string; noHtml?: string };

export type ParsedMessage = { html?: string; msg?: string; tokens?: MarkdownToken[] };

export type MarkdownOptions = { supportSchemesForLink?: string; headers?: boolean; rootUrl?: string };

export { Markdown, createMarkdownMessageRenderer, createMarkdownNotificationRenderer } from '../../../../lib/markdown/markdown';
export { filterMarkdown } from '../../../../lib/markdown/parser/filtered/filtered';
export { code } from '../../../../lib/markdown/parser/original/code';

export const original: (message: ParsedMessage, options?: MarkdownOptions) => ParsedMessage = originalParser;

const copyonly = (text: string, marker: string) => `<span class="copyonly">${marker}</span>${text}<span class="copyonly">${marker}</span>`;

export const markup = {
	bold: (text: string) => copyonly(`<strong>${text}</strong>`, '*'),
	inlineCode: (text: string) => copyonly(`<span><code class="code-colors inline">${text}</code></span>`, '`'),
	anchor: (url: string, title: string, target = '_blank') =>
		`<a data-title="${url}" href="${url}" target="${target}" rel="noopener noreferrer">${title}</a>`,
	image: (url: string, title: string, target = '_blank') =>
		`<a data-title="${url}" href="${url}" title="${title}" target="${target}" rel="noopener noreferrer">` +
		`<div class="inline-image" style="background-image: url(${url});"></div></a>`,
	blockquote: (text: string, marker = '&gt;') =>
		`<blockquote class="background-transparent-darker-before"><span class="copyonly">${marker}</span>${text}</blockquote>`,
};
