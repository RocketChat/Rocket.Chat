import type { IUser } from '@rocket.chat/core-typings';
import { UserStatus } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Rooms, Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';
import type { Filter, FindCursor } from 'mongodb';

import { removeUserFromRoomMethod } from '../../../server/methods/removeUserFromRoom';
import { hasRoleAsync } from '../../authorization/server/functions/hasRole';
import { addUserToRole } from '../../authorization/server/methods/addUserToRole';
import { removeUserFromRole } from '../../authorization/server/methods/removeUserFromRole';
import { addUsersToRoomMethod } from '../../lib/server/methods/addUsersToRoom';
import { settings } from '../../settings/server';

/**
 * BotHelpers helps bots
 * "private" properties use meteor collection cursors, so they stay reactive
 * "public" properties use getters to fetch and filter collections as array
 */
class BotHelpers {
	private queries: {
		online: Filter<IUser>;
		users: Filter<IUser>;
	};

	private userFields: Record<string, 1>;

	private _allUsers: FindCursor<IUser>;

	private _onlineUsers: FindCursor<IUser>;

	constructor() {
		this.queries = {
			online: { status: { $ne: UserStatus.OFFLINE } },
			users: { roles: { $not: { $all: ['bot'] } } },
		};
	}

	// setup collection cursors with array of fields from setting
	setupCursors(fieldsSetting: string | string[]) {
		this.userFields = {};
		if (typeof fieldsSetting === 'string') {
			fieldsSetting = fieldsSetting.split(',');
		}
		fieldsSetting.forEach((n) => {
			this.userFields[n.trim()] = 1;
		});
		this._allUsers = Users.find(this.queries.users, { projection: this.userFields });
		this._onlineUsers = Users.find({ $and: [this.queries.users, this.queries.online] }, { projection: this.userFields });
	}

	// request methods or props as arguments to Meteor.call
	async request(prop: keyof this, ...params: unknown[]): Promise<any> {
		const p = this[prop];

		if (typeof p === 'undefined') {
			return null;
		}
		if (typeof p === 'function') {
			return p(...params);
		}

		return p;
	}

	async addUserToRole(userName: string, roleId: string, userId: string): Promise<void> {
		await addUserToRole(userId, roleId, userName);
	}

	async removeUserFromRole(userName: string, roleId: string, userId: string): Promise<void> {
		await removeUserFromRole(userId, roleId, userName);
	}

	async addUserToRoom(userName: string, room: string): Promise<void> {
		const foundRoom = await Rooms.findOneByIdOrName(room);

		if (!foundRoom) {
			throw new Meteor.Error('invalid-channel');
		}

		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'addUserToRoom' });
		}
		await addUsersToRoomMethod(userId, {
			rid: foundRoom._id,
			users: [userName],
		});
	}

	async removeUserFromRoom(userName: string, room: string) {
		const foundRoom = await Rooms.findOneByIdOrName(room);

		if (!foundRoom) {
			throw new Meteor.Error('invalid-channel');
		}
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user');
		}
		await removeUserFromRoomMethod(userId, { rid: foundRoom._id, username: userName });
	}

	// generic error whenever property access insufficient to fill request
	requestError() {
		throw new Meteor.Error('error-not-allowed', 'Bot request not allowed', {
			method: 'botRequest',
			action: 'bot_request',
		});
	}

	// "public" properties accessed by getters
	// allUsers / onlineUsers return whichever properties are enabled by settings
	get allUsers() {
		if (!Object.keys(this.userFields).length) {
			this.requestError();
			return false;
		}
		return this._allUsers.toArray();
	}

	get onlineUsers() {
		if (!Object.keys(this.userFields).length) {
			this.requestError();
			return false;
		}
		return this._onlineUsers.toArray();
	}

	get allUsernames() {
		return (async () => {
			if (!this.userFields.hasOwnProperty('username')) {
				this.requestError();
				return false;
			}
			return (await this._allUsers.toArray()).map((user) => user.username);
		})();
	}

	get onlineUsernames() {
		return (async () => {
			if (!this.userFields.hasOwnProperty('username')) {
				this.requestError();
				return false;
			}
			return (await this._onlineUsers.toArray()).map((user) => user.username);
		})();
	}

	get allNames() {
		return (async () => {
			if (!this.userFields.hasOwnProperty('name')) {
				this.requestError();
				return false;
			}
			return (await this._allUsers.toArray()).map((user) => user.name);
		})();
	}

	get onlineNames() {
		return (async () => {
			if (!this.userFields.hasOwnProperty('name')) {
				this.requestError();
				return false;
			}
			return (await this._onlineUsers.toArray()).map((user) => user.name);
		})();
	}

	get allIDs() {
		return (async () => {
			if (!this.userFields.hasOwnProperty('_id') || !this.userFields.hasOwnProperty('username')) {
				this.requestError();
				return false;
			}
			return (await this._allUsers.toArray()).map((user) => ({ id: user._id, name: user.username }));
		})();
	}

	get onlineIDs() {
		return (async () => {
			if (!this.userFields.hasOwnProperty('_id') || !this.userFields.hasOwnProperty('username')) {
				this.requestError();
				return false;
			}
			return (await this._onlineUsers.toArray()).map((user) => ({ id: user._id, name: user.username }));
		})();
	}
}

// add class to meteor methods
const botHelpers = new BotHelpers();

// init cursors with fields setting and update on setting change
settings.watch<string>('BotHelpers_userFields', (value) => {
	botHelpers.setupCursors(value);
});

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		botRequest: (prop: keyof BotHelpers, ...params: unknown[]) => Promise<unknown>;
	}
}

Meteor.methods<ServerMethods>({
	async botRequest(...args) {
		const userID = Meteor.userId();
		if (userID && (await hasRoleAsync(userID, 'bot'))) {
			return botHelpers.request(...args, userID);
		}
		throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'botRequest' });
	},
});
