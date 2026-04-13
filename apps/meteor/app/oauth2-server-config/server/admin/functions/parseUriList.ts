export const parseUriList = (userUri: string): string[] => {
	if (!userUri || userUri.trim() === '') {
		return [];
	}

	// If there are no separators, return a single-item array with the trimmed value
	if (userUri.indexOf('\n') < 0 && userUri.indexOf(',') < 0) {
		return [userUri.trim()];
	}

	const uriList: string[] = [];
	userUri.split(/[,\n]/).forEach((item) => {
		const uri = item.trim();
		if (uri === '') {
			return;
		}

		uriList.push(uri);
	});

	return uriList;
};
