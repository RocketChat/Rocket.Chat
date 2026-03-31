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

	private getUserAvatarUrl(username: string): string {
		const avatarUrl = getUserAvatarURL(username);

		if (!avatarUrl) {
			return '';
		}

		if (!avatarUrl.startsWith('http') && !avatarUrl.startsWith('data')) {
			return `${this._baseURL}${avatarUrl}`;
		}

		return avatarUrl;
	}

	async getClientRoomInfo(): Promise<IExternalComponentRoomInfo> {
		const room = RoomManager.opened ? Rooms.state.get(RoomManager.opened) : undefined;
		if (!room) {
			throw new Error('RealAppsEngineUIHost: room is null in getClientRoomInfo');
		}
		const { name: slugifiedName, _id: id } = room;

		let cachedMembers: IExternalComponentUserInfo[] = [];
		try {
			const { members } = await sdk.rest.get('/v1/groups.members', { roomId: id });

			cachedMembers = members.reduce<IExternalComponentUserInfo[]>((acc, { _id, username }) => {
				if (typeof username === 'string' && username.length > 0) {
					acc.push({
						id: _id,
						username,
						avatarUrl: this.getUserAvatarUrl(username),
					});
				}
				return acc;
			}, []);
		} catch (error) {
			console.warn('RealAppsEngineUIHost: failed to fetch room members', error);
		}

		return {
			id,
			slugifiedName: slugifiedName ?? id,
			members: cachedMembers,
		};
	}

	async getClientUserInfo(): Promise<IExternalComponentUserInfo> {
		const user = getUser();

		if (!user) {
			throw new Error('RealAppsEngineUIHost: user is null in getClientUserInfo');
		}

		const { username, _id } = user;

		if (!username) {
			throw new Error('RealAppsEngineUIHost: username is missing on authenticated user');
		}

		return {
			id: _id,
			username,
			avatarUrl: this.getUserAvatarUrl(username),
		};
	}
}
