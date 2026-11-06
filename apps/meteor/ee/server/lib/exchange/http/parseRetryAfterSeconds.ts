export const parseRetryAfterSeconds = (header: string | null | undefined): number | undefined => {
	if (!header) {
		return undefined;
	}

	const seconds = Number.parseInt(header, 10);

	return Number.isFinite(seconds) && seconds >= 0 ? seconds : undefined;
};
