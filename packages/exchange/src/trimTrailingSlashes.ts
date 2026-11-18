const SLASH = 0x2f;

/** Linear on purpose: `/\/+$/` backtracks quadratically on a long run of slashes that is not at the end. */
export const trimTrailingSlashes = (value: string): string => {
	let end = value.length;

	while (end > 0 && value.charCodeAt(end - 1) === SLASH) {
		end -= 1;
	}

	return value.slice(0, end);
};
