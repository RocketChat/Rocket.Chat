// import { Streamer } from './Streamer';
// import { STREAM_NAMES } from './constants';
import { applyMeteor } from '../services/utils';

const normalize = {
	update: 'updated',
	insert: 'inserted',
	remove: 'removed',
};

const handlemessages = applyMeteor((operationType, documentKey) => {
	switch (operationType) {
		case 'insert':
		case 'update':
			const message = RocketChat.models.Messages.findOne(documentKey);
			// Streamer.emitWithoutBroadcast('__my_messages__', message, {});
			RocketChat.Services.broadcast('message', { action: normalize[operationType], message });
		// return Streamer.broadcast({ stream: STREA	M_NAMES['room-messages'], eventName: message.rid, args: message });
		// publishMessage(operationType, message);
	}

});

const handlesubscriptions = applyMeteor((operationType, documentKey) => {
	let subscription;
	switch (operationType) {
		case 'insert':
		case 'update':
			subscription = RocketChat.models.Subscriptions.findOne(documentKey/* , { fields }*/);
			break;

		case 'remove':
			subscription = RocketChat.models.Subscriptions.trashFindOne(documentKey, { fields: { u: 1, rid: 1 } });
			break;
		default:
			return;
	}

	RocketChat.Services.broadcast('subscription', { action: normalize[operationType], subscription });
});

const handlerooms = applyMeteor((operationType, documentKey) => {
	let room;
	switch (operationType) {
		case 'insert':
		case 'update':
			room = RocketChat.models.Rooms.findOne(documentKey/* , { fields }*/);
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

const handlesettings = applyMeteor((operationType, documentKey) => {
	let setting;
	switch (operationType) {
		case 'insert':
		case 'update':
			setting = RocketChat.models.Settings.findOne(documentKey/* , { fields }*/);
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

export default {
	name: 'hub',
	created() {
		RocketChat.models.Messages.model.rawCollection().watch().on('change', async function({ operationType, documentKey/* , oplog*/ }) {
			await handlemessages(operationType, documentKey);
		});
		RocketChat.models.Subscriptions.model.rawCollection().watch().on('change', async({ operationType, documentKey }) => {
			await handlesubscriptions(operationType, documentKey);
		});
		RocketChat.models.Rooms.model.rawCollection().watch().on('change', async({ operationType, documentKey }) => {
			await handlerooms(operationType, documentKey);
		});
		RocketChat.models.Settings.model.rawCollection().watch().on('change', async({ operationType, documentKey }) => {
			await handlesettings(operationType, documentKey);
		});
	},
};
