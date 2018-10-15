//
// We should create a time to live index in this table to remove fulfilled events
//
class FederationEvents extends RocketChat.models._Base {
	constructor() {
		super('federation_events');
	}

	setEventAsErrored(e, error) {
		this.update({ _id: e._id }, {
			$set: {
				fulfilled: false,
				lastAttemptAt: new Date(),
				error,
			},
		});
	}

	setEventAsFullfilled(e) {
		this.update({ _id: e._id }, {
			$set: { fulfilled: true },
			$unset: { error: 1 },
		});
	}

	createEvent(type, payload, peer) {
		const record = {
			t: type,
			ts: new Date(),
			fulfilled: false,
			payload,
			peer,
		};

		record._id = this.insert(record);

		this.emit('createEvent', record);

		return record;
	}

	createEventForPeers(type, payload, peers) {
		const records = [];

		for (const peer of peers) {
			const record = this.createEvent(type, payload, peer);

			records.push(record);
		}

		return records;
	}

	// Create a `directRoomCreated(dc)` event
	createDirectRoomCreated(federatedRoom, options = {}) {
		const peers = FederationEvents.normalizePeers(federatedRoom.getPeers(), options);

		const payload = {
			federatedRoom,
		};

		return this.createEventForPeers('dc', payload, peers);
	}

	// Create a `roomCreated(rc)` event
	createRoomCreated(federatedRoom, options = {}) {
		const peers = FederationEvents.normalizePeers(federatedRoom.getPeers(), options);

		const payload = {
			federated_room: federatedRoom,
		};

		return this.createEventForPeers('rc', payload, peers);
	}

	// Create a `userJoinedRoom(uj)` event
	createUserJoinedRoom(federatedRoom, federatedUser, options = {}) {
		const peers = FederationEvents.normalizePeers(federatedRoom.getPeers(), options);

		const payload = {
			federated_room_id: federatedRoom.getFederationId(),
			federated_user: federatedUser,
		};

		return this.createEventForPeers('uj', payload, peers);
	}

	// Create a `userAddedToRoom(ua)` event
	createUserAddedToRoom(federatedRoom, federatedUser, federatedInviter, options = {}) {
		const peers = FederationEvents.normalizePeers(federatedRoom.getPeers(), options);

		const payload = {
			federated_room_id: federatedRoom.getFederationId(),
			federated_user: federatedUser,
			federated_inviter_id: federatedInviter.getFederationId(),
		};

		return this.createEventForPeers('ua', payload, peers);
	}

	// Create a `userLeftRoom(ul)` event
	createUserLeftRoom(federatedRoom, federatedUser, options = {}) {
		const peers = FederationEvents.normalizePeers(federatedRoom.getPeers(), options);

		const payload = {
			federated_room_id: federatedRoom.getFederationId(),
			federated_user_id: federatedUser.getFederationId(),
		};

		return this.createEventForPeers('ul', payload, peers);
	}

	// Create a `userRemovedFromRoom(ur)` event
	createUserRemovedFromRoom(federatedRoom, federatedUser, federatedRemovedByUser, options = {}) {
		const peers = FederationEvents.normalizePeers(federatedRoom.getPeers(), options);

		const payload = {
			federated_room_id: federatedRoom.getFederationId(),
			federated_user_id: federatedUser.getFederationId(),
			federated_removed_by_user_id: federatedRemovedByUser.getFederationId(),
		};

		return this.createEventForPeers('ur', payload, peers);
	}

	// Create a `messageSent(ms)` event
	createMessageSent(federatedRoom, federatedMessage, options = {}) {
		const peers = FederationEvents.normalizePeers(federatedRoom.getPeers(), options);

		const payload = {
			federated_message: federatedMessage,
		};

		return this.createEventForPeers('ms', payload, peers);
	}

	// Get all unfulfilled events
	getUnfulfilled() {
		return this.find({ fulfilled: false }, { sort: { ts: 1 } }).fetch();
	}
}

FederationEvents.normalizePeers = function normalizePeers(basePeers, options) {
	const { peers: sentPeers, skipPeers } = options;

	let peers = sentPeers || basePeers || [];

	if (skipPeers) {
		peers = peers.filter((p) => skipPeers.indexOf(p) === -1);
	}

	return peers;
};

RocketChat.models.FederationEvents = new FederationEvents();
