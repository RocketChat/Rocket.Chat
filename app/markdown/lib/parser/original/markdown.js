/*
 * Markdown is a named function that will parse markdown syntax
 * @param {String} msg - The message html
 */
import { Random } from 'meteor/random';

const addAsToken = (message, html) => {
	const token = `=!=${ Random.id() }=!=`;
	message.tokens.push({
		token,
		text: html,
	});

	return token;
};

const validateUrl = (url, message) => {
	// Don't render markdown inside links
	if (message?.tokens?.some((token) => url.includes(token.token))) {
		return false;
	}

	// Valid urls don't contain whitespaces
	if (/\s/.test(url.trim())) {
		return false;
	}

	try {
		new URL(url);
		return true;
	} catch (e) {
		return false;
	}
};

const parseNotEscaped = (message, {
	supportSchemesForLink,
	headers,
	rootUrl,
}) => {
	let msg = message.html;
	if (!message.tokens) {
		message.tokens = [];
	}

	const schemes = (supportSchemesForLink || '').split(',').join('|');

	if (headers) {
		// Support # Text for h1
		msg = msg.replace(/^# (([\S\w\d-_\/\*\.,\\][ \u00a0\u1680\u180e\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]?)+)/gm, '<h1>$1</h1>');

		// Support # Text for h2
		msg = msg.replace(/^## (([\S\w\d-_\/\*\.,\\][ \u00a0\u1680\u180e\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]?)+)/gm, '<h2>$1</h2>');

		// Support # Text for h3
		msg = msg.replace(/^### (([\S\w\d-_\/\*\.,\\][ \u00a0\u1680\u180e\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]?)+)/gm, '<h3>$1</h3>');

		// Support # Text for h4
		msg = msg.replace(/^#### (([\S\w\d-_\/\*\.,\\][ \u00a0\u1680\u180e\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]?)+)/gm, '<h4>$1</h4>');
	}

	// Support *text* to make bold
	msg = msg.replace(/(|&gt;|[ >_~`])\*{1,2}([^\*\r\n]+)\*{1,2}([<_~`]|\B|\b|$)/gm, '$1<span class="copyonly">*</span><strong>$2</strong><span class="copyonly">*</span>$3');

	// Support _text_ to make italics
	msg = msg.replace(/(^|&gt;|[ >*~`])\_{1,2}([^\_\r\n]+)\_{1,2}([<*~`]|\B|\b|$)/gm, '$1<span class="copyonly">_</span><em>$2</em><span class="copyonly">_</span>$3');

	// Support ~text~ to strike through text
	msg = msg.replace(/(^|&gt;|[ >_*`])\~{1,2}([^~\r\n]+)\~{1,2}([<_*`]|\B|\b|$)/gm, '$1<span class="copyonly">~</span><strike>$2</strike><span class="copyonly">~</span>$3');

	// Support for block quote
	// >>>
	// Text
	// <<<
	msg = msg.replace(/(?:&gt;){3}\n+([\s\S]*?)\n+(?:&lt;){3}/g, '<blockquote class="background-transparent-darker-before"><span class="copyonly">&gt;&gt;&gt;</span>$1<span class="copyonly">&lt;&lt;&lt;</span></blockquote>');

	// Support >Text for quote
	msg = msg.replace(/^&gt;(.*)$/gm, '<blockquote class="background-transparent-darker-before"><span class="copyonly">&gt;</span>$1</blockquote>');

	// Remove white-space around blockquote (prevent <br>). Because blockquote is block element.
	msg = msg.replace(/\s*<blockquote class="background-transparent-darker-before">/gm, '<blockquote class="background-transparent-darker-before">');
	msg = msg.replace(/<\/blockquote>\s*/gm, '</blockquote>');

	// Remove new-line between blockquotes.
	msg = msg.replace(/<\/blockquote>\n<blockquote/gm, '</blockquote><blockquote');

	// Support ![alt text](http://image url)
	msg = msg.replace(new RegExp(`!\\[([^\\]]+)\\]\\(((?:${ schemes }):\\/\\/[^\\s]+)\\)`, 'gm'), (match, title, url) => {
		if (!validateUrl(url, message)) {
			return match;
		}
		url = encodeURI(url);

		const target = url.indexOf(rootUrl) === 0 ? '' : '_blank';
		return addAsToken(message, `<a href="${ url }" title="${ title }" target="${ target }" rel="noopener noreferrer"><div class="inline-image" style="background-image: url(${ url });"></div></a>`);
	});

	// Support [Text](http://link)
	msg = msg.replace(new RegExp(`\\[([^\\]]+)\\]\\(((?:${ schemes }):\\/\\/[^\\s]+)\\)`, 'gm'), (match, title, url) => {
		if (!validateUrl(url, message)) {
			return match;
		}
		const target = url.indexOf(rootUrl) === 0 ? '' : '_blank';
		title = title.replace(/&amp;/g, '&');

		const escapedUrl = encodeURI(url);

		return addAsToken(message, `<a href="${ escapedUrl }" target="${ target }" rel="noopener noreferrer">${ title }</a>`);
	});

	// Support <http://link|Text>
	msg = msg.replace(new RegExp(`(?:<|&lt;)((?:${ schemes }):\\\/\\\/[^\\|]+)\\|(.+?)(?=>|&gt;)(?:>|&gt;)`, 'gm'), (match, url, title) => {
		if (!validateUrl(url, message)) {
			return match;
		}
		url =  /\%/i.test(url) ? url : encodeURI(url);
		const target = url.indexOf(rootUrl) === 0 ? '' : '_blank';
		return addAsToken(message, `<a href="${ url }" target="${ target }" rel="noopener noreferrer">${ title }</a>`);
	});
	return msg;
};

export const markdown = (message, options) => {
	message.html = parseNotEscaped(message, options);
	return message;
};
