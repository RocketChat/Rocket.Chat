import { escapeRegExp } from '@rocket.chat/tools';

/**
 * Rewrites the @mentions of a renamed user in a message text, leaving other usernames and email addresses untouched.
 */
export const replaceUsernameMentions = (text: string, previousUsername: string, username: string): string =>
	text.replace(new RegExp(`(?<![\\w.@-])@${escapeRegExp(previousUsername)}(?![\\w-]|\\.[\\w-])`, 'gi'), `@${username}`);
