/*
 * MarkdownCode is a named function that will parse `inline code` and ```codeblock``` syntaxes
 * @param {Object} message - The message object
 */
import hljs from 'highlight.js';

class MarkdownCode {
	constructor(message) {

		if (s.trim(message.html)) {
			if (message.tokens == null) {
				message.tokens = [];
			}

			MarkdownCode.handle_codeblocks(message);
			MarkdownCode.handle_inlinecode(message);

			if (window && window.rocketDebug) {
				console.log('Markdown', message);
			}
		}

		return message;
	}

	static handle_inlinecode(message) {
		// Support `text`
		return message.html = message.html.replace(/(^|&gt;|[ >_*~])\`([^`\r\n]+)\`([<_*~]|\B|\b|$)/gm, (match, p1, p2, p3) => {
			const token = `=!=${ Random.id() }=!=`;

			message.tokens.push({
				token,
				text: `${ p1 }<span class=\"copyonly\">\`</span><span><code class=\"code-colors inline\">${ p2 }</code></span><span class=\"copyonly\">\`</span>${ p3 }`,
				noHtml: match
			});

			return token;
		});
	}

	static handle_codeblocks(message) {
		// Count occurencies of ```
		const count = (message.html.match(/```/g) || []).length;

		if (count) {

			// Check if we need to add a final ```
			if ((count % 2) > 0) {
				message.html = `${ message.html }\n\`\`\``;
				message.msg = `${ message.msg }\n\`\`\``;
			}

			// Separate text in code blocks and non code blocks
			const msgParts = message.html.split(/(^.*)(```(?:[a-zA-Z]+)?(?:(?:.|\n)*?)```)(.*\n?)$/gm);

			for (let index = 0; index < msgParts.length; index++) {
				// Verify if this part is code
				const part = msgParts[index];
				const codeMatch = part.match(/^```(.*[\n\ ]?)([\s\S]*?)```+?$/);

				if (codeMatch != null) {
					// Process highlight if this part is code
					let code;
					let lang;
					let result;
					const singleLine = codeMatch[0].indexOf('\n') === -1;

					if (singleLine) {
						lang = '';
						code = _.unescapeHTML(codeMatch[1] + codeMatch[2]);
					} else {
						lang = codeMatch[1];
						code = _.unescapeHTML(codeMatch[2]);
					}

					if (s.trim(lang) === '') {
						lang = '';
					}

					if (!Array.from(hljs.listLanguages()).includes(s.trim(lang))) {
						result = hljs.highlightAuto((lang + code));
					} else {
						result = hljs.highlight(s.trim(lang), code);
					}

					const token = `=!=${ Random.id() }=!=`;

					message.tokens.push({
						highlight: true,
						token,
						text: `<pre><code class='code-colors hljs ${ result.language }'><span class='copyonly'>\`\`\`<br></span>${ result.value }<span class='copyonly'><br>\`\`\`</span></code></pre>`,
						noHtml: `\`\`\`\n${ s.stripTags(result.value) }\n\`\`\``
					});

					msgParts[index] = token;
				} else {
					msgParts[index] = part;
				}
			}

			// Re-mount message
			return message.html = msgParts.join('');
		}
	}
}

RocketChat.MarkdownCode = MarkdownCode;

const MarkdownCodeCB = (message) => new MarkdownCode(message);

// MarkdownCode gets higher priority over Markdown so it's possible place a callback in between (katex for exmaple)
RocketChat.callbacks.add('renderMessage', MarkdownCodeCB, RocketChat.callbacks.priority.HIGH - 2, 'markdowncode');
