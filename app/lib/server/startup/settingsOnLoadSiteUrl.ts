import { Meteor } from 'meteor/meteor';
import { WebAppInternals } from 'meteor/webapp';

import { settings } from '../../../settings/server';

export let hostname: string;

settings.watch<string>('Site_Url', function (value) {
	if (value == null || value.trim() === '') {
		return;
	}
	let host = value.replace(/\/$/, '');
	// let prefix = '';
	const match = value.match(/([^\/]+\/{2}[^\/]+)(\/.+)/);
	if (match != null) {
		host = match[1];
		// prefix = match[2].replace(/\/$/, '');
	}
	(global as any).__meteor_runtime_config__.ROOT_URL = value;

	if (Meteor.absoluteUrl.defaultOptions && Meteor.absoluteUrl.defaultOptions.rootUrl) {
		Meteor.absoluteUrl.defaultOptions.rootUrl = value;
	}

	hostname = host.replace(/^https?:\/\//, '');
	process.env.MOBILE_ROOT_URL = host;
	process.env.MOBILE_DDP_URL = host;
	if (typeof WebAppInternals !== 'undefined' && WebAppInternals.generateBoilerplate) {
		return WebAppInternals.generateBoilerplate();
	}
});
