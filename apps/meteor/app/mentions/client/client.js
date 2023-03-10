import { MentionsParser } from '../lib/MentionsParser';
import './mentionLink.css';

let instance = new MentionsParser({
	me: () => undefined,
	pattern: () => undefined,
	useRealName: () => undefined,
});

export const createMentionsMessageRenderer = ({ me, pattern, useRealName }) => {
	instance = new MentionsParser({
		me: () => me,
		pattern: () => pattern,
		useRealName: () => useRealName,
	});

	return (message) => instance.parse(message);
};
