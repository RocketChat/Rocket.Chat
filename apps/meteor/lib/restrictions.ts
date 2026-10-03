export const fileUploadMediaWhiteList = function (customWhiteList: string): string[] | undefined {
	const mediaTypeWhiteList = customWhiteList;

	if (!mediaTypeWhiteList || mediaTypeWhiteList === '*') {
		return;
	}
	return mediaTypeWhiteList.split(',').map((item) => {
		return item.trim();
	});
};

const fileUploadMediaBlackList = function (customBlackList: string): string[] | undefined {
	const blacklist = customBlackList;
	if (!blacklist) {
		return;
	}

	return blacklist.split(',').map((item) => item.trim());
};

const isTypeOnList = function (type?: string, list?: string[]): boolean {
	if (!type || !list) {
		return false;
	}

	if (list.includes(type)) {
		return true;
	}
	const wildCardGlob = '/*';
	const wildcards = list.filter((item) => {
		return item.indexOf(wildCardGlob) > 0;
	});
	if (wildcards.includes(type.replace(/(\/.*)$/, wildCardGlob))) {
		return true;
	}

	return false;
};

export const fileUploadIsValidContentTypeFromSettings = function (
	type: string | undefined,
	customWhiteList: string,
	customBlackList: string,
): boolean {
	const blackList = fileUploadMediaBlackList(customBlackList);
	const whiteList = fileUploadMediaWhiteList(customWhiteList);

	if (blackList && type && isTypeOnList(type, blackList)) {
		return false;
	}

	if (whiteList) {
		return isTypeOnList(type, whiteList);
	}

	if (!whiteList) {
		return true;
	}

	return false;
};
