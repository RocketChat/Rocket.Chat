import _ from 'underscore';

export const fileUploadMediaWhiteList = function (customWhiteList: string): string[] | undefined {
	const mediaTypeWhiteList = customWhiteList;

	if (!mediaTypeWhiteList || mediaTypeWhiteList === '*') {
		return;
	}
	return _.map(mediaTypeWhiteList.split(','), (item) => {
		return item.trim();
	});
};

const fileUploadMediaBlackList = function (customBlackList: string): string[] | undefined {
	const blacklist = customBlackList;
	if (!blacklist) {
		return;
	}

	return _.map(blacklist.split(','), (item) => item.trim());
};

const isTypeOnList = function (type: string, list: string[]): boolean | undefined {
	if (_.contains(list, type)) {
		return true;
	}
	const wildCardGlob = '/*';
	const wildcards = _.filter(list, (item) => {
		return item.indexOf(wildCardGlob) > 0;
	});
	if (_.contains(wildcards, type.replace(/(\/.*)$/, wildCardGlob))) {
		return true;
	}
};

export const fileUploadIsValidContentTypeFromSettings = function (type: string, customWhiteList: string, customBlackList: string): boolean {
	const blackList = fileUploadMediaBlackList(customBlackList);
	const whiteList = fileUploadMediaWhiteList(customWhiteList);

	if (!type && blackList) {
		return false;
	}

	if (blackList && isTypeOnList(type, blackList)) {
		return false;
	}

	if (!whiteList) {
		return true;
	}

	return !!isTypeOnList(type, whiteList);
};
