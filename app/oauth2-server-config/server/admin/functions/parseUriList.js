export const parseUriList = (userUri) => {
	if (userUri.indexOf('\n') < 0 && userUri.indexOf(',') < 0) {
		return userUri;
	}

	const uriList = [];
	userUri.split(/[,\n]/).forEach((item) => {
		const uri = item.trim();
		if (uri === '') {
			return;
		}

		uriList.push(uri);
	});

	return uriList;
};
