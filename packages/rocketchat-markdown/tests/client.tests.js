/* eslint-env mocha */
import 'babel-polyfill';
import assert from 'assert';
import './client.mocks.js';
import {original} from '../parser/original/original';
// import {marked} from '../parser/marked/marked';

const wrapper = (text, tag) => `<span class="copyonly">${ tag }</span>${ text }<span class="copyonly">${ tag }</span>`;
const boldWrapper = text => wrapper(`<strong>${ text }</strong>`, '*');
const italicWrapper = text => wrapper(`<em>${ text }</em>`, '_');
const strikeWrapper = text => wrapper(`<strike>${ text }</strike>`, '~');
const headerWrapper = (text, level) => `<h${ level }>${ text }</h${ level }>`;
const quoteWrapper = text => `<blockquote class="background-transparent-darker-before"><span class="copyonly">&gt;</span>${ text }</blockquote>`;
const linkWrapped = (link, title) => `<a href="${ link }" target="_blank" rel="noopener noreferrer">${ title }</a>`;
const inlinecodeWrapper = text => wrapper(`<span><code class="code-colors inline">${ text }</code></span>`, '`');
const codeWrapper = (text, lang) => `<pre><code class='code-colors hljs ${ lang }'><span class='copyonly'>\`\`\`<br></span>${ text }<span class='copyonly'><br>\`\`\`</span></code></pre>`;

const bold = {
	'*Hello*': boldWrapper('Hello'),
	'**Hello**': boldWrapper('Hello'),
	'**Hello*': boldWrapper('Hello'),
	'*Hello**': boldWrapper('Hello'),
	'Hello': 'Hello',
	'*Hello': '*Hello',
	'Hello*': 'Hello*',
	'He*llo': 'He*llo',
	'***Hello***': '***Hello***',
	'***Hello**': '***Hello**',
	'*Hello* this is dog': `${ boldWrapper('Hello') } this is dog`,
	'Rocket cat says *Hello*': `Rocket cat says ${ boldWrapper('Hello') }`,
	'He said *Hello* to her': `He said ${ boldWrapper('Hello') } to her`,
	'**Hello** this is dog': `${ boldWrapper('Hello') } this is dog`,
	'Rocket cat says **Hello**': `Rocket cat says ${ boldWrapper('Hello') }`,
	'He said **Hello** to her': `He said ${ boldWrapper('Hello') } to her`
};

const italic = {
	'_Hello_': italicWrapper('Hello'),
	'__Hello__': italicWrapper('Hello'),
	'__Hello_': italicWrapper('Hello'),
	'_Hello__': italicWrapper('Hello'),
	'Hello': 'Hello',
	'_Hello': '_Hello',
	'Hello_': 'Hello_',
	'He_llo': 'He_llo',
	'___Hello___': '___Hello___',
	'___Hello__': '___Hello__',
	'_Hello_ this is dog': `${ italicWrapper('Hello') } this is dog`,
	'Rocket cat says _Hello_': `Rocket cat says ${ italicWrapper('Hello') }`,
	'He said _Hello_ to her': `He said ${ italicWrapper('Hello') } to her`,
	'__Hello__ this is dog': `${ italicWrapper('Hello') } this is dog`,
	'Rocket cat says __Hello__': `Rocket cat says ${ italicWrapper('Hello') }`,
	'He said __Hello__ to her': `He said ${ italicWrapper('Hello') } to her`
};

const strike = {
	'~Hello~': strikeWrapper('Hello'),
	'~~Hello~~': strikeWrapper('Hello'),
	'~~Hello~': strikeWrapper('Hello'),
	'~Hello~~': strikeWrapper('Hello'),
	'Hello': 'Hello',
	'~Hello': '~Hello',
	'Hello~': 'Hello~',
	'He~llo': 'He~llo',
	'~~~Hello~~~': '~~~Hello~~~',
	'~~~Hello~~': '~~~Hello~~',
	'~Hello~ this is dog': `${ strikeWrapper('Hello') } this is dog`,
	'Rocket cat says ~Hello~': `Rocket cat says ${ strikeWrapper('Hello') }`,
	'He said ~Hello~ to her': `He said ${ strikeWrapper('Hello') } to her`,
	'~~Hello~~ this is dog': `${ strikeWrapper('Hello') } this is dog`,
	'Rocket cat says ~~Hello~~': `Rocket cat says ${ strikeWrapper('Hello') }`,
	'He said ~~Hello~~ to her': `He said ${ strikeWrapper('Hello') } to her`
};

