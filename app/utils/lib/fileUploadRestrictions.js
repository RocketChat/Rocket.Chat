import { settings } from '../../settings';
import _ from 'underscore';

export const fileUploadMediaWhiteList = function() {
	const mediaTypeWhiteList = settings.get('FileUpload_MediaTypeWhiteList');

	if (!mediaTypeWhiteList || mediaTypeWhiteList === '*') {
		return;
	}
	return _.map(mediaTypeWhiteList.split(','), function(item) {
		return item.trim();
	});
};

export const fileUploadIsValidContentType = function(type) {
	const list = fileUploadMediaWhiteList();
	if (!list) {
		return true;
	}

	if (!type) {
		return false;
	}

	if (_.contains(list, type)) {
		return true;
	} else {
		const wildCardGlob = '/*';
		const wildcards = _.filter(list, function(item) {
			return item.indexOf(wildCardGlob) > 0;
		});
		if (_.contains(wildcards, type.replace(/(\/.*)$/, wildCardGlob))) {
			return true;
		}
	}
	return false;
};
