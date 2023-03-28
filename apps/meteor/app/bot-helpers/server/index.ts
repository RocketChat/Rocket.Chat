import { Meteor } from 'meteor/meteor';
import type { Mongo } from 'meteor/mongo';
import type { IUser } from '@rocket.chat/core-typings';
import { UserStatus } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Rooms } from '@rocket.chat/models';

import { Users } from '../../models/server';
import { settings } from '../../settings/server';
import { hasRoleAsync } from '../../authorization/server/functions/hasRole';

import './settings';

/**
 * BotHelpers helps bots
 * "private" properties use meteor collection cursors, so they stay reactive
 * "public" properties use getters to fetch and filter collections as array
 */
class BotHelpers {
	private queries: {
		online: Mongo.Query<IUser>;
		users: Mongo.Query<IUser>;
	};

	private userFields: Record<string, 1>;

	private _allUsers: Mongo.Cursor<IUser>;

	private _onlineUsers: Mongo.Cursor<IUser>;

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
		this._allUsers = Users.find(this.queries.users, { fields: this.userFields });
		this._onlineUsers = Users.find({ $and: [this.queries.users, this.queries.online] }, { fields: this.userFields });
	}

	// request methods or props as arguments to Meteor.call
	request(prop: keyof this, ...params: unknown[]) {
		const p = this[prop];

		if (typeof p === 'undefined') {
			return null;
		}
		if (typeof p === 'function') {
			return p(...params);
		}

		return p;
	}

	addUserToRole(userName: string, roleId: string) {
		Meteor.call('authorization:addUserToRole', roleId, userName);
	}

	removeUserFromRole(userName: string, roleId: string) {
		Meteor.call('authorization:removeUserFromRole', roleId, userName);
	}

	async addUserToRoom(userName: string, room: string) {
		const foundRoom = await Rooms.findOneByIdOrName(room);

		if (!foundRoom) {
			throw new Meteor.Error('invalid-channel');
		}

		Meteor.call('addUserToRoom', {
			rid: foundRoom._id,
			username: userName,
		});
	}

	async removeUserFromRoom(userName: string, room: string) {
		const foundRoom = await Rooms.findOneByIdOrName(room);

		if (!foundRoom) {
			throw new Meteor.Error('invalid-channel');
		}

		Meteor.call('removeUserFromRoom', {
			rid: foundRoom._id,
			username: userName,
		});
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
		return this._allUsers.fetch();
	}

	get onlineUsers() {
		if (!Object.keys(this.userFields).length) {
			this.requestError();
			return false;
		}
		return this._onlineUsers.fetch();
	}

	get allUsernames() {
		if (!this.userFields.hasOwnProperty('username')) {
			this.requestError();
			return false;
		}
		return this._allUsers.fetch().map((user) => user.username);
	}

	get onlineUsernames() {
		if (!this.userFields.hasOwnProperty('username')) {
			this.requestError();
			return false;
		}
		return this._onlineUsers.fetch().map((user) => user.username);
	}

	get allNames() {
		if (!this.userFields.hasOwnProperty('name')) {
			this.requestError();
			return false;
		}
		return this._allUsers.fetch().map((user) => user.name);
	}

	get onlineNames() {
		if (!this.userFields.hasOwnProperty('name')) {
			this.requestError();
			return false;
		}
		return this._onlineUsers.fetch().map((user) => user.name);
	}

	get allIDs() {
		if (!this.userFields.hasOwnProperty('_id') || !this.userFields.hasOwnProperty('username')) {
			this.requestError();
			return false;
		}
		return this._allUsers.fetch().map((user) => ({ id: user._id, name: user.username }));
	}

	get onlineIDs() {
		if (!this.userFields.hasOwnProperty('_id') || !this.userFields.hasOwnProperty('username')) {
			this.requestError();
			return false;
		}
		return this._onlineUsers.fetch().map((user) => ({ id: user._id, name: user.username }));
	}
}

// add class to meteor methods
const botHelpers = new BotHelpers();

// init cursors with fields setting and update on setting change
settings.watch<string>('BotHelpers_userFields', (value) => {
	botHelpers.setupCursors(value);
});

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		botRequest: (prop: keyof BotHelpers, ...params: unknown[]) => unknown;
	}
}

Meteor.methods<ServerMethods>({
	async botRequest(...args) {
		const userID = Meteor.userId();
		if (userID && (await hasRoleAsync(userID, 'bot'))) {
			return botHelpers.request(...args);
		}
		throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'botRequest' });
	},
});