const headersLevel1 = {
	'# Hello': headerWrapper('Hello', 1),
	'# Rocket.Cat': headerWrapper('Rocket.Cat', 1),
	'# Hi': headerWrapper('Hi', 1),
	'# Hello this is dog': headerWrapper('Hello this is dog', 1),
	'# Rocket cat says Hello': headerWrapper('Rocket cat says Hello', 1),
	'# He said Hello to her': headerWrapper('He said Hello to her', 1),
	'#Hello': '#Hello',
	'#Hello#': '#Hello#',
	'He#llo': 'He#llo'
};

const headersLevel2 = {
	'## Hello': headerWrapper('Hello', 2),
	'## Rocket.Cat': headerWrapper('Rocket.Cat', 2),
	'## Hi': headerWrapper('Hi', 2),
	'## Hello this is dog': headerWrapper('Hello this is dog', 2),
	'## Rocket cat says Hello': headerWrapper('Rocket cat says Hello', 2),
	'## He said Hello to her': headerWrapper('He said Hello to her', 2),
	'##Hello': '##Hello',
	'##Hello##': '##Hello##',
	'He##llo': 'He##llo'
};

const headersLevel3 = {
	'### Hello': headerWrapper('Hello', 3),
	'### Rocket.Cat': headerWrapper('Rocket.Cat', 3),
	'### Hi': headerWrapper('Hi', 3),
	'### Hello this is dog': headerWrapper('Hello this is dog', 3),
	'### Rocket cat says Hello': headerWrapper('Rocket cat says Hello', 3),
	'### He said Hello to her': headerWrapper('He said Hello to her', 3),
	'###Hello': '###Hello',
	'###Hello###': '###Hello###',
	'He###llo': 'He###llo'
};

const headersLevel4 = {
	'#### Hello': headerWrapper('Hello', 4),
	'#### Rocket.Cat': headerWrapper('Rocket.Cat', 4),
	'#### Hi': headerWrapper('Hi', 4),
	'#### Hello this is dog': headerWrapper('Hello this is dog', 4),
	'#### Rocket cat says Hello': headerWrapper('Rocket cat says Hello', 4),
	'#### He said Hello to her': headerWrapper('He said Hello to her', 4),
	'####Hello': '####Hello',
	'####Hello####': '####Hello####',
	'He####llo': 'He####llo'
};

const quote = {
	'&gt;Hello': quoteWrapper('Hello'),
	'&gt;Rocket.Cat': quoteWrapper('Rocket.Cat'),
	'&gt;Hi': quoteWrapper('Hi'),
	'&gt; Hello this is dog': quoteWrapper(' Hello this is dog'),
	'&gt; Rocket cat says Hello': quoteWrapper(' Rocket cat says Hello'),
	'&gt; He said Hello to her': quoteWrapper(' He said Hello to her'),
	'&gt; He said Hello to her ': quoteWrapper(' He said Hello to her '),
	'&lt;Hello': '&lt;Hello',
	'&lt;Rocket.Cat&gt;': '&lt;Rocket.Cat&gt;',
	' &gt;Hi': ' &gt;Hi',
	'Hello &gt; this is dog': 'Hello &gt; this is dog',
	'Roc&gt;ket cat says Hello': 'Roc&gt;ket cat says Hello',
	'He said Hello to her&gt;': 'He said Hello to her&gt;',
	'>Hello': '>Hello',
	'>Rocket.Cat': '>Rocket.Cat',
	'>Hi': '>Hi',
	'> Hello this is dog': '> Hello this is dog',
	'> Rocket cat says Hello': '> Rocket cat says Hello',
	'> He said Hello to her': '> He said Hello to her',
	'<Hello': '<Hello',
	'<Rocket.Cat>': '<Rocket.Cat>',
	' >Hi': ' >Hi',
	'Hello > this is dog': 'Hello > this is dog',
	'Roc>ket cat says Hello': 'Roc>ket cat says Hello',
	'He said Hello to her>': 'He said Hello to her>'
};

