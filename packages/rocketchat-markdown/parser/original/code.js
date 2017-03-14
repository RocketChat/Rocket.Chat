/*
 * MarkdownCode is a named function that will parse `inline code` and ```codeblock``` syntaxes
 * @param {Object} message - The message object
 */
import { Random } from 'meteor/random';
import { _ } from 'meteor/underscore';
import hljs from 'highlight.js';

const inlineCode = (message) => {
	// Support `text`
	message.html = message.html.replace(/(^|&gt;|[ >_*~])\`([^`\r\n]+)\`([<_*~]|\B|\b|$)/gm, (match, p1, p2, p3) => {
		const token = `=&=${Random.id()}=&=`;
		message.tokens.push({
			token,
			text: `${p1}<span class="copyonly">\`</span><span><code class="code-colors inline">${p2}</code></span><span class="copyonly">\`</span>${p3}`
		});
		return token;
	});

	return message;
};

const blockCode = (message) => {
	// Count occurencies of ```
	const count = (message.html.match(/```/g) || []).length;

	// Check if we need to add a final ```
	if (!count) {
		return message;
	}

	if (count % 2 > 0) {
		message.html = message.html + '\n```';
		message.msg = message.msg + '\n```';
	}

	// Separate text in code blocks and non code blocks
	let msgParts = message.html.replace(/<br>/gm, '\n').split(/^.*(```(?:[a-zA-Z]+)?(?:(?:.|\n)*?)```)(.*\n?)$/gm);
	msgParts = msgParts.map((part) => {
		// Verify if this part is code
		const codeMatch = part.match(/^```(\w*[\n\ ]?)([\s\S]*?)```+?$/);
		if (null == codeMatch) {
			return part;
		}

		// Process highlight if this part is code
		const singleLine = codeMatch[0].indexOf('\n') === -1;
		let code = null, lang = null;
		if (singleLine) {
			lang = '';
			code = _.unescapeHTML(codeMatch[1] + codeMatch[2]);
		} else {
			lang = codeMatch[1];
			code = _.unescapeHTML(codeMatch[2]);
		}

		let result = null;
		lang = _.trim(lang);
		if (hljs.listLanguages().includes(lang)) {
			result = hljs.highlight(lang, code);
		} else {
			result = hljs.highlightAuto(lang + code);
		}

		const token = `=&=${Random.id()}=&=`;
		message.tokens.push({
			highlight: true,
			token,
			text: `<pre><code class='code-colors hljs ${result.language}'><span class='copyonly'>\`\`\`<br></span>${result.value}<span class='copyonly'><br>\`\`\`</span></code></pre>`
		});

		return token;
	});

	// Re-mount message
	message.html = msgParts.join('');

	return message;
};

export const code = (message) => {
	if (!message.html || !_.trim(message.html)) {
		return message;
	}

	if (message.tokens == null) {
		message.tokens = [];
	}

	message = blockCode(message);
	message = inlineCode(message);

	return message;
};
