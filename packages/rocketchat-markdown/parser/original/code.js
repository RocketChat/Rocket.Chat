/*
 * code() is a named function that will parse `inline code` and ```codeblock``` syntaxes
 * @param {Object} message - The message object
 */
import { Random } from 'meteor/random';
import s from 'underscore.string';
import hljs from 'highlight.js';

const inlinecode = (message) => {
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
};

const codeblocks = (message) => {
	// Count occurencies of ```
	const count = (message.html.match(/```/g) || []).length;

	if (count) {

		// Check if we need to add a final ```
		if ((count % 2) > 0) {
			message.html = `${ message.html }\n\`\`\``;
			message.msg = `${ message.msg }\n\`\`\``;
		}

		// Separate text in code blocks and non code blocks
		const msgParts = message.html.split(/(^.*)(```(?:[a-zA-Z]+)?(?:(?:.|\r|\n)*?)```)(.*\n?)$/gm);

		for (let index = 0; index < msgParts.length; index++) {
			// Verify if this part is code
			const part = msgParts[index];
			const codeMatch = part.match(/^```(.*[\r\n\ ]?)([\s\S]*?)```+?$/);

			if (codeMatch != null) {
				// Process highlight if this part is code
				const singleLine = codeMatch[0].indexOf('\n') === -1;
				const lang = !singleLine && Array.from(hljs.listLanguages()).includes(s.trim(codeMatch[1])) ? s.trim(codeMatch[1]) : '';
				const code =
					singleLine ?
						s.unescapeHTML(codeMatch[1]) :
						lang === '' ?
							s.unescapeHTML(codeMatch[1] + codeMatch[2]) :
							s.unescapeHTML(codeMatch[2]);

				const result = lang === '' ? hljs.highlightAuto((lang + code)) : hljs.highlight(lang, code);
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
};

export const code = (message) => {
	if (s.trim(message.html)) {
		if (message.tokens == null) {
			message.tokens = [];
		}

		codeblocks(message);
		inlinecode(message);
	}

	return message;
};
