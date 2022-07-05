import { MentionsParser } from '../lib/MentionsParser';
import './mentionLink.css';

export let instance = new MentionsParser({
	me: () => undefined,
	pattern: () => undefined,
	useRealName: () => undefined,
});

export let renderMentions = (message) => message;

export const createMentionsMessageRenderer = ({ me, pattern, useRealName }) => {
	instance = new MentionsParser({
		me: () => me,
		pattern: () => pattern,
		useRealName: () => useRealName,
	});

	renderMentions = (message) => instance.parse(message);

	return (message) => instance.parse(message);
};
