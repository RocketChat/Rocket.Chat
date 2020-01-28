import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

let settings;
if (Meteor.isClient) {
	settings = require('../../settings/client').settings;
} else {
	settings = require('../../settings/server').settings;
}

const fileUploadMediaWhiteList = function(customWhiteList) {
	const mediaTypeWhiteList = customWhiteList || settings.get('FileUpload_MediaTypeWhiteList');

	if (!mediaTypeWhiteList || mediaTypeWhiteList === '*') {
		return;
	}
	return _.map(mediaTypeWhiteList.split(','), function(item) {
		return item.trim();
	});
};

export const fileUploadIsValidContentType = function(type, customWhiteList) {
	const list = fileUploadMediaWhiteList(customWhiteList);
	if (!list) {
		return true;
	}

	if (!type) {
		return false;
	}

	if (_.contains(list, type)) {
		return true;
	}
	const wildCardGlob = '/*';
	const wildcards = _.filter(list, function(item) {
		return item.indexOf(wildCardGlob) > 0;
	});
	if (_.contains(wildcards, type.replace(/(\/.*)$/, wildCardGlob))) {
		return true;
	}

	return false;
};
