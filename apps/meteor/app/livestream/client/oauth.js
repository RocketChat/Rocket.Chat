import { Meteor } from 'meteor/meteor';

import { settings } from '../../settings';

export const close = (popup) =>
	new Promise(function (resolve) {
		const checkInterval = setInterval(() => {
			if (popup.closed) {
				clearInterval(checkInterval);
				resolve();
			}
		}, 300);
	});

export const auth = async () => {
	const oauthWindow = window.open(
		`${settings.get('Site_Url')}/api/v1/livestream/oauth?userId=${Meteor.userId()}`,
		'youtube-integration-oauth',
		'width=400,height=600',
	);
	return close(oauthWindow);
};
