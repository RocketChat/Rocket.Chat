import { Meteor } from 'meteor/meteor';

import { settings } from '../../../settings';

export let hostname;

settings.get('Site_Url', function(value) {
	if (value == null || value.trim() === '') {
		return;
	}
	(window as any).__meteor_runtime_config__.ROOT_URL = value;

	if (Meteor.absoluteUrl.defaultOptions && Meteor.absoluteUrl.defaultOptions.rootUrl) {
		Meteor.absoluteUrl.defaultOptions.rootUrl = value;
	}
});
