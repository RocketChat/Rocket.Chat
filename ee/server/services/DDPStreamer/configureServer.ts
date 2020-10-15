import { EventEmitter } from 'events';

import { DDP_EVENTS } from './constants';
import { Account, Presence, MeteorService } from '../../../../server/sdk';
import { USER_STATUS } from '../../../../definition/UserStatus';
import { Server } from './Server';
import { AutoUpdateRecord } from '../../../../server/sdk/types/IMeteor';

export const server = new Server();

export const events = new EventEmitter();

const loginServiceConfigurationCollection = 'meteor_accounts_loginServiceConfiguration';
const loginServiceConfigurationPublication = 'meteor.loginServiceConfiguration';
const loginServices = new Map<string, any>();

MeteorService.getLoginServiceConfiguration().then((records) => records.forEach((record) => loginServices.set(record._id, record)));

server.publish(loginServiceConfigurationPublication, async function() {
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

const autoUpdateRecords = new Map<string, AutoUpdateRecord>();

MeteorService.getLastAutoUpdateClientVersions().then((records) => {
	records.forEach((record) => autoUpdateRecords.set(record._id, record));
});

const autoUpdateCollection = 'meteor_autoupdate_clientVersions';
server.publish(autoUpdateCollection, function() {
	autoUpdateRecords.forEach((record) => this.added(autoUpdateCollection, record._id, record));

	const fn = (record: any): void => {
		autoUpdateRecords.set(record._id, record);
		this.changed(autoUpdateCollection, record._id, record);
	};

	events.on('meteor.autoUpdateClientVersionChanged', fn);

	this.onStop(() => {
		events.removeListener('meteor.autoUpdateClientVersionChanged', fn);
	});

	this.ready();
});

server.methods({
	async login({ resume, user, password }: {resume: string; user: {username: string}; password: string}) {
		const result = await Account.login({ resume, user, password });
		if (!result) {
			throw new Error('login error');
		}

		this.userId = result.uid;
		this.userToken = result.token;

		this.emit(DDP_EVENTS.LOGGED);

		server.emit(DDP_EVENTS.LOGGED, this);

		return {
			id: result.uid,
			token: result.token,
			tokenExpires: result.tokenExpires,
			type: result.type,
		};
	},
	'UserPresence:setDefaultStatus'(status) {
		const { userId } = this;
		return Presence.setStatus(userId, status);
	},
	'UserPresence:online'() {
		const { userId, session } = this;
		return Presence.setConnectionStatus(userId, USER_STATUS.ONLINE, session);
	},
	'UserPresence:away'() {
		const { userId, session } = this;
		return Presence.setConnectionStatus(userId, USER_STATUS.AWAY, session);
	},
	'setUserStatus'(status, statusText) {
		const { userId } = this;
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

server.on(DDP_EVENTS.LOGGED, ({ userId, session }) => {
	Presence.newConnection(userId, session);
});

server.on(DDP_EVENTS.DISCONNECTED, ({ userId, session }) => {
	if (!userId) {
		return;
	}
	Presence.removeConnection(userId, session);
});

// TODO: resolve metrics
// server.on(DDP_EVENTS.CONNECTED, () => {
// 	broker.emit('metrics.update', {
// 		name: 'streamer_users_connected',
// 		method: 'inc',
// 		labels: {
// 			nodeID: broker.nodeID,
// 		},
// 	});
// });

// server.on(DDP_EVENTS.LOGGED, (/* client*/) => {
// 	broker.emit('metrics.update', {
// 		name: 'streamer_users_logged',
// 		method: 'inc',
// 		labels: {
// 			nodeID: broker.nodeID,
// 		},
// 	});
// });

// server.on(DDP_EVENTS.DISCONNECTED, ({ userId }) => {
// 	broker.emit('metrics.update', {
// 		name: 'streamer_users_connected',
// 		method: 'dec',
// 		labels: {
// 			nodeID: broker.nodeID,
// 		},
// 	});
// 	if (userId) {
// 		broker.emit('metrics.update', {
// 			name: 'streamer_users_logged',
// 			method: 'dec',
// 			labels: {
// 				nodeID: broker.nodeID,
// 			},
// 		});
// 	}
// });
