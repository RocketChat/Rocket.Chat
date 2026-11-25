import { AppsEngineUIHost } from '@rocket.chat/apps/dist/client/AppsEngineUIHost';
import type { IExternalComponentRoomInfo } from '@rocket.chat/apps/dist/client/definition/IExternalComponentRoomInfo';
import type { IExternalComponentUserInfo } from '@rocket.chat/apps/dist/client/definition/IExternalComponentUserInfo';

import { Rooms } from '../../stores';
import { RoomManager } from '../RoomManager';
import { sdk } from '../SDKClient';
import { baseURI } from '../baseURI';
import { getUserAvatarURL } from '../getUserAvatarURL';
import { getUser } from '../user';

export class RealAppsEngineUIHost extends AppsEngineUIHost {
	private _baseURL: string;

	constructor() {
		super();

		this._baseURL = baseURI.replace(/\/$/, '');
	}

	private getUserAvatarUrl(username: string) {
		const avatarUrl = getUserAvatarURL(username);
		if (!avatarUrl) {
			throw new Error(`Could not build the avatar URL for "${username}"`);
		}

		if (!avatarUrl.startsWith('http') && !avatarUrl.startsWith('data')) {
			return `${this._baseURL}${avatarUrl}`;
		}

		return avatarUrl;
	}

	async getClientRoomInfo(): Promise<IExternalComponentRoomInfo> {
		const room = RoomManager.opened ? Rooms.state.get(RoomManager.opened) : undefined;
		if (!room) {
			throw new Error('Room not found');
		}
		const { name: slugifiedName, _id: id } = room;

		let cachedMembers: IExternalComponentUserInfo[] = [];
		try {
			const { members } = await sdk.rest.get('/v1/groups.members', { roomId: id });

			cachedMembers = members.flatMap(({ _id, username }): IExternalComponentUserInfo[] =>
				username ? [{ id: _id, username, avatarUrl: this.getUserAvatarUrl(username) }] : [],
			);
		} catch (error) {
			console.warn(error);
		}

		return {
			id,
			slugifiedName: slugifiedName ?? '',
			members: cachedMembers,
		};
	}

	async getClientUserInfo(): Promise<IExternalComponentUserInfo> {
		const user = getUser();
		if (!user?.username) {
			throw new Error('No logged in user with a username');
		}
		const { username, _id } = user;

		return {
			id: _id,
			username,
			avatarUrl: this.getUserAvatarUrl(username),
		};
	}
}
