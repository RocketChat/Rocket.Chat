import type { IAppServerOrchestrator, IAppUsersConverter, IAppsUser } from '@rocket.chat/apps';
import { UserStatusConnection, UserType } from '@rocket.chat/apps-engine/definition/users';
import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import { removeEmpty } from '@rocket.chat/tools';

export class AppUsersConverter implements IAppUsersConverter {
	constructor(protected readonly orch: IAppServerOrchestrator) {
		this.orch = orch;
	}

	async convertById(userId: IUser['_id']): Promise<IAppsUser | undefined> {
		const user = await Users.findOneById(userId);

		return this.convertToApp(user);
	}

	async convertByUsername(username: IUser['username']): Promise<IAppsUser | undefined> {
		if (!username) {
			return undefined;
		}

		const user = await Users.findOneByUsername(username);

		return this.convertToApp(user);
	}

	convertToApp(user: undefined | null): undefined;

	convertToApp(user: IUser): IAppsUser;

	convertToApp(user: IUser | undefined | null): IAppsUser | undefined;

	convertToApp(user: IUser | undefined | null): IAppsUser | undefined {
		if (!user) {
			return undefined;
		}

		const type = this._convertUserTypeToEnum(user.type);
		const statusConnection = this._convertStatusConnectionToEnum(user.username, user._id, user.statusConnection);

		return {
			id: user._id,
			username: user.username,
			emails: user.emails,
			type,
			isEnabled: user.active,
			name: user.name,
			roles: user.roles,
			bio: user.bio,
			status: user.status,
			statusText: user.statusText,
			statusConnection,
			utcOffset: user.utcOffset,
			createdAt: user.createdAt,
			updatedAt: user._updatedAt,
			lastLoginAt: user.lastLogin,
			appId: (user as { appId?: string }).appId,
			customFields: user.customFields,
			isFederated: user.federated,
			federation: user.federation,
			sipExtension: user.freeSwitchExtension,
			settings: {
				preferences: {
					...(user?.settings?.preferences?.language && { language: user.settings.preferences.language }),
				},
			},
		} as unknown as IAppsUser;
	}

	convertToRocketChat(user: undefined | null): undefined;

	convertToRocketChat(user: IAppsUser): IUser;

	convertToRocketChat(user: IAppsUser | undefined | null): IUser | undefined;

	convertToRocketChat(user: IAppsUser | undefined | null): IUser | undefined {
		if (!user) {
			return undefined;
		}

		return removeEmpty({
			_id: user.id,
			username: user.username,
			emails: user.emails,
			type: user.type,
			active: user.isEnabled,
			name: user.name,
			roles: user.roles,
			bio: user.bio,
			status: user.status,
			statusConnection: user.statusConnection,
			// Prefer the correct `utcOffset`; keep the historical `utfOffset` typo as a compatibility fallback.
			utcOffset: user.utcOffset ?? (user as { utfOffset?: number }).utfOffset,
			createdAt: user.createdAt,
			_updatedAt: user.updatedAt,
			lastLogin: user.lastLoginAt,
			appId: user.appId,
			federated: user.isFederated,
			federation: user.federation,
			freeSwitchExtension: user.sipExtension,
		}) as unknown as IUser;
	}

	_convertUserTypeToEnum(type: IUser['type']): UserType {
		switch (type) {
			case 'user':
				return UserType.USER;
			case 'bot':
				return UserType.BOT;
			case 'app':
				return UserType.APP;
			case '':
			case undefined:
				return UserType.UNKNOWN;
			default:
				console.warn(`A new user type has been added that the Apps don't know about? "${type}"`);
				return type.toUpperCase() as UserType;
		}
	}

	_convertStatusConnectionToEnum(
		username: IUser['username'],
		userId: IUser['_id'],
		status: IUser['statusConnection'],
	): UserStatusConnection {
		switch (status) {
			case 'offline':
				return UserStatusConnection.OFFLINE;
			case 'online':
				return UserStatusConnection.ONLINE;
			case 'away':
				return UserStatusConnection.AWAY;
			case 'busy':
				return UserStatusConnection.BUSY;
			case undefined:
				// This is needed for Livechat guests and Rocket.Cat user.
				return UserStatusConnection.UNDEFINED;
			default:
				console.warn(
					`The user ${username} (${userId}) does not have a valid status (offline, online, away, or busy). It is currently: "${status}"`,
				);
				return (!status ? UserStatusConnection.OFFLINE : status.toUpperCase()) as UserStatusConnection;
		}
	}
}
