import { AppsEngineUIHost } from '@rocket.chat/apps-engine/client/AppsEngineUIHost';
import { Meteor } from 'meteor/meteor';

import { ChatRoom } from '../../../app/models/client';
import { getUserAvatarURL } from '../../../app/utils/client/getUserAvatarURL';
import { sdk } from '../../../app/utils/client/lib/SDKClient';
import { RoomManager } from '../../../client/lib/RoomManager';
import { baseURI } from '../../../client/lib/baseURI';

export class RealAppsEngineUIHost extends AppsEngineUIHost {
	constructor() {
		super();

		this._baseURL = baseURI.replace(/\/$/, '');
	}

	getUserAvatarUrl(username) {
		const avatarUrl = getUserAvatarURL(username);

		if (!avatarUrl.startsWith('http') && !avatarUrl.startsWith('data')) {
			return `${this._baseURL}${avatarUrl}`;
		}

		return avatarUrl;
	}

	async getClientRoomInfo() {
		const { name: slugifiedName, _id: id } = ChatRoom.findOne(RoomManager.opened);

		let cachedMembers = [];
		try {
			const { members } = await sdk.rest.get('/v1/groups.members', { roomId: id });

			cachedMembers = members.map(({ _id, username }) => ({
				id: _id,
				username,
				avatarUrl: this.getUserAvatarUrl(username),
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

		return {
			id: _id,
			username,
			avatarUrl: this.getUserAvatarUrl(username) || '',
		};
	}
}