const link = {
	'&lt;http://link|Text&gt;': linkWrapped('http://link', 'Text'),
	'&lt;https://open.rocket.chat/|Open Site For Rocket.Chat&gt;': linkWrapped('https://open.rocket.chat/', 'Open Site For Rocket.Chat'),
	'&lt;https://open.rocket.chat/ | Open Site For Rocket.Chat&gt;': linkWrapped('https://open.rocket.chat/ ', ' Open Site For Rocket.Chat'),
	'&lt;https://rocket.chat/|Rocket.Chat Site&gt;': linkWrapped('https://rocket.chat/', 'Rocket.Chat Site'),
	'&lt;https://rocket.chat/docs/developer-guides/testing/#testing|Testing Entry on Rocket.Chat Docs Site&gt;': linkWrapped('https://rocket.chat/docs/developer-guides/testing/#testing', 'Testing Entry on Rocket.Chat Docs Site'),
	'&lt;http://linkText&gt;': '&lt;http://linkText&gt;',
	'&lt;https:open.rocket.chat/ | Open Site For Rocket.Chat&gt;': '&lt;https:open.rocket.chat/ | Open Site For Rocket.Chat&gt;',
	'https://open.rocket.chat/|Open Site For Rocket.Chat': 'https://open.rocket.chat/|Open Site For Rocket.Chat',
	'&lt;www.open.rocket.chat/|Open Site For Rocket.Chat&gt;': '&lt;www.open.rocket.chat/|Open Site For Rocket.Chat&gt;',
	'&lt;htps://rocket.chat/|Rocket.Chat Site&gt;': '&lt;htps://rocket.chat/|Rocket.Chat Site&gt;',
	'&lt;ttps://rocket.chat/|Rocket.Chat Site&gt;': '&lt;ttps://rocket.chat/|Rocket.Chat Site&gt;',
	'&lt;tps://rocket.chat/|Rocket.Chat Site&gt;': '&lt;tps://rocket.chat/|Rocket.Chat Site&gt;',
	'&lt;open.rocket.chat/|Open Site For Rocket.Chat&gt;': '&lt;open.rocket.chat/|Open Site For Rocket.Chat&gt;',
	'&lt;htts://rocket.chat/docs/developer-guides/testing/#testing|Testing Entry on Rocket.Chat Docs Site&gt;': '&lt;htts://rocket.chat/docs/developer-guides/testing/#testing|Testing Entry on Rocket.Chat Docs Site&gt;',

	'<http://link|Text>': linkWrapped('http://link', 'Text'),
	'<https://open.rocket.chat/|Open Site For Rocket.Chat>': linkWrapped('https://open.rocket.chat/', 'Open Site For Rocket.Chat'),
	'<https://open.rocket.chat/ | Open Site For Rocket.Chat>': linkWrapped('https://open.rocket.chat/ ', ' Open Site For Rocket.Chat'),
	'<https://rocket.chat/|Rocket.Chat Site>': linkWrapped('https://rocket.chat/', 'Rocket.Chat Site'),
	'<https://rocket.chat/docs/developer-guides/testing/#testing|Testing Entry on Rocket.Chat Docs Site>': linkWrapped('https://rocket.chat/docs/developer-guides/testing/#testing', 'Testing Entry on Rocket.Chat Docs Site'),
	'<http://linkText>': '<http://linkText>',
	'<https:open.rocket.chat/ | Open Site For Rocket.Chat>': '<https:open.rocket.chat/ | Open Site For Rocket.Chat>',
	'<www.open.rocket.chat/|Open Site For Rocket.Chat>': '<www.open.rocket.chat/|Open Site For Rocket.Chat>',
	'<htps://rocket.chat/|Rocket.Chat Site>': '<htps://rocket.chat/|Rocket.Chat Site>',
	'<ttps://rocket.chat/|Rocket.Chat Site>': '<ttps://rocket.chat/|Rocket.Chat Site>',
	'<tps://rocket.chat/|Rocket.Chat Site>': '<tps://rocket.chat/|Rocket.Chat Site>',
	'<open.rocket.chat/|Open Site For Rocket.Chat>': '<open.rocket.chat/|Open Site For Rocket.Chat>',
	'<htts://rocket.chat/docs/developer-guides/testing/#testing|Testing Entry on Rocket.Chat Docs Site>': '<htts://rocket.chat/docs/developer-guides/testing/#testing|Testing Entry on Rocket.Chat Docs Site>',

	'[Text](http://link)': linkWrapped('http://link', 'Text'),
	'[Open Site For Rocket.Chat](https://open.rocket.chat/)': linkWrapped('https://open.rocket.chat/', 'Open Site For Rocket.Chat'),
	'[ Open Site For Rocket.Chat](https://open.rocket.chat/ )': linkWrapped('https://open.rocket.chat/ ', ' Open Site For Rocket.Chat'),
	'[Rocket.Chat Site](https://rocket.chat/)': linkWrapped('https://rocket.chat/', 'Rocket.Chat Site'),
	'[Testing Entry on Rocket.Chat Docs Site](https://rocket.chat/docs/developer-guides/testing/#testing)': linkWrapped('https://rocket.chat/docs/developer-guides/testing/#testing', 'Testing Entry on Rocket.Chat Docs Site'),
	'[](http://linkText)': '[](http://linkText)',
	'[text]': '[text]',
	'[Open Site For Rocket.Chat](https:open.rocket.chat/)': '[Open Site For Rocket.Chat](https:open.rocket.chat/)',
	'[Open Site For Rocket.Chat](www.open.rocket.chat/)': '[Open Site For Rocket.Chat](www.open.rocket.chat/)',
	'[Rocket.Chat Site](htps://rocket.chat/)': '[Rocket.Chat Site](htps://rocket.chat/)',
	'[Rocket.Chat Site](ttps://rocket.chat/)': '[Rocket.Chat Site](ttps://rocket.chat/)',
	'[Rocket.Chat Site](tps://rocket.chat/)': '[Rocket.Chat Site](tps://rocket.chat/)',
	'[Open Site For Rocket.Chat](open.rocket.chat/)': '[Open Site For Rocket.Chat](open.rocket.chat/)',
	'[Testing Entry on Rocket.Chat Docs Site](htts://rocket.chat/docs/developer-guides/testing/#testing)': '[Testing Entry on Rocket.Chat Docs Site](htts://rocket.chat/docs/developer-guides/testing/#testing)'
};

