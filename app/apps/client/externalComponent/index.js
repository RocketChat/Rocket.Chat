import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';

import { APIClient } from '../../../utils';
import { getUserAvatarURL } from '../../../utils/lib/getUserAvatarURL';


Meteor.startup(function() {
	window.addEventListener('message', async ({ data, source }) => {
		if (!data.hasOwnProperty('rcEmbeddedSDK')) {
			return;
		}

		try {
			const { action, id } = data.rcEmbeddedSDK;
			const baseUrl = document.baseURI.slice(0, -1);

			switch (action) {
				case 'getUserInfo':
					const { username, _id } = Meteor.user();
					const avatarUrl = `${ baseUrl }${ getUserAvatarURL(username) }`;
					source.postMessage({
						rcEmbeddedSDK: {
							action,
							id,
							payload: {
								userId: _id,
								username,
								avatarUrl,
							},
						},
					}, '*');
					break;
				case 'getRoomInfo':
					const { name: roomName, _id: roomId } = Session.get(`roomData${ Session.get('openedRoom') }`);
					let { members } = await APIClient.get('v1/groups.members', { roomId });

					members = members.map(({ _id, username, status }) => ({
						userId: _id,
						username,
						avatarUrl: `${ baseUrl }${ getUserAvatarURL(username) }`,
						status,
					}));

					const { appId } = Template.GameModal.currentExternalComponent;
					Meteor.call('externalComponentStorage:setItem', appId, 'Hi', { name: 'Great!' });
					const result = await Meteor.call('externalComponentStorage:getItem', appId, 'Hi');
					console.log(result);

					source.postMessage({
						rcEmbeddedSDK: {
							action,
							id,
							payload: {
								roomId,
								roomName,
								members,
							},
						},
					}, '*');
					break;
				default:
					break;
			}
		} catch (err) {
			console.error(err);
		}
	}, false);
});
