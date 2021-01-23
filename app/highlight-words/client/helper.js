import { escapeRegExp } from '../../../lib/escapeRegExp';

export const checkHighlightedWordsInUrls = (msg, urlRegex) => msg.match(urlRegex);

export const checkHighlightedWordsInEmojis = (msg, emojiRegex) => msg.match(emojiRegex);

export const removeHighlightedUrlsOrEmojis = (msg, highlight, urlOrEmojiMatches) => {
	const highlightRegex = new RegExp(highlight, 'gmi');

	return urlOrEmojiMatches.reduce((msg, match) => {
		const withTemplate = match.replace(highlightRegex, `<span class="highlight-text">${ highlight }</span>`);
		const regexWithTemplate = new RegExp(withTemplate, 'i');
		return msg.replace(regexWithTemplate, match);
	}, msg);
};

const highlightTemplate = '$1<span class="highlight-text">$2</span>$3';

export const getRegexHighlight = (highlight) => new RegExp(`(^|\\b|[\\s\\n\\r\\t.,،'\\\"\\+!?:-])(${ escapeRegExp(highlight) })($|\\b|[\\s\\n\\r\\t.,،'\\\"\\+!?:-])(?![^<]*>|[^<>]*<\\/)`, 'gmi');

export const getRegexHighlightUrl = (highlight) => new RegExp(`https?:\/\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{2,256}\\.[a-z]{2,6}\\b([-a-zA-Z0-9@:%_\\+.~#?&//=]*)(${ escapeRegExp(highlight) })\\b([-a-zA-Z0-9@:%_\\+.~#?&//=]*)`, 'gmi');

export const getRegexHighlightEmoji = (highlight) => new RegExp(`(:)(${ escapeRegExp(highlight) })(:)`, 'gmi'); 

export const highlightWords = (msg, highlights) => highlights.reduce((msg, { highlight, regex, urlRegex, emojiRegex }) => {
	const urlMatches = checkHighlightedWordsInUrls(msg, urlRegex);
	const emojiMatches = checkHighlightedWordsInEmojis(msg, emojiRegex);
	if (!urlMatches && !emojiMatches) {
		return msg.replace(regex, highlightTemplate);
	}
	if (!urlMatches) {
		return removeHighlightedUrlsOrEmojis(msg.replace(regex, highlightTemplate), highlight, emojiMatches);
	}
	return removeHighlightedUrlsOrEmojis(msg.replace(regex, highlightTemplate), highlight, urlMatches);
}, msg);