const inlinecode = {
	'`code`': inlinecodeWrapper('code'),
	'`code` begin': `${ inlinecodeWrapper('code') } begin`,
	'End `code`': `End ${ inlinecodeWrapper('code') }`,
	'Middle `code` middle': `Middle ${ inlinecodeWrapper('code') } middle`,
	'`code`begin': `${ inlinecodeWrapper('code') }begin`,
	'End`code`': 'End`code`',
	'Middle`code`middle': 'Middle`code`middle'
};

const code = {
	'```code```': codeWrapper('<span class="hljs-keyword">code</span>', 'clean'),
	'```code': codeWrapper('<span class="hljs-selector-tag">code</span>\n', 'stylus'),
	'```code\n': codeWrapper('<span class="hljs-selector-tag">code</span>\n\n', 'stylus'),
	'```\ncode\n```': codeWrapper('\n<span class="hljs-selector-tag">code</span>\n', 'stylus'),
	'```code\n```': codeWrapper('<span class="hljs-selector-tag">code</span>\n', 'stylus'),
	'```\ncode```': codeWrapper('\n<span class="hljs-keyword">code</span>', 'clean'),
	'```javascript\nvar a = \'log\';\nconsole.log(a);```': codeWrapper('<span class="hljs-keyword">var</span> a = <span class="hljs-string">\'log\'</span>;\n<span class="hljs-built_in">console</span>.log(a);', 'javascript'),
	'```*code*```': codeWrapper('*<span class="hljs-meta">code</span>*', 'armasm'),
	'```**code**```': codeWrapper('**<span class="hljs-meta">code</span>**', 'armasm'),
	'```_code_```': codeWrapper('<span class="hljs-variable">_code_</span>', 'sqf'),
	'```__code__```': codeWrapper('<span class="hljs-strong">__code__</span>', 'markdown')
};

const defaultObjectTest = (result, object, objectKey) => {
	return assert.equal(result.html, object[objectKey]);
};

const testObject = (object, parser = original, test = defaultObjectTest) => {
	Object.keys(object).forEach((objectKey) => {
		describe(objectKey, () => {
			const result = parser({html: objectKey});
			result.tokens.forEach((token) => {
				result.html = result.html.replace(token.token, token.text);
			});
			it(`should be equal to ${ object[objectKey] }`, () => {
				test(result, object, objectKey);
			});
		});
	});
};

describe('Original', function() {
	describe('Bold', () => testObject(bold));

	describe('Italic', () => testObject(italic));

	describe('Strike', () => testObject(strike));

	describe('Headers', () => {
		describe('Level 1', () => testObject(headersLevel1));

		describe('Level 2', () => testObject(headersLevel2));

		describe('Level 3', () => testObject(headersLevel3));

		describe('Level 4', () => testObject(headersLevel4));
	});

	describe('Quote', () => testObject(quote));

	describe('Link', () => testObject(link));

	describe('Inline Code', () => testObject(inlinecode));

	describe('Code', () => testObject(code));
});

// describe.only('Marked', function() {
// 	describe('Bold', () => testObject(bold, marked));

// 	describe('Italic', () => testObject(italic, marked));

// 	describe('Strike', () => testObject(strike, marked));

// 	describe('Headers', () => {
// 		describe('Level 1', () => testObject(headersLevel1, marked));

// 		describe('Level 2', () => testObject(headersLevel2, marked));

// 		describe('Level 3', () => testObject(headersLevel3, marked));

// 		describe('Level 4', () => testObject(headersLevel4, marked));
// 	});

// 	describe('Quote', () => testObject(quote, marked));
// });
