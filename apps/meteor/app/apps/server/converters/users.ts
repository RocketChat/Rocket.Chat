import { UserStatusConnection, UserType, IUser as IUserFromAppsEngine } from '@rocket.chat/apps-engine/definition/users';
import type { IUser } from '@rocket.chat/core-typings';
import { UserStatus } from '@rocket.chat/core-typings';

import { Users } from '../../../models/server';
import { AppServerOrchestrator } from '../orchestrator';

export class AppUsersConverter {
	orch: AppServerOrchestrator;

	constructor(orch: AppServerOrchestrator) {
		this.orch = orch;
	}

	convertById(userId: string): IUserFromAppsEngine | undefined {
		const user = Users.findOneById(userId);

		return this.convertToApp(user);
	}

	convertByUsername(username: string): IUserFromAppsEngine | undefined {
		const user = Users.findOneByUsername(username);

		return this.convertToApp(user);
	}

	convertToApp(user: Required<IUser>): IUserFromAppsEngine | undefined {
		if (!user) {
			return undefined;
		}

		const type = this._convertUserTypeToEnum(user.type);
		const statusConnection = this._convertStatusConnectionToEnum(user.username, user._id, user.statusConnection);

		return {
			id: user._id,
			username: user.username,
			emails: user.emails.map((email) => ({
				...email,
				verified: email.verified || false,
			})),
			type,
			isEnabled: user.active,
			name: user.name,
			roles: user.roles,
			status: user.status,
			statusConnection,
			utcOffset: user.utcOffset,
			createdAt: user.createdAt,
			updatedAt: user._updatedAt,
			lastLoginAt: user.lastLogin,
			appId: user.appId,
			customFields: user.customFields,
			settings: {
				preferences: {
					...(user?.settings?.preferences?.language && { language: user.settings.preferences.language }),
				},
			},
		};
	}

	convertToRocketChat(user: IUserFromAppsEngine): IUser | undefined {
		if (!user) {
			return undefined;
		}

		return {
			_id: user.id,
			username: user.username,
			emails: user.emails,
			type: user.type,
			active: user.isEnabled,
			name: user.name,
			roles: user.roles,
			status: this.getUserStatus(user.status),
			statusConnection: user.statusConnection,
			utcOffset: user.utcOffset,
			createdAt: user.createdAt,
			_updatedAt: user.updatedAt,
			lastLogin: user.lastLoginAt,
			appId: user.appId,
		};
	}

	private getUserStatus(status: string): UserStatus {
		switch (status) {
			case 'offline':
				return UserStatus.OFFLINE;
			case 'online':
				return UserStatus.ONLINE;
			case 'away':
				return UserStatus.AWAY;
			case 'busy':
				return UserStatus.BUSY;
			default:
				return UserStatus.OFFLINE;
		}
	}

	private _convertUserTypeToEnum(type: string): UserType {
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

	private _convertStatusConnectionToEnum(username: string, userId: string, status: string): UserStatusConnection {
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
				return !status ? UserStatusConnection.OFFLINE : (status.toUpperCase() as UserStatusConnection);
		}
	}
}
