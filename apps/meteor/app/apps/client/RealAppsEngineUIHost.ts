import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { AppsEngineUIHost } from '@rocket.chat/apps-engine/client/AppsEngineUIHost';
import { IExternalComponentUserInfo } from '@rocket.chat/apps-engine/client/definition';

import { Rooms } from '../../models/client';
import { APIClient } from '../../utils/client';
import { getUserAvatarURL } from '../../utils/lib/getUserAvatarURL';
import { baseURI } from '../../../client/lib/baseURI';

export class RealAppsEngineUIHost extends AppsEngineUIHost {
	private _baseURL: string;

	constructor() {
		super();

		this._baseURL = baseURI.replace(/\/$/, '');
	}

	getUserAvatarUrl(username: string): string {
		const avatarUrl = getUserAvatarURL(username);

		if (!avatarUrl.startsWith('http') && !avatarUrl.startsWith('data')) {
			return `${this._baseURL}${avatarUrl}`;
		}

		return avatarUrl;
	}

	async getClientRoomInfo(): Promise<{
		id: string;
		slugifiedName: string;
		members: {
			id: string;
			username: string;
			avatarUrl: string;
		}[];
	}> {
		const { name: slugifiedName, _id: id } = Rooms.findOne(Session.get('openedRoom'));

		try {
			const { members } = (await APIClient.get('v1/groups.members', { roomId: id })) as { members: { _id: string; username: string }[] };

			return {
				id,
				slugifiedName,
				members: members.map(({ _id, username }) => ({
					id: _id,
					username,
					avatarUrl: this.getUserAvatarUrl(username),
				})),
			};
		} catch (error) {
			console.warn(error);
		}

		return {
			id,
			slugifiedName,
			members: [],
		};
	}

	async getClientUserInfo(): Promise<IExternalComponentUserInfo> {
		const user = Meteor.user();
		if (!user || !user.username) {
			throw new Error('User not found');
		}

		const { username } = user;
		const { _id } = user;

		return {
			id: _id,
			username,
			avatarUrl: this.getUserAvatarUrl(username),
		};
	}
}
