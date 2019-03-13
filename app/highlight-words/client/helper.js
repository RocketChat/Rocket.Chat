import s from 'underscore.string';

export const checkHighlightedWordsInUrls = (msg, highlight) => {
	const urlRegex = new RegExp(`https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\\+~#=]{2,256}\.[a-z]{2,6}\\b([-a-zA-Z0-9@:%_\\+.~#?&//=]*)(${ s.escapeRegExp(highlight) })\\b([-a-zA-Z0-9@:%_\\+.~#?&//=]*)`, 'gmi');
	const urlMatches = msg.match(urlRegex);

	return urlMatches;
};

export const removeHighlightedUrls = (msg, highlight, urlMatches) => {

	urlMatches.forEach((match) => {
		const highlightRegex = new RegExp(highlight, 'gmi');
		const withTemplate = match.replace(highlightRegex, `<span class="highlight-text">${ highlight }</span>`);
		const regexWithTemplate = new RegExp(withTemplate, 'i');

		msg = msg.replace(regexWithTemplate, match);
	});

	return msg;
};

export const highlightWords = (msg, to_highlight) => {
	const highlightTemplate = '$1<span class="highlight-text">$2</span>$3';

	if (Array.isArray(to_highlight)) {
		to_highlight.forEach((highlight) => {
			if (!s.isBlank(highlight)) {
				const regex = new RegExp(`(^|\\b|[\\s\\n\\r\\t.,،'\\\"\\+!?:-])(${ s.escapeRegExp(highlight) })($|\\b|[\\s\\n\\r\\t.,،'\\\"\\+!?:-])(?![^<]*>|[^<>]*<\\/)`, 'gmi');
				const urlMatches = checkHighlightedWordsInUrls(msg, highlight);

				msg = msg.replace(regex, highlightTemplate);

				if (urlMatches) {
					msg = removeHighlightedUrls(msg, highlight, urlMatches);
				}
			}
		});
	}

	return msg;
};
