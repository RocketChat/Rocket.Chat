/*
 * Filter markdown tags in message
 *	Use case: notifications
 */
export const filtered = (
	message,
	options = {
		supportSchemesForLink: 'http,https',
	},
) => {
	const schemes = options.supportSchemesForLink.split(',').join('|');

	// Remove block code backticks
	message = message.replace(/```/g, '');

	// Remove inline code backticks
	message = message.replace(new RegExp(/`([^`\r\n]+)\`/gm), (match) => match.substr(1, match.length - 2));

	// Filter [text](url), ![alt_text](image_url)
	message = message.replace(new RegExp(`!?\\[([^\\]]+)\\]\\((?:${schemes}):\\/\\/[^\\)]+\\)`, 'gm'), (match, title) => title);

	// Filter <http://link|Text>
	message = message.replace(
		new RegExp(`(?:<|&lt;)(?:${schemes}):\\/\\/[^\\|]+\\|(.+?)(?=>|&gt;)(?:>|&gt;)`, 'gm'),
		(match, title) => title,
	);

	// Filter headings
	message = message.replace(
		/(^#{1,4}) (([\S\w\d-_\/\*\.,\\][ \u00a0\u1680\u180e\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]?)+)/gm,
		'$2',
	);

	// Filter bold
	message = message.replace(/(^|>|[ >_~`])\*{1,2}([^\*\r\n]+)\*{1,2}([<_~`]|\B|\b|$)/gm, '$1$2$3');

	// Filter italics
	message = message.replace(/(^|>|[ >*~`])\_{1,2}([^\_\r\n]+)\_{1,2}([<*~`]|\B|\b|$)/gm, '$1$2$3');

	// Filter strike-through text
	message = message.replace(/(^|>|[ >_*`])\~{1,2}([^~\r\n]+)\~{1,2}([<_*`]|\B|\b|$)/gm, '$1$2$3');

	// Filter block quotes
	message = message.replace(/(?:>){3}\n+([\s\S]*?)\n+(?:<){3}/g, '$1');

	// Filter > quote
	message = message.replace(/^>(.*)$/gm, '$1');

	return message;
};
