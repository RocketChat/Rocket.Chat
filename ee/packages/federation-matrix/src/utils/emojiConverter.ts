const EMOJI_MAP: Record<string, string> = {
	':thumbsup:': '👍',
	':thumbsdown:': '👎',
	':heart:': '❤️',
	':smile:': '😊',
	':laughing:': '😂',
	':cry:': '😢',
	':angry:': '😠',
	':star:': '⭐',
	':fire:': '🔥',
	':clap:': '👏',
	':ok_hand:': '👌',
	':wave:': '👋',
	':+1:': '👍',
	':-1:': '👎',
	':100:': '💯',
	':rocket:': '🚀',
	':eyes:': '👀',
	':thinking:': '🤔',
	':party:': '🎉',
	':tada:': '🎉',
};

export function convertEmojiToUnicode(reaction: string): string {
	if (!reaction.startsWith(':') || !reaction.endsWith(':')) {
		return reaction;
	}

	const unicode = EMOJI_MAP[reaction];
	if (unicode) {
		return unicode;
	}

	return reaction.slice(1, -1);
}

export function convertUnicodeToEmoji(unicode: string): string {
	for (const [shortcode, emoji] of Object.entries(EMOJI_MAP)) {
		if (emoji === unicode) {
			return shortcode;
		}
	}

	return unicode;
}
