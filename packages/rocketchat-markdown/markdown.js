/*
 * Markdown is a named function that will parse markdown syntax
 * @param {Object} message - The message object
 */

class MarkdownClass {
	parse(text) {
		return this.parseNotEscaped(_.escapeHTML(text));
	}

	parseNotEscaped(msg, message) {
		if (message && message.tokens == null) {
			message.tokens = [];
		}

		const schemes = RocketChat.settings.get('Markdown_SupportSchemesForLink').split(',').join('|');

		if (RocketChat.settings.get('Markdown_Headers')) {
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
		msg = msg.replace(/(^|&gt;|[ >_~`])\*{1,2}([^\*\r\n]+)\*{1,2}([<_~`]|\B|\b|$)/gm, '$1<span class="copyonly">*</span><strong>$2</strong><span class="copyonly">*</span>$3');

		// Support _text_ to make italics
		msg = msg.replace(/(^|&gt;|[ >*~`])\_([^\_\r\n]+)\_([<*~`]|\B|\b|$)/gm, '$1<span class="copyonly">_</span><em>$2</em><span class="copyonly">_</span>$3');

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
		msg = msg.replace(new RegExp(`!\\[([^\\]]+)\\]\\(((?:${ schemes }):\\/\\/[^\\)]+)\\)`, 'gm'), function(match, title, url) {
			const target = url.indexOf(Meteor.absoluteUrl()) === 0 ? '' : '_blank';
			const html = `<a href="${ _.escapeHTML(url) }" title="${ _.escapeHTML(title) }" target="${ _.escapeHTML(target) }" rel="noopener noreferrer"><div class="inline-image" style="background-image: url(${ _.escapeHTML(url) });"></div></a>`;

			if (message && message.tokens) {
				const token = `=!=${ Random.id() }=!=`;

				message.tokens.push({
					token,
					text: html
				});

				return token;
			}

			return html;
		});

		// Support [Text](http://link)
		msg = msg.replace(new RegExp(`\\[([^\\]]+)\\]\\(((?:${ schemes }):\\/\\/[^\\)]+)\\)`, 'gm'), function(match, title, url) {
			const target = url.indexOf(Meteor.absoluteUrl()) === 0 ? '' : '_blank';
			return `<a href="${ _.escapeHTML(url) }" target="${ _.escapeHTML(target) }" rel="noopener noreferrer">${ _.escapeHTML(title) }</a>`;
		});

		// Support <http://link|Text>
		msg = msg.replace(new RegExp(`(?:<|&lt;)((?:${ schemes }):\\/\\/[^\\|]+)\\|(.+?)(?=>|&gt;)(?:>|&gt;)`, 'gm'), (match, url, title) => {
			const target = url.indexOf(Meteor.absoluteUrl()) === 0 ? '' : '_blank';
			return `<a href="${ _.escapeHTML(url) }" target="${ _.escapeHTML(target) }" rel="noopener noreferrer">${ _.escapeHTML(title) }</a>`;
		});

		if (typeof window !== 'undefined' && window !== null ? window.rocketDebug : undefined) { console.log('Markdown', msg); }

		return msg;
	}
}

const Markdown = new MarkdownClass;
RocketChat.Markdown = Markdown;

// renderMessage already did html escape
const MarkdownMessage = (message) => {
	if (_.trim(message != null ? message.html : undefined)) {
		message.html = Markdown.parseNotEscaped(message.html, message);
	}

	return message;
};

RocketChat.callbacks.add('renderMessage', MarkdownMessage, RocketChat.callbacks.priority.HIGH, 'markdown');

if (Meteor.isClient) {
	Blaze.registerHelper('RocketChatMarkdown', text => Markdown.parse(text));
	Blaze.registerHelper('RocketChatMarkdownUnescape', text => Markdown.parseNotEscaped(text));
}
