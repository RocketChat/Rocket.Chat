import { escapeHTML } from '@rocket.chat/tools';
import { expect } from 'chai';
import sinon from 'sinon';

import type { MarkdownOptions, ParsedMessage } from './markdown.mocks';
import {
	Markdown,
	original,
	code,
	filterMarkdown,
	createMarkdownMessageRenderer,
	createMarkdownNotificationRenderer,
	createCodeParserWithFailingHighlighter,
	resetTokenIds,
	markup,
} from './markdown.mocks';

const { bold, inlineCode, anchor, image, blockquote } = markup;

const rootUrl = 'http://localhost:3000/';
const defaultOptions = { supportSchemesForLink: 'http,https', headers: true, rootUrl };

const render = (text: string, options: MarkdownOptions = defaultOptions) =>
	Markdown.mountTokensBack(original({ html: text }, options)).html;
const renderEscaped = (text: string, options: MarkdownOptions = defaultOptions) => render(escapeHTML(text), options);

describe('Markdown entry points', () => {
	beforeEach(resetTokenIds);

	it('should escape HTML before parsing', () => {
		expect(Markdown.parse('<img src=x onerror=alert(1)> *Hello*')).to.equal(`&lt;img src=x onerror=alert(1)&gt; ${bold('Hello')}`);
	});

	it('should keep HTML when parsing unescaped input', () => {
		expect(Markdown.parseNotEscaped('<b>x</b> *Hello*')).to.equal(`<b>x</b> ${bold('Hello')}`);
	});

	it('should leave the tokens unmounted when parsing a message', () => {
		const message = Markdown.parseMessageNotEscaped({ html: '`code`' });

		expect(message.tokens).to.have.lengthOf(1);
		expect(message.tokens?.[0].type).to.equal('inlinecode');
		expect(message.html).to.equal(message.tokens?.[0].token);
	});

	it('should expose the code parser', () => {
		const message = Markdown.code({ html: '`code`' });

		expect(Markdown.mountTokensBack(message).html).to.equal(inlineCode('code'));
	});

	it('should strip the markdown syntax when filtering', () => {
		expect(Markdown.filterMarkdownFromMessage('*Hello* `there`')).to.equal('Hello there');
		expect(filterMarkdown('*Hello* `there`')).to.equal('Hello there');
	});
});

describe('Markdown token restoration', () => {
	beforeEach(resetTokenIds);

	it('should return the message untouched when it has no tokens', () => {
		const message = { html: 'plain text' };

		expect(Markdown.mountTokensBack(message)).to.equal(message);
		expect(message.html).to.equal('plain text');
	});

	it('should restore the plain text representation when useHtml is false', () => {
		const message = Markdown.parseMessageNotEscaped({ html: 'see `code`' });

		expect(Markdown.mountTokensBack(message, false).html).to.equal('see `code`');
	});

	it('should restore tokens that are only revealed by another token', () => {
		const message = {
			html: 'start =!=outer=!=',
			tokens: [
				{ token: '=!=inner=!=', text: '<em>inner</em>' },
				{ token: '=!=outer=!=', text: '<b>=!=inner=!=</b>' },
			],
		};

		expect(Markdown.mountTokensBack(message).html).to.equal('start <b><em>inner</em></b>');
	});

	it('should leave tokens that never appear in the message', () => {
		const message = {
			html: 'start =!=present=!=',
			tokens: [
				{ token: '=!=absent=!=', text: '<em>absent</em>' },
				{ token: '=!=present=!=', text: '<b>present</b>' },
			],
		};

		expect(Markdown.mountTokensBack(message).html).to.equal('start <b>present</b>');
	});

	it('should not treat $ sequences in the token text as replacement patterns', () => {
		const message = { html: '=!=t=!=', tokens: [{ token: '=!=t=!=', text: '$& $1 $$' }] };

		expect(Markdown.mountTokensBack(message).html).to.equal('$& $1 $$');
	});
});

describe('Markdown renderers', () => {
	beforeEach(resetTokenIds);

	const renderMessage = createMarkdownMessageRenderer({
		rootUrl: 'http://localhost:3000/',
		supportSchemesForLink: 'http,https',
		headers: true,
	});

	it('should render markdown of a non-empty message', () => {
		expect(renderMessage({ html: '# Hello' })?.html).to.equal('<h1>Hello</h1>');
	});

	const emptyMessages: (ParsedMessage | undefined)[] = [undefined, { html: '' }, { html: '   \n\t ' }];

	emptyMessages.forEach((message, index) => {
		it(`should return the message as-is when there is nothing to render (case ${index})`, () => {
			expect(renderMessage(message)).to.equal(message);
		});
	});

	it('should strip the markdown syntax when rendering a notification', () => {
		expect(createMarkdownNotificationRenderer()('*Hello* there')).to.equal('Hello there');
	});
});

