import { Random } from 'meteor/random';
import { _ } from 'meteor/underscore';
import hljs from 'highlight.js';
import _marked from 'marked';

const renderer = new _marked.Renderer();

let msg = null;

renderer.code = function(code, lang, escaped) {
	if (this.options.highlight) {
		var out = this.options.highlight(code, lang);
		if (out != null && out !== code) {
			escaped = true;
			code = out;
		}
	}

	let text = null;

	if (!lang) {
		text = '<pre><code class="code-colors hljs">'
			+ (escaped ? code : escape(code, true))
			+ '</code></pre>';
	} else {
		text = '<pre><code class="code-colors hljs '
			+ escape(lang, true)
			+ '">'
			+ (escaped ? code : escape(code, true))
			+ '</code></pre>';
	}

	if (_.isString(msg)) {
		return text;
	}

	const token = `=&=${Random.id()}=&=`;
	msg.tokens.push({
		highlight: true,
		token,
		text
	});
	return token;
};

renderer.codespan = function(text) {
	return `<code class="code-colors inline">${text}</code>`;
};

renderer.blockquote = function(quote) {
	return `<blockquote class="background-transparent-darker-before">${quote}</blockquote>`;
};

_marked.setOptions({
	gfm: RocketChat.settings.get('Markdown_Marked_GFM'),
	tables: RocketChat.settings.get('Markdown_Marked_Tables'),
	breaks: RocketChat.settings.get('Markdown_Marked_Breaks'),
	pedantic: RocketChat.settings.get('Markdown_Marked_Pedantic'),
	smartLists: RocketChat.settings.get('Markdown_Marked_SmartLists'),
	smartypants: RocketChat.settings.get('Markdown_Marked_Smartypants'),
	sanitize: false,
	renderer,
	highlight: function(code, lang) {
		code = _.unescapeHTML(code);
		if (hljs.listLanguages().includes(lang)) {
			return hljs.highlight(lang, code).value;
		}
		return hljs.highlightAuto(code).value;
	}
});

export const marked = (message) => {
	msg = message;

	let text = msg;
	if (!_.isString(msg)) {
		if (msg && _.trim(msg.html)) {
			text = msg.html;
		} else {
			return msg;
		}
	}

	if (!msg.tokens) {
		msg.tokens = [];
	}

	text = _marked(text.replace(/&gt;/g, '>')).replace(/=&amp;=/g, '=&=');

	if (!_.isString(msg)) {
		msg.html = text;
	} else {
		msg = text;
	}

	return msg;
};
