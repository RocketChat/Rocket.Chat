import { EventEmitter } from 'events';

import { UserStatus } from '@rocket.chat/core-typings';

import { DDP_EVENTS, WS_ERRORS } from './constants';
import { Account, Presence, MeteorService } from '../../../../apps/meteor/server/sdk';
import { Server } from './Server';
import { MeteorError } from '../../../../apps/meteor/server/sdk/errors';
import { Autoupdate } from './lib/Autoupdate';

export const server = new Server();

export const events = new EventEmitter();

const loginServiceConfigurationCollection = 'meteor_accounts_loginServiceConfiguration';
const loginServiceConfigurationPublication = 'meteor.loginServiceConfiguration';
const loginServices = new Map<string, any>();

MeteorService.getLoginServiceConfiguration().then((records = []) => records.forEach((record) => loginServices.set(record._id, record)));

server.publish(loginServiceConfigurationPublication, async function () {
	loginServices.forEach((record) => this.added(loginServiceConfigurationCollection, record._id, record));

	const fn = (action: string, record: any): void => {
		switch (action) {
			case 'added':
			case 'changed':
				loginServices.set(record._id, record);
				this[action](loginServiceConfigurationCollection, record._id, record);
				break;
			case 'removed':
				loginServices.delete(record._id);
				this[action](loginServiceConfigurationCollection, record._id);
		}
	};

	events.on(loginServiceConfigurationPublication, fn);

	this.onStop(() => {
		events.removeListener(loginServiceConfigurationPublication, fn);
	});

	this.ready();
});

const autoUpdateCollection = 'meteor_autoupdate_clientVersions';
server.publish(autoUpdateCollection, function () {
	Autoupdate.getVersions().forEach((version, arch) => {
		this.added(autoUpdateCollection, arch, version);
	});

	const fn = (record: any): void => {
		const { _id, ...version } = record;
		this.changed(autoUpdateCollection, _id, version);
	};

	Autoupdate.on('update', fn);

	this.onStop(() => {
		Autoupdate.removeListener('update', fn);
	});

	this.ready();
});

server.methods({
	async 'login'({ resume, user, password }: { resume: string; user: { username: string }; password: string }) {
		try {
			const result = await Account.login({ resume, user, password });
			if (!result) {
				throw new MeteorError(403, "You've been logged out by the server. Please log in again");
			}

			this.userId = result.uid;
			this.userToken = result.hashedToken;
			this.connection.loginToken = result.hashedToken;

			this.emit(DDP_EVENTS.LOGGED);

			server.emit(DDP_EVENTS.LOGGED, this);

			return {
				id: result.uid,
				token: result.token,
				tokenExpires: result.tokenExpires,
				type: result.type,
			};
		} catch (error) {
			throw error;
		}
	},
	async 'logout'() {
		if (this.userToken && this.userId) {
			await Account.logout({ userId: this.userId, token: this.userToken });
		}

		this.emit(DDP_EVENTS.LOGGEDOUT);
		server.emit(DDP_EVENTS.LOGGEDOUT, this);

		this.userToken = undefined;
		this.userId = undefined;

		// Close connection after return success to the method call.
		// This ensures all the subscriptions will be closed, meteor makes it manually
		// here https://github.com/meteor/meteor/blob/2377ebe879d9b965d699f599392d4e8047eb7d78/packages/ddp-server/livedata_server.js#L781
		// re doing the default subscriptions.
		setTimeout(() => {
			this.ws.close(WS_ERRORS.CLOSE_PROTOCOL_ERROR);
		}, 1);
	},
	'UserPresence:setDefaultStatus'(status) {
		const { userId } = this;
		if (!userId) {
			return;
		}
		return Presence.setStatus(userId, status);
	},
	'UserPresence:online'() {
		const { userId, session } = this;
		if (!userId) {
			return;
		}
		return Presence.setConnectionStatus(userId, UserStatus.ONLINE, session);
	},
	'UserPresence:away'() {
		const { userId, session } = this;
		if (!userId) {
			return;
		}
		return Presence.setConnectionStatus(userId, UserStatus.AWAY, session);
	},
	'setUserStatus'(status, statusText) {
		const { userId } = this;
		if (!userId) {
			return;
		}
		return Presence.setStatus(userId, status, statusText);
	},
	// Copied from /app/livechat/server/methods/setUpConnection.js
	'livechat:setUpConnection'(data = {}) {
		const { token } = data;

		if (typeof token !== 'string') {
			return new Error('Token must be string');
		}

		if (!this.connection.livechatToken) {
			this.connection.livechatToken = token;
			this.connection.onClose(() => {
				MeteorService.notifyGuestStatusChanged(token, 'offline');
			});
		}
	},
});
