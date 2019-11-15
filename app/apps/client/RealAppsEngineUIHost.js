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
		let { members } = await APIClient.get('apps/groupMembers', { roomId: id });

		members = members.map(({ _id, username }) => ({
			id: _id,
			username,
			avatarUrl: `${ this._baseURL }${ getUserAvatarURL(username) }`,
		}));

		return {
			id,
			slugifiedName,
			members,
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
