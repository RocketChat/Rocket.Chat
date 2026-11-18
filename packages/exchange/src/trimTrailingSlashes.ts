const SLASH = 0x2f;

export const trimTrailingSlashes = (value: string): string => {
	let end = value.length;

	while (end > 0 && value.charCodeAt(end - 1) === SLASH) {
		end -= 1;
	}

	return value.slice(0, end);
};
