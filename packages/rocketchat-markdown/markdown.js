/*
 * Markdown is a named function that will parse markdown syntax
 * @param {Object} message - The message object
 */
import hljs from 'highlight.js';

class MarkdownClass {
	parse(text) {
		return this.parseNotEscaped(_.escapeHTML(text));
	}

	parseNotEscaped(msg) {
		var md = require('markdown-it')
		('zero', {breaks:true, typographer:true, 
			highlight: function (str, lang) {
												if (lang && hljs.getLanguage(lang)) {
													try {
														return '<pre class="code-colors hljs"><code><span class="copyonly">\`\`\`<br></span>' +
															hljs.highlight(lang, str, true).value +
															'<span class="copyonly"><br>\`\`\`</span></code></pre>';
													} catch (__) {}
												}
												return '<pre class="code-colors hljs"><code><span class="copyonly"><br>\`\`\`</span>' + md.utils.escapeHtml(str) + '<span class="copyonly"><br>\`\`\`</span></code></pre>';
											}
							})
								.enable([ 
										'table',		// GFM table, non-standard  BLK
										'code',			// Code block (4 spaces padded) BLK		NOPE?
										'fence',		// ``` lang, ~~~ lang  BLK				OK
										'blockquote',	// > quote syntax  BLK					NOPE
										'list',			// Lists  BLK
										'heading',		// headings (#, ##, ...)  BLK			OK
										
										'escape',		// Process escaped chars and hardbreaks	INLINE
										'newline',		// Remove tabs at the beginning of the line in paragraphs	INLINE
										'backticks',	// Parse backticks   INLINE			NO REALLY (new line)
										'strikethrough',// ~~strike through~~	INLINE		NOT REALLY (new line)
										'emphasis',		// Process *this* and _that_		INLINE   NOT REALLY (new line)
										'link',			// Process [link](<to> "stuff")		INLINE
										'image',		// Process ![image](<src> "title")	INLINE
										'replacements',	// Simple typographyc replacements	CORE
										'smartquotes',	// Convert straight quotation marks to typographic ones	CORE
										'hr',			// Horizontal rule	BLK
/*
										'autolink',	 // Process autolinks '<protocol:...>'   INLINE  OK
										'lheading',	 // heading with lines ---- ====  BLK
										'reference',	// link to place in text  BLK
										'linkify',	  // Replace link-like texts with link nodes.   CORE
										
								.disable([ 
										'html_block',   // HTML block  BLK
										'entity',	   // Process html entity - &#123;, &#xAF;, &quot;, ...   INLINE
										'html_inline',  // Process html tags   INLINE
*/
										])
								.use(require('markdown-it-sub'))
								.use(require('markdown-it-sup'))
								.use(require('markdown-it-checkbox'))
								;
		messagehtml = md.render(msg)

		if (typeof window !== 'undefined' && window !== null ? window.rocketDebug : undefined) { console.log('msg', msg); }
		return messagehtml;
	}
}

const Markdown = new MarkdownClass;
RocketChat.Markdown = Markdown;

// renderMessage already did html escape
const MarkdownMessage = (message) => {
	if (_.trim(message != null ? message.html : undefined)) {
		message.html = Markdown.parseNotEscaped(message.html);
	}

	return message;
};

RocketChat.callbacks.add('renderMessage', MarkdownMessage, RocketChat.callbacks.priority.HIGH, 'markdown');

if (Meteor.isClient) {
	Blaze.registerHelper('RocketChatMarkdown', text => Markdown.parse(text));
	Blaze.registerHelper('RocketChatMarkdownUnescape', text => Markdown.parseNotEscaped(text));
}
