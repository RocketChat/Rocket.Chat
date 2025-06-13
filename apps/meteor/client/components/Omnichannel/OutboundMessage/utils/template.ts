const placeholderPattern = new RegExp('{{(.*?)}}', 'g'); // e.g {{1}} or {{text}}

export const processPlaceholders = (text: string | undefined, componentType: string) => {
	if (!text) {
		return [];
	}

	const matches = text.match(placeholderPattern) || [];
	const placeholders = new Set(matches);

	return Array.from(placeholders).map((raw) => ({
		raw,
		value: raw.slice(2, -2),
		componentType,
	}));
};

export const highlightPlaceholders = (text: string | undefined) => {
	if (!text) {
		return '';
	}

	return text.replace(placeholderPattern, '<i>$&</i>');
};
