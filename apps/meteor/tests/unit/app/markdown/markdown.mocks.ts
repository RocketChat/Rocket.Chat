import proxyquire from 'proxyquire';

export type MarkdownToken = { token: string; type?: string; text: string; noHtml?: string };

export type ParsedMessage = { html?: string; msg?: string; tokens?: MarkdownToken[] };

export type MarkdownOptions = { supportSchemesForLink?: string; headers?: boolean; rootUrl?: string };

const mocks = {
	'meteor/meteor': {
		Meteor: {
			absoluteUrl() {
				return 'http://localhost:3000/';
			},
		},
	},
};

export const { Markdown, createMarkdownMessageRenderer, createMarkdownNotificationRenderer } = proxyquire
	.noCallThru()
	.load('../../../../lib/markdown/markdown', mocks) as typeof import('../../../../lib/markdown/markdown');

export const { filterMarkdown } = proxyquire
	.noCallThru()
	.load('../../../../lib/markdown/parser/filtered/filtered', mocks) as typeof import('../../../../lib/markdown/parser/filtered/filtered');

export const { original } = proxyquire.noCallThru().load('../../../../lib/markdown/parser/original/original', mocks) as {
	original: (message: ParsedMessage, options?: MarkdownOptions) => ParsedMessage;
};

export const { code } = proxyquire
	.noCallThru()
	.load('../../../../lib/markdown/parser/original/code', mocks) as typeof import('../../../../lib/markdown/parser/original/code');

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