describe('Original parser', () => {
	beforeEach(resetTokenIds);

	it('should convert every new line to a <br>', () => {
		expect(render('a\nb\nc')).to.equal('a<br>b<br>c');
	});

	it('should not render headings when the option is disabled', () => {
		expect(render('# Hello', { ...defaultOptions, headers: false })).to.equal('# Hello');
	});

	describe('blockquotes', () => {
		it('should render consecutive single-line blockquotes without a line break in between', () => {
			expect(renderEscaped('>a\n>b')).to.equal(`${blockquote('a')}${blockquote('b')}`);
		});

		it('should render a multiline blockquote delimited by >>> and <<<', () => {
			expect(renderEscaped('>>>\nline1\nline2\n<<<')).to.equal(
				blockquote('line1<br>line2<span class="copyonly">&lt;&lt;&lt;</span>', '&gt;&gt;&gt;'),
			);
		});
	});

	describe('links', () => {
		it('should render an internal link without a target', () => {
			expect(render(`[Home](${rootUrl}channel/general)`)).to.equal(anchor(`${rootUrl}channel/general`, 'Home', ''));
			expect(render(`<${rootUrl}channel/general|Home>`)).to.equal(anchor(`${rootUrl}channel/general`, 'Home', ''));
		});

		it('should not render a link whose URL is not parseable', () => {
			expect(render('[Text](http://[)')).to.equal('[Text](http://[)');
			expect(render('<http://[|Text>')).to.equal('<http://[|Text>');
		});

		it('should not render a link whose URL contains another token', () => {
			expect(render('[Text](http://example.com/`code`)')).to.equal(`[Text](http://example.com/${inlineCode('code')})`);
		});

		it('should not render a link whose title holds a disallowed token', () => {
			expect(render('[`code`](http://example.com/)')).to.equal(`[${inlineCode('code')}](http://example.com/)`);
			expect(render('<http://example.com/|`code`>')).to.equal(`<http://example.com/|${inlineCode('code')}>`);
		});

		it('should render a link whose title only looks like a token', () => {
			expect(render('[=!=abcdefghijklmnopq=!=](http://example.com/)')).to.equal(anchor('http://example.com/', '=!=abcdefghijklmnopq=!='));
		});

		it('should only render the schemes it was configured with', () => {
			expect(render('[Text](ftp://example.com/)', { ...defaultOptions, supportSchemesForLink: 'ftp' })).to.equal(
				anchor('ftp://example.com/', 'Text'),
			);
			expect(render('[Text](http://example.com/)', { ...defaultOptions, supportSchemesForLink: 'ftp' })).to.equal(
				'[Text](http://example.com/)',
			);
		});
	});

	describe('images', () => {
		it('should render an external image with target _blank', () => {
			expect(render('![alt](http://example.com/a.png)')).to.equal(image('http://example.com/a.png', 'alt'));
		});

		it('should render an internal image without a target', () => {
			expect(render(`![alt](${rootUrl}a.png)`)).to.equal(image(`${rootUrl}a.png`, 'alt', ''));
		});

		it('should not render an image whose URL is not parseable', () => {
			expect(render('![alt](http://[)')).to.equal('![alt](http://[)');
		});

		it('should not render an image whose title holds a disallowed token', () => {
			expect(render('![`code`](http://example.com/a.png)')).to.equal(`![${inlineCode('code')}](http://example.com/a.png)`);
		});
	});
});

describe('Code parser', () => {
	beforeEach(resetTokenIds);

	it('should leave a message without code untouched', () => {
		expect(code({ html: 'no code here' }).tokens).to.be.undefined;
		expect(code({}).html).to.be.undefined;
	});

	it('should close an unclosed code block in both html and msg', () => {
		const message: ParsedMessage = { html: '```code', msg: '```code' };

		code(message);

		expect(message.msg).to.equal('```code\n```');
		expect(message.html).to.equal(message.tokens?.[0].token);
	});

	it('should restore the original fenced block when tokens are mounted back as text', () => {
		const message = original({ html: '```\ncode\n```' }, defaultOptions);

		expect(Markdown.mountTokensBack(message, false).html).to.equal('```\ncode\n```');
	});

	it('should fall back to automatic highlighting when highlighting the explicit language fails', () => {
		const consoleError = sinon.stub(console, 'error');

		try {
			const message = createCodeParserWithFailingHighlighter()({ html: '```javascript\nvar a;\n```' });

			expect(message.tokens?.[0].text).to.contain("code-colors hljs plaintext'");
			expect(consoleError.calledOnce).to.be.true;
		} finally {
			consoleError.restore();
		}
	});
});
