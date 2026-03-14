import { AppsEngineUIHost } from '@rocket.chat/apps-engine/client/AppsEngineUIHost';
import type { IExternalComponentRoomInfo, IExternalComponentUserInfo } from '@rocket.chat/apps-engine/client/definition';

import { getUserAvatarURL } from '../../app/utils/client/getUserAvatarURL';
import { sdk } from '../../app/utils/client/lib/SDKClient';
import { RoomManager } from '../lib/RoomManager';
import { baseURI } from '../lib/baseURI';
import { getUser } from '../lib/user';
import { Rooms } from '../stores';

export class RealAppsEngineUIHost extends AppsEngineUIHost {
	private _baseURL: string;

	constructor() {
		super();

		this._baseURL = baseURI.replace(/\/$/, '');
	}

	private getUserAvatarUrl(username: string) {
		const avatarUrl = getUserAvatarURL(username);
		if (!avatarUrl) {
			throw new Error(`[RealAppsEngineUIHost] Avatar URL not found for user "${username}"`);
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

			cachedMembers = members
				.filter((member): member is typeof member & { username: string } => Boolean(member.username))
				.map(
					({ _id, username }): IExternalComponentUserInfo => ({
						id: _id,
						username,
						avatarUrl: this.getUserAvatarUrl(username),
					}),
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
		if (!user) {
			throw new Error('[RealAppsEngineUIHost] No logged-in user found');
		}
		const { username, _id } = user;

		if (!username) {
			throw new Error('[RealAppsEngineUIHost] Logged-in user does not have a username');
		}

		return {
			id: _id,
			username,
			avatarUrl: this.getUserAvatarUrl(username) || '',
		};
	}
}
