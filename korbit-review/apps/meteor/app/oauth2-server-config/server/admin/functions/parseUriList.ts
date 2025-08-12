export const parseUriList = (userUri: string) => {
	if (userUri.indexOf('\n') < 0 && userUri.indexOf(',') < 0) {
		return userUri;
	}

	const uriList: string[] = [];
	userUri.split(/[,\n]/).forEach((item) => {
		const uri = item.trim();
		if (uri === '') {
			return;
		}

		uriList.push(uri);
	});

	return uriList.join(','); // TODO: This is a hack because the original code was returning a string or an array of strings
};
