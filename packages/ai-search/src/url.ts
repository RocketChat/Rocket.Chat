export const trimTrailingSlashes = (url: string): string => {
	let end = url.length;

	while (end > 0 && url.charCodeAt(end - 1) === 47) {
		end--;
	}

	return url.slice(0, end);
};
