import { RocketChat } from 'meteor/rocketchat:lib';
import { Random } from 'meteor/random';
import _ from 'underscore';
import s from 'underscore.string';
import hljs from 'highlight.js';
import _marked from 'marked';

const renderer = new _marked.Renderer();

let msg = null;

renderer.code = function(code, lang, escaped) {
	if (this.options.highlight) {
		const out = this.options.highlight(code, lang);
		if (out != null && out !== code) {
			escaped = true;
			code = out;
		}
	}

	let text = null;

	if (!lang) {
		text = `<pre><code class="code-colors hljs">${ (escaped ? code : s.escapeHTML(code, true)) }</code></pre>`;
	} else {
		text = `<pre><code class="code-colors hljs ${ escape(lang, true) }">${ (escaped ? code : s.escapeHTML(code, true)) }</code></pre>`;
	}

	if (_.isString(msg)) {
		return text;
	}

	const token = `=!=${ Random.id() }=!=`;
	msg.tokens.push({
		highlight: true,
		token,
		text
	});

	return token;
};

renderer.codespan = function(text) {
	text = `<code class="code-colors inline">${ text }</code>`;
	if (_.isString(msg)) {
		return text;
	}

	const token = `=!=${ Random.id() }=!=`;
	msg.tokens.push({
		token,
		text
	});

	return token;
};

renderer.blockquote = function(quote) {
	return `<blockquote class="background-transparent-darker-before">${ quote }</blockquote>`;
};

const highlight = function(code, lang) {
	if (!lang) {
		return code;
	}
	try {
		return hljs.highlight(lang, code).value;
	} catch (e) {
		// Unknown language
		return code;
	}
};

let gfm = null;
let tables = null;
let breaks = null;
let pedantic = null;
let smartLists = null;
let smartypants = null;

export const marked = (message) => {
	msg = message;

	if (!msg.tokens) {
		msg.tokens = [];
	}

	if (gfm == null) { gfm = RocketChat.settings.get('Markdown_Marked_GFM'); }
	if (tables == null) { tables = RocketChat.settings.get('Markdown_Marked_Tables'); }
	if (breaks == null) { breaks = RocketChat.settings.get('Markdown_Marked_Breaks'); }
	if (pedantic == null) { pedantic = RocketChat.settings.get('Markdown_Marked_Pedantic'); }
	if (smartLists == null) { smartLists = RocketChat.settings.get('Markdown_Marked_SmartLists'); }
	if (smartypants == null) { smartypants = RocketChat.settings.get('Markdown_Marked_Smartypants'); }

	msg.html = _marked(s.unescapeHTML(msg.html), {
		gfm,
		tables,
		breaks,
		pedantic,
		smartLists,
		smartypants,
		renderer,
		sanitize: true,
		highlight
	});

	return msg;
};
