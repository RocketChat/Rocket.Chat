import s from 'underscore.string';

export const checkHighlightedWordsInUrls = (msg, urlRegex) => msg.match(urlRegex);

export const removeHighlightedUrls = (msg, highlight, urlMatches) => {
	const highlightRegex = new RegExp(highlight, 'gmi');

	return urlMatches.reduce((msg, match) => {
		const withTemplate = match.replace(highlightRegex, `<span class="highlight-text">${ highlight }</span>`);
		const regexWithTemplate = new RegExp(withTemplate, 'i');
		return msg.replace(regexWithTemplate, match);
	}, msg);
};

const highlightTemplate = '$1<span class="highlight-text">$2</span>$3';

export const getRegexHighlight = (highlight) => new RegExp(`(^|\\b|[\\s\\n\\r\\t.,،'\\\"\\+!?:-])(${ s.escapeRegExp(highlight) })($|\\b|[\\s\\n\\r\\t.,،'\\\"\\+!?:-])(?![^<]*>|[^<>]*<\\/)`, 'gmi');

export const getRegexHighlightUrl = (highlight) => new RegExp(`https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\\+~#=]{2,256}\.[a-z]{2,6}\\b([-a-zA-Z0-9@:%_\\+.~#?&//=]*)(${ s.escapeRegExp(highlight) })\\b([-a-zA-Z0-9@:%_\\+.~#?&//=]*)`, 'gmi');

export const highlightWords = (msg, highlights) => highlights.reduce((msg, { highlight, regex, urlRegex }) => {
	const urlMatches = checkHighlightedWordsInUrls(msg, urlRegex);
	if (!urlMatches) {
		return msg.replace(regex, highlightTemplate);

	}
	return removeHighlightedUrls(msg.replace(regex, highlightTemplate), highlight, urlMatches);
}, msg);
