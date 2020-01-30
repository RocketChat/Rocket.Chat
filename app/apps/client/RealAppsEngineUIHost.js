import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { AppsEngineUIHost } from '@rocket.chat/apps-engine/client/AppsEngineUIHost';

import { Rooms } from '../../models';
import { APIClient } from '../../utils';
import { getUserAvatarURL } from '../../utils/lib/getUserAvatarURL';

export class RealAppsEngineUIHost extends AppsEngineUIHost {
	constructor() {
		super();

		this._baseURL = document.baseURI.slice(0, -1);
	}

	async getClientRoomInfo() {
		const { name: slugifiedName, _id: id } = Rooms.findOne(Session.get('openedRoom'));

		let cachedMembers = [];
		try {
			const { members } = await APIClient.get('v1/groups.members', { roomId: id });

			cachedMembers = members.map(({ _id, username }) => ({
				id: _id,
				username,
				avatarUrl: `${ this._baseURL }${ getUserAvatarURL(username) }`,
			}));
		} catch (error) {
			console.warn(error);
		}

		return {
			id,
			slugifiedName,
			members: cachedMembers,
		};
	}

	async getClientUserInfo() {
		const { username, _id } = Meteor.user();
		const avatarUrl = `${ this._baseURL }${ getUserAvatarURL(username) }`;

		return {
			id: _id,
			username,
			avatarUrl,
		};
	}
}
