import { EventEmitter } from 'events';

import { DDP_EVENTS } from './constants';
import { Account, Presence, MeteorService } from '../../../../server/sdk';
import { USER_STATUS } from '../../../../definition/UserStatus';
import { Server } from './Server';
import { AutoUpdateRecord } from '../../../../server/sdk/types/IMeteor';

export const server = new Server();

export const events = new EventEmitter();

// TODO: remove, this was replaced by stream-notify-user/[user-id]/userData
// server.subscribe('userData', async function(publication) {
// 	if (!publication.uid) {
// 		throw new Error('user should be connected');
// 	}

// 	const key = `${ STREAMER_EVENTS.USER_CHANGED }/${ publication.uid }`;
// 	await User.addSubscription(publication, key);
// 	publication.once('stop', () => User.removeSubscription(publication, key));
// 	publication.ready();
// });

// TODO: remove, this was replaced by stream-notify-logged/user-status, check if sending this data
// server.subscribe('activeUsers', function(publication) {
// 	publication.ready();
// });

server.publish('meteor.loginServiceConfiguration', function(pub) {
	// TODO implement to be compatible with meteor's web client
	pub.ready();
});

const autoUpdateRecords = new Map<string, AutoUpdateRecord>();

MeteorService.getLastAutoUpdateClientVersions().then((records) => {
	records.forEach((record) => autoUpdateRecords.set(record._id, record));
});

const autoUpdateCollection = 'meteor_autoupdate_clientVersions';
server.publish(autoUpdateCollection, function(pub) {
	autoUpdateRecords.forEach((record) => pub.added(autoUpdateCollection, record._id, record));

	const fn = (record: any): void => {
		autoUpdateRecords.set(record._id, record);
		pub.changed(autoUpdateCollection, record._id, record);
	};

	events.on('meteor.autoUpdateClientVersionChanged', fn);

	pub.once('stop', () => {
		events.removeListener('meteor.autoUpdateClientVersionChanged', fn);
	});

	pub.ready();
});

server.methods({
	async login({ resume, user, password }: {resume: string; user: {username: string}; password: string}) {
		const result = await Account.login({ resume, user, password });
		if (!result) {
			throw new Error('login error');
		}

		this.uid = result.uid;

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
		const { uid } = this;
		return Presence.setStatus(uid, status);
	},
	'UserPresence:online'() {
		const { uid, session } = this;
		return Presence.setConnectionStatus(uid, USER_STATUS.ONLINE, session);
	},
	'UserPresence:away'() {
		const { uid, session } = this;
		return Presence.setConnectionStatus(uid, USER_STATUS.AWAY, session);
	},
	'setUserStatus'(status, statusText) {
		const { uid } = this;
		return Presence.setStatus(uid, status, statusText);
	},
});

server.on(DDP_EVENTS.LOGGED, ({ uid, session }) => {
	Presence.newConnection(uid, session);
});

server.on(DDP_EVENTS.DISCONNECTED, ({ uid, session }) => {
	if (!uid) {
		return;
	}
	Presence.removeConnection(uid, session);
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

// server.on(DDP_EVENTS.DISCONNECTED, ({ uid }) => {
// 	broker.emit('metrics.update', {
// 		name: 'streamer_users_connected',
// 		method: 'dec',
// 		labels: {
// 			nodeID: broker.nodeID,
// 		},
// 	});
// 	if (uid) {
// 		broker.emit('metrics.update', {
// 			name: 'streamer_users_logged',
// 			method: 'dec',
// 			labels: {
// 				nodeID: broker.nodeID,
// 			},
// 		});
// 	}
// });
