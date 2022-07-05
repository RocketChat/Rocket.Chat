import { UserStatusConnection, UserType } from '@rocket.chat/apps-engine/definition/users';

import { Users } from '../../../models/server';

export class AppUsersConverter {
	constructor(orch) {
		this.orch = orch;
	}

	convertById(userId) {
		const user = Users.findOneById(userId);

		return this.convertToApp(user);
	}

	convertByUsername(username) {
		const user = Users.findOneByUsername(username);

		return this.convertToApp(user);
	}

	convertToApp(user) {
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

	convertToRocketChat(user) {
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
			status: user.status,
			statusConnection: user.statusConnection,
			utcOffset: user.utfOffset,
			createdAt: user.createdAt,
			_updatedAt: user.updatedAt,
			lastLogin: user.lastLoginAt,
			appId: user.appId,
		};
	}

	_convertUserTypeToEnum(type) {
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
				return type.toUpperCase();
		}
	}

	_convertStatusConnectionToEnum(username, userId, status) {
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
				return !status ? UserStatusConnection.OFFLINE : status.toUpperCase();
		}
	}
}
