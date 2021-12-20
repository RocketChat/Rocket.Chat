import { addAsToken, isToken, validateAllowedTokens } from './token';

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

const endsWithWhitespace = (text) => text.substring(text.length - 1).match(/\s/);

const getParseableMarkersCount = (start, end) => {
	const usableMarkers = start.length > 1 ? 2 : 1;
	return end.length - usableMarkers >= 0 ? usableMarkers : 1;
};

const getTextWrapper = (marker, tagName) => (textPrepend, wrappedText, textAppend) =>
	`${ textPrepend }<span class="copyonly">${ marker }</span><${ tagName }>${ wrappedText }</${ tagName }><span class="copyonly">${ marker }</span>${ textAppend }`;

const getRegexReplacer = (replaceFunction, getRegex) => (marker, tagName) => {
	const wrapper = getTextWrapper(marker, tagName);
	return (msg) => msg.replace(
		getRegex(marker),
		(...args) => replaceFunction(wrapper, ...args),
	);
};

const getParserWithCustomMarker = getRegexReplacer(
	(wrapper, match, p1, p2, p3) => {
		if (endsWithWhitespace(p2)) {
			return match;
		}
		const finalMarkerCount = getParseableMarkersCount(p1, p3);
		return wrapper(p1.substring(finalMarkerCount), p2, p3.substring(finalMarkerCount));
	},
	(marker) => new RegExp(`(\\${ marker }+(?!\\s))([^\\${ marker }\\r\\n]+)(\\${ marker }+)`, 'gm'),
);

const parseBold = getParserWithCustomMarker('*', 'strong');

const parseStrike = getParserWithCustomMarker('~', 'strike');

const parseItalic = getRegexReplacer(
	(wrapper, match, p1, p2, p3, p4, p5) => {
		if (p1 || p5 || endsWithWhitespace(p3)) {
			return match;
		}

		const finalMarkerCount = getParseableMarkersCount(p2, p4);
		return wrapper(p2.substring(finalMarkerCount), p3, p4.substring(finalMarkerCount));
	},
	() => new RegExp('([^\\r\\n\\s~*_]){0,1}(\\_+(?!\\s))([^\\_\\r\\n]+)(\\_+)([^\\r\\n\\s]){0,1}', 'gm'),
)('_', 'em');

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
	msg = parseBold(msg);

	// Support _text_ to make italics
	msg = parseItalic(msg);

	// // Support ~text~ to strike through text
	msg = parseStrike(msg);

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
		if (isToken(title) && !validateAllowedTokens(message, title, ['bold', 'italic', 'strike'])) {
			return match;
		}
		url = encodeURI(url);

		const target = url.indexOf(rootUrl) === 0 ? '' : '_blank';
		return addAsToken(message, `<a data-title="${ url }" href="${ url }" title="${ title }" target="${ target }" rel="noopener noreferrer"><div class="inline-image" style="background-image: url(${ url });"></div></a>`, 'link');
	});

	// Support [Text](http://link)
	msg = msg.replace(new RegExp(`\\[([^\\]]+)\\]\\(((?:${ schemes }):\\/\\/[^\\s]+)\\)`, 'gm'), (match, title, url) => {
		if (!validateUrl(url, message)) {
			return match;
		}
		if (isToken(title) && !validateAllowedTokens(message, title, ['bold', 'italic', 'strike'])) {
			return match;
		}
		const target = url.indexOf(rootUrl) === 0 ? '' : '_blank';
		title = title.replace(/&amp;/g, '&');

		const escapedUrl = encodeURI(url);

		return addAsToken(message, `<a data-title="${ escapedUrl }" href="${ escapedUrl }" target="${ target }" rel="noopener noreferrer">${ title }</a>`, 'link');
	});

	// Support <http://link|Text>
	msg = msg.replace(new RegExp(`(?:<|&lt;)((?:${ schemes }):\\\/\\\/[^\\|]+)\\|(.+?)(?=>|&gt;)(?:>|&gt;)`, 'gm'), (match, url, title) => {
		if (!validateUrl(url, message)) {
			return match;
		}
		if (isToken(title) && !validateAllowedTokens(message, title, ['bold', 'italic', 'strike'])) {
			return match;
		}
		url = encodeURI(url);
		const target = url.indexOf(rootUrl) === 0 ? '' : '_blank';
		return addAsToken(message, `<a data-title="${ url }" href="${ url }" target="${ target }" rel="noopener noreferrer">${ title }</a>`, 'link');
	});
	return msg;
};

export const markdown = (message, options) => {
	message.html = parseNotEscaped(message, options);
	return message;
};
