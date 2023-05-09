import { escapeRegExp } from '@rocket.chat/string-helpers';

const checkHighlightedWordsInUrls = (msg: string, urlRegex: RegExp) => msg.match(urlRegex);

const removeHighlightedUrls = (msg: string, highlight: string, urlMatches: string[]) => {
	const highlightRegex = new RegExp(highlight, 'gmi');

	return urlMatches.reduce((msg, match) => {
		const withTemplate = match.replace(highlightRegex, `<mark class="highlight-text">${highlight}</mark>`);
		const regexWithTemplate = new RegExp(withTemplate, 'i');
		return msg.replace(regexWithTemplate, match);
	}, msg);
};

const highlightTemplate = '$1<mark class="highlight-text">$2</mark>$3';

export const getRegexHighlight = (highlight: string) =>
	new RegExp(
		`(^|\\b|[\\s\\n\\r\\t.,،'\\\"\\+!?:-])(${escapeRegExp(highlight)})($|\\b|[\\s\\n\\r\\t.,،'\\\"\\+!?:-])(?![^<]*>|[^<>]*<\\/)`,
		'gmi',
	);

export const getRegexHighlightUrl = (highlight: string) =>
	new RegExp(
		`https?:\/\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{2,256}\\.[a-z]{2,6}\\b([-a-zA-Z0-9@:%_\\+.~#?&//=]*)(${escapeRegExp(
			highlight,
		)})\\b([-a-zA-Z0-9@:%_\\+.~#?&//=]*)`,
		'gmi',
	);

export const highlightWords = (msg: string, highlights: { highlight: string; regex: RegExp; urlRegex: RegExp }[]) =>
	highlights.reduce((msg: string, { highlight, regex, urlRegex }: { highlight: string; regex: RegExp; urlRegex: RegExp }) => {
		const urlMatches = checkHighlightedWordsInUrls(msg, urlRegex);
		if (!urlMatches) {
			return msg.replace(regex, highlightTemplate);
		}
		return removeHighlightedUrls(msg.replace(regex, highlightTemplate), highlight, urlMatches);
	}, msg);
