import { AppClientUIHost } from '@rocket.chat/apps-engine/client/AppClientUIHost';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { APIClient } from '../../utils';
import { getUserAvatarURL } from '../../utils/lib/getUserAvatarURL';

export class RealAppClientUIHost extends AppClientUIHost {
	constructor() {
		super();

		this._baseURL = document.baseURI.slice(0, -1);
	}

	async getClientRoomInfo() {
		const { name: roomName, _id: roomId } = Session.get(`roomData${ Session.get('openedRoom') }`);
		let { members } = await APIClient.get('apps/groupMembers', { roomId });

		members = members.map(({ _id, username, status }) => ({
			userId: _id,
			username,
			avatarUrl: `${ this._baseURL }${ getUserAvatarURL(username) }`,
			status,
		}));

		return {
			roomId,
			roomName,
			members,
		};
	}

	async getClientUserInfo() {
		const { username, _id } = Meteor.user();
		const avatarUrl = `${ this._baseURL }${ getUserAvatarURL(username) }`;

		return {
			userId: _id,
			username,
			avatarUrl,
		};
	}
}
