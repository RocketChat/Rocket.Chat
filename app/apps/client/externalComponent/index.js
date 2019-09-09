import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';

import { APIClient } from '../../../utils';
import { getUserAvatarURL } from '../../../utils/lib/getUserAvatarURL';
import { setItem, getItem, getAll, clear, removeItem } from './persistence';

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
				case 'persistence.setItem':
					try {
						const { payload: { key, value } } = data.rcEmbeddedSDK;
						const { appId } = Template.GameModal.currentExternalComponent;
						setItem(appId, key, value);
					} catch (err) {
						console.warn(err);
					}
					source.postMessage({
						rcEmbeddedSDK: {
							action,
							id,
							payload: null,
						},
					}, '*');
					break;
				case 'persistence.removeItem':
					try {
						const { payload: { key } } = data.rcEmbeddedSDK;
						const { appId } = Template.GameModal.currentExternalComponent;
						removeItem(appId, key);
					} catch (err) {
						console.warn(err);
					}
					source.postMessage({
						rcEmbeddedSDK: {
							action,
							id,
							payload: null,
						},
					}, '*');
					break;
				case 'persistence.clear':
					try {
						const { appId } = Template.GameModal.currentExternalComponent;
						clear(appId);
					} catch (err) {
						console.warn(err);
					}
					source.postMessage({
						rcEmbeddedSDK: {
							action,
							id,
							payload: null,
						},
					}, '*');
					break;
				case 'persistence.getItem':
					try {
						const { payload: { key } } = data.rcEmbeddedSDK;
						const { appId } = Template.GameModal.currentExternalComponent;
						const payload = await getItem(appId, key);

						source.postMessage({
							rcEmbeddedSDK: {
								action,
								id,
								payload,
							},
						}, '*');
					} catch (err) {
						console.warn(err);
					}
					break;
				case 'persistence.getAll':
					try {
						const { appId } = Template.GameModal.currentExternalComponent;
						const allItems = await getAll(appId);
						source.postMessage({
							rcEmbeddedSDK: {
								action,
								id,
								payload: {
									allItems,
								},
							},
						}, '*');
					} catch (err) {
						console.warn(err);
					}
					break;
				default:
					break;
			}
		} catch (err) {
			console.error(err);
		}
	}, false);
});
