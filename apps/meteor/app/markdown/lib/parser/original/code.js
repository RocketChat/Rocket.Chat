/*
 * code() is a named function that will parse `inline code` and ```codeblock``` syntaxes
 * @param {Object} message - The message object
 */
import { unescapeHTML } from '@rocket.chat/string-helpers';

import hljs, { register } from '../../hljs';
import { addAsToken } from './token';

const inlinecode = (message) => {
	// Support `text`
	message.html = message.html.replace(/\`([^`\r\n]+)\`([<_*~]|\B|\b|$)/gm, (match, p1, p2) =>
		addAsToken(
			message,
			`<span class=\"copyonly\">\`</span><span><code class=\"code-colors inline\">${p1}</code></span><span class=\"copyonly\">\`</span>${p2}`,
			'inlinecode',
			{ noHtml: match },
		),
	);
};

const codeblocks = (message) => {
	// Count occurencies of ```
	const count = (message.html.match(/```/gm) || []).length;

	if (count) {
		// Check if we need to add a final ```
		if (count % 2 > 0) {
			message.html = `${message.html}\n\`\`\``;
			message.msg = `${message.msg}\n\`\`\``;
		}

		// Separate text in code blocks and non code blocks
		const msgParts = message.html.split(/(^.*)(```(?:[a-zA-Z]+)?(?:(?:.|\r|\n)*?)```)(.*\n?)$/gm);

		for (let index = 0; index < msgParts.length; index++) {
			// Verify if this part is code
			const part = msgParts[index];
			const codeMatch = part.match(/^```[\r\n]*(.*[\r\n\ ]?)[\r\n]*([\s\S]*?)```+?$/);

			if (codeMatch) {
				// Process highlight if this part is code
				const singleLine = codeMatch[0].indexOf('\n') === -1;
				const lang = !singleLine && Array.from(hljs.listLanguages()).includes(codeMatch[1].trim()) ? codeMatch[1].trim() : '';
				const emptyLanguage = lang === '' ? unescapeHTML(codeMatch[1] + codeMatch[2]) : unescapeHTML(codeMatch[2]);
				const code = singleLine ? unescapeHTML(codeMatch[1]) : emptyLanguage;

				const result = (() => {
					if (lang) {
						try {
							register(lang);
							return hljs.highlight(lang, code);
						} catch (error) {
							console.error(error);
						}
					}
					return hljs.highlightAuto(lang + code);
				})();
				const token = addAsToken(
					message,
					`<pre><code class='code-colors hljs ${result.language}'><span class='copyonly'>\`\`\`<br></span>${result.value}<span class='copyonly'><br>\`\`\`</span></code></pre>`,
					'code',
					{
						noHtml: codeMatch[0],
						highlight: true,
					},
				);

				msgParts[index] = token;
			} else {
				msgParts[index] = part;
			}
		}

		// Re-mount message
		message.html = msgParts.join('');
	}
};

export const code = (message) => {
	if (message.html?.trim()) {
		codeblocks(message);
		inlinecode(message);
	}

	return message;
};
