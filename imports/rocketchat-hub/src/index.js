// import { Streamer } from './Streamer';
// import { STREAM_NAMES } from './constants';
const normalize = {
	update: 'updated',
	insert: 'inserted',
	remove: 'removed',
};

export default ({ Users, Messages, Subscriptions, Rooms, Settings, Trash }) => ({
	name: 'hub',
	created() {
		const RocketChat = {
			Services: this.broker,
		};

		Users.watch([], { fullDocument: 'updateLookup' }).on('change', async function({ operationType, /* documentKey,*/ fullDocument/* , oplog*/, updateDescription }) {
			switch (operationType) {
				case 'insert':
				case 'update':
					const { updatedFields } = updateDescription;
					// const message = await Messages.findOne(documentKey);
					const user = fullDocument;
					// Streamer.emitWithoutBroadcast('__my_messages__', message, {});
					if (updatedFields.status) {
						const { status, username, _id } = user;
						return RocketChat.Services.broadcast('userpresence', { action: normalize[operationType], user: { status, username, _id } });
					}
					RocketChat.Services.broadcast('user', { action: normalize[operationType], user });
				// return Streamer.broadcast({ stream: STREA	M_NAMES['room-messages'], eventName: message.rid, args: message });
				// publishMessage(operationType, message);
			}
		});

		Messages.watch([{
			$addFields: {
				tmpfields: {
					$objectToArray: '$updateDescription.updatedFields',
				},
			} }, {
			$match: {
				'tmpfields.k': {
					$nin: ['u.username'], // avoid flood the streamer with messages changes (by username change)
				},
			} }], { fullDocument: 'updateLookup' }).on('change', async function({ operationType, /* documentKey,*/ fullDocument/* , oplog*/ }) {
			switch (operationType) {
				case 'insert':
				case 'update':
					// const message = await Messages.findOne(documentKey);
					const message = fullDocument;
					// Streamer.emitWithoutBroadcast('__my_messages__', message, {});
					RocketChat.Services.broadcast('message', { action: normalize[operationType], message });
						// return Streamer.broadcast({ stream: STREA	M_NAMES['room-messages'], eventName: message.rid, args: message });
						// publishMessage(operationType, message);
			}
		});

		Subscriptions.watch([], { fullDocument: 'updateLookup' }).on('change', async({ operationType, documentKey, fullDocument }) => {
			let subscription;
			switch (operationType) {
				case 'insert':
				case 'update':
					// subscription = await Subscriptions.findOne(documentKey/* , { fields }*/);
					subscription = fullDocument;
					break;

				case 'remove':
					subscription = await Trash.findOne(documentKey, { fields: { u: 1, rid: 1 } });
					break;
				default:
					return;
			}

			RocketChat.Services.broadcast('subscription', { action: normalize[operationType], subscription });
		});
		Rooms.watch([], { fullDocument: 'updateLookup' }).on('change', async({ operationType, documentKey, fullDocument }) => {
			let room;
			switch (operationType) {
				case 'insert':
				case 'update':
					// room = await Rooms.findOne(documentKey/* , { fields }*/);
					room = fullDocument;
					break;

				case 'remove':
					room = documentKey;
					break;
				default:
					return;
			}
			// console.log(room, documentKey);
			RocketChat.Services.broadcast('room', { action: normalize[operationType], room });
			// RocketChat.Notifications.streamUser.__emit(data._id, operationType, data);
		});
		Settings.watch([], { fullDocument: 'updateLookup' }).on('change', async({ operationType, documentKey, fullDocument }) => {
			let setting;
			switch (operationType) {
				case 'insert':
				case 'update':
					// setting = Settings.findOne(documentKey/* , { fields }*/);
					setting = fullDocument;
					break;
				case 'remove':
					setting = documentKey;
					break;
				default:
					return;
			}

			RocketChat.Services.broadcast('setting', { action: normalize[operationType], setting });
			// RocketChat.Notifications.streamUser.__emit(data._id, operationType, data);
		});
	},
});
