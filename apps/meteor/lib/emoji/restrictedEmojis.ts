export const normalizeEmojiName = (name: string | undefined | null): string => {
	if (typeof name !== 'string') {
		return '';
	}

	return name.trim().toLowerCase().replace(/^:|:$/g, '');
};

export const getEmojiNameWithoutTone = (name: string | undefined | null): string => normalizeEmojiName(name).replace(/_tone\d+$/, '');

export const parseRestrictedEmojis = (value: string | undefined | null): string[] => {
	if (!value || typeof value !== 'string') {
		return [];
	}

	return Array.from(new Set(value.split(',').map(getEmojiNameWithoutTone).filter(Boolean)));
};

export const isRestrictedEmoji = (emojiName: string | undefined | null, restrictedEmojis: string[]): boolean => {
	if (!restrictedEmojis.length) {
		return false;
	}

	const normalized = normalizeEmojiName(emojiName);
	if (!normalized) {
		return false;
	}

	if (restrictedEmojis.includes(normalized)) {
		return true;
	}

	const withoutTone = getEmojiNameWithoutTone(normalized);
	return withoutTone !== normalized && restrictedEmojis.includes(withoutTone);
};
