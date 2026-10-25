const nameChar = '[\\p{L}\\p{N}_-]';

const escapeName = (name: string) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Rewrites the @mentions of a renamed user in a message text, leaving other usernames and email addresses untouched.
 */
export const replaceUsernameMentions = (text: string, previousUsername: string, username: string): string =>
	text.replace(
		new RegExp(`(?<![\\p{L}\\p{N}_.@-])@${escapeName(previousUsername)}(?!${nameChar}|\\.${nameChar})`, 'giu'),
		() => `@${username}`,
	);
