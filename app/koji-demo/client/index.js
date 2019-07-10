import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { authorizeMiniApp } from '../../ui-utils/client/lib/miniAppAction';
import { getUserAvatarURL } from '../../utils/lib/getUserAvatarURL';
import { TabBar } from '../../ui-utils/client';

import './views/koji-demo.html';

TabBar.addButton({
	groups: ['channel', 'group', 'direct'],
	id: 'koji',
	i18nTitle: 'Koji',
	icon: 'cube',
	template: 'KojiDemo',
	order: 0,
});

Meteor.startup(function() {
	window.addEventListener('message', async ({ data, source }) => {
		if (!data.hasOwnProperty('rcEmbeddedSdk')) {
			return;
		}

		try {
			const baseUrl = window.location.origin;
			const { username } = Meteor.user();
			const avatarUrl = `${ baseUrl }${ getUserAvatarURL(username) }`;
			const { name: roomName } = Session.get(`roomData${ Session.get('openedRoom') }`);

			const { action } = data.rcEmbeddedSdk;
			const { payload: { appName } } = data.rcEmbeddedSdk;

			if (action === 'getUserInfo') {
				const authorized = await authorizeMiniApp(appName);
				console.log(authorized);
				if (!authorized) {
					source.postMessage({
						rcEmbeddedSdk: {
							action: 'getUserInfo',
							success: false,
						},
					}, '*');
				} else {
					source.postMessage({
						rcEmbeddedSdk: {
							action: 'getUserInfo',
							payload: {
								username,
								avatarUrl,
								roomName,
							},
							success: true,
						},
					}, '*');
				}
			}
		} catch (err) {
			console.error(err);
		}
	}, false);
});
