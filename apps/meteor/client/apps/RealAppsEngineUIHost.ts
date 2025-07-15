import { AppsEngineUIHost } from '@rocket.chat/apps-engine/client/AppsEngineUIHost';
import type { IExternalComponentRoomInfo, IExternalComponentUserInfo } from '@rocket.chat/apps-engine/client/definition';
import { Meteor } from 'meteor/meteor';

import { Rooms } from '../../app/models/client';
import { getUserAvatarURL } from '../../app/utils/client/getUserAvatarURL';
import { sdk } from '../../app/utils/client/lib/SDKClient';
import { RoomManager } from '../lib/RoomManager';
import { baseURI } from '../lib/baseURI';

// FIXME: replace non-null assertions with proper error handling

export class RealAppsEngineUIHost extends AppsEngineUIHost {
	private _baseURL: string;

	constructor() {
		super();

		this._baseURL = baseURI.replace(/\/$/, '');
	}

	private getUserAvatarUrl(username: string) {
		const avatarUrl = getUserAvatarURL(username)!;

		if (!avatarUrl.startsWith('http') && !avatarUrl.startsWith('data')) {
			return `${this._baseURL}${avatarUrl}`;
		}

		return avatarUrl;
	}

	async getClientRoomInfo(): Promise<IExternalComponentRoomInfo> {
		const { name: slugifiedName, _id: id } = Rooms.findOne(RoomManager.opened)!;

		let cachedMembers: IExternalComponentUserInfo[] = [];
		try {
			const { members } = await sdk.rest.get('/v1/groups.members', { roomId: id });

			cachedMembers = members.map(
				({ _id, username }): IExternalComponentUserInfo => ({
					id: _id,
					username: username!,
					avatarUrl: this.getUserAvatarUrl(username!),
				}),
			);
		} catch (error) {
			console.warn(error);
		}

		return {
			id,
			slugifiedName: slugifiedName!,
			members: cachedMembers,
		};
	}

	async getClientUserInfo(): Promise<IExternalComponentUserInfo> {
		const { username, _id } = Meteor.user()!;

		return {
			id: _id,
			username: username!,
			avatarUrl: this.getUserAvatarUrl(username!) || '',
		};
	}
}
