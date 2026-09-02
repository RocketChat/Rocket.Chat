import proxyquire from 'proxyquire';

export type MarkdownToken = { token: string; type?: string; text: string; noHtml?: string };

export type ParsedMessage = { html?: string; msg?: string; tokens?: MarkdownToken[] };

export type MarkdownOptions = { supportSchemesForLink?: string; headers?: boolean; rootUrl?: string };

type MarkdownModule = {
	Markdown: {
		parse(text: string): string;
		parseNotEscaped(text: string): string;
		parseMessageNotEscaped(message: ParsedMessage): ParsedMessage;
		mountTokensBack(message: ParsedMessage, useHtml?: boolean): ParsedMessage;
		code(message: ParsedMessage): ParsedMessage;
		filterMarkdownFromMessage(message: string): string;
	};
	filterMarkdown(message: string): string;
	createMarkdownMessageRenderer(options: MarkdownOptions): (message?: ParsedMessage) => ParsedMessage | undefined;
	createMarkdownNotificationRenderer(): (message: string) => string;
};

type CodeParser = (message: ParsedMessage) => ParsedMessage;

let sequence = 0;

export const resetTokenIds = (): void => {
	sequence = 0;
};

const mocks = {
	'meteor/meteor': {
		'Meteor': {
			absoluteUrl() {
				return 'http://localhost:3000/';
			},
		},
		'@global': true,
	},
	'@rocket.chat/random': {
		'Random': {
			id() {
				sequence += 1;
				return `id${String(sequence).padStart(15, '0')}`;
			},
		},
		'@global': true,
	},
};

export const { Markdown, filterMarkdown, createMarkdownMessageRenderer, createMarkdownNotificationRenderer } = proxyquire
	.noCallThru()
	.load('../../../../app/markdown/lib/markdown', mocks) as MarkdownModule;

export const { original } = proxyquire.noCallThru().load('../../../../app/markdown/lib/parser/original/original', mocks) as {
	original: (message: ParsedMessage, options?: MarkdownOptions) => ParsedMessage;
};

export const { code } = proxyquire.noCallThru().load('../../../../app/markdown/lib/parser/original/code', mocks) as {
	code: CodeParser;
};

type LanguageDefinition = (...args: unknown[]) => unknown;

type Registration = { name: string; definition: LanguageDefinition };

export const createRegister = (): { register: (lang: string) => Promise<void>; registered: Registration[] } => {
	const registered: Registration[] = [];

	const hljsStub = {
		registerLanguage: (name: string, definition: LanguageDefinition) => registered.push({ name, definition }),
		listLanguages: () => registered.map(({ name }) => name),
	};

	const { register } = proxyquire.noCallThru().load('../../../../app/markdown/lib/hljs', {
		'highlight.js/lib/core': { '__esModule': true, 'default': hljsStub, '@noCallThru': true },
	});

	return { register, registered };
};

export const createCodeParserWithFailingHighlighter = (): CodeParser => {
	const hljsStub = {
		listLanguages: () => ['javascript'],
		highlight: () => {
			throw new Error('highlighting failed');
		},
		highlightAuto: (value: string) => ({ language: 'plaintext', value }),
	};

	return (
		proxyquire.noCallThru().load('../../../../app/markdown/lib/parser/original/code', {
			...mocks,
			'../../hljs': { '__esModule': true, 'default': hljsStub, 'register': async () => undefined, '@noCallThru': true },
		}) as { code: CodeParser }
	).code;
};

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
