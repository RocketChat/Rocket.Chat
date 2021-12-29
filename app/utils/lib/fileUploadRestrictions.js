import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

let settings;
if (Meteor.isClient) {
	settings = require('../../settings/client').settings;
} else {
	settings = require('../../settings/server').settings;
}

const fileUploadMediaWhiteList = function (customWhiteList) {
	const mediaTypeWhiteList = customWhiteList || settings.get('FileUpload_MediaTypeWhiteList');

	if (!mediaTypeWhiteList || mediaTypeWhiteList === '*') {
		return;
	}
	return _.map(mediaTypeWhiteList.split(','), function (item) {
		return item.trim();
	});
};

const fileUploadMediaBlackList = function () {
	const blacklist = settings.get('FileUpload_MediaTypeBlackList');
	if (!blacklist) {
		return;
	}

	return _.map(blacklist.split(','), (item) => item.trim());
};

const isTypeOnList = function (type, list) {
	if (_.contains(list, type)) {
		return true;
	}
	const wildCardGlob = '/*';
	const wildcards = _.filter(list, function (item) {
		return item.indexOf(wildCardGlob) > 0;
	});
	if (_.contains(wildcards, type.replace(/(\/.*)$/, wildCardGlob))) {
		return true;
	}
};

export const fileUploadIsValidContentType = function (type, customWhiteList) {
	const blackList = fileUploadMediaBlackList();
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

	return isTypeOnList(type, whiteList);
};
