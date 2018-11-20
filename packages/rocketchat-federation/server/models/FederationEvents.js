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

	// Create a `directRoomCreated(drc)` event
	directRoomCreated(federatedRoom, options = {}) {
		const peers = FederationEvents.normalizePeers(federatedRoom.getPeers(), options);

		const payload = {
			room: federatedRoom.getRoom(),
			owner: federatedRoom.getOwner(),
			users: federatedRoom.getUsers(),
		};

		return this.createEventForPeers('drc', payload, peers);
	}

	// Create a `roomCreated(roc)` event
	roomCreated(federatedRoom, options = {}) {
		const peers = FederationEvents.normalizePeers(federatedRoom.getPeers(), options);

		const payload = {
			room: federatedRoom.getRoom(),
			owner: federatedRoom.getOwner(),
			users: federatedRoom.getUsers(),
		};

		return this.createEventForPeers('roc', payload, peers);
	}

	// Create a `userJoined(usj)` event
	userJoined(federatedRoom, federatedUser, options = {}) {
		const peers = FederationEvents.normalizePeers(federatedRoom.getPeers(), options);

		const payload = {
			federated_room_id: federatedRoom.getFederationId(),
			user: federatedUser.getUser(),
		};

		return this.createEventForPeers('usj', payload, peers);
	}

	// Create a `userAdded(usa)` event
	userAdded(federatedRoom, federatedUser, federatedInviter, options = {}) {
		const peers = FederationEvents.normalizePeers(federatedRoom.getPeers(), options);

		const payload = {
			federated_room_id: federatedRoom.getFederationId(),
			federated_inviter_id: federatedInviter.getFederationId(),
			user: federatedUser.getUser(),
		};

		return this.createEventForPeers('usa', payload, peers);
	}

	// Create a `userLeft(usl)` event
	userLeft(federatedRoom, federatedUser, options = {}) {
		const peers = FederationEvents.normalizePeers(federatedRoom.getPeers(), options);

		const payload = {
			federated_room_id: federatedRoom.getFederationId(),
			federated_user_id: federatedUser.getFederationId(),
		};

		return this.createEventForPeers('usl', payload, peers);
	}

	// Create a `userRemoved(usr)` event
	userRemoved(federatedRoom, federatedUser, federatedRemovedByUser, options = {}) {
		const peers = FederationEvents.normalizePeers(federatedRoom.getPeers(), options);

		const payload = {
			federated_room_id: federatedRoom.getFederationId(),
			federated_user_id: federatedUser.getFederationId(),
			federated_removed_by_user_id: federatedRemovedByUser.getFederationId(),
		};

		return this.createEventForPeers('usr', payload, peers);
	}

	// Create a `userMuted(usm)` event
	userMuted(federatedRoom, federatedUser, federatedMutedByUser, options = {}) {
		const peers = FederationEvents.normalizePeers(federatedRoom.getPeers(), options);

		const payload = {
			federated_room_id: federatedRoom.getFederationId(),
			federated_user_id: federatedUser.getFederationId(),
			federated_muted_by_user_id: federatedMutedByUser.getFederationId(),
		};

		return this.createEventForPeers('usm', payload, peers);
	}

	// Create a `userUnmuted(usu)` event
	userUnmuted(federatedRoom, federatedUser, federatedUnmutedByUser, options = {}) {
		const peers = FederationEvents.normalizePeers(federatedRoom.getPeers(), options);

		const payload = {
			federated_room_id: federatedRoom.getFederationId(),
			federated_user_id: federatedUser.getFederationId(),
			federated_unmuted_by_user_id: federatedUnmutedByUser.getFederationId(),
		};

		return this.createEventForPeers('usu', payload, peers);
	}

	// Create a `messageCreated(msc)` event
	messageCreated(federatedRoom, federatedMessage, options = {}) {
		const peers = FederationEvents.normalizePeers(federatedRoom.getPeers(), options);

		const payload = {
			message: federatedMessage.getMessage(),
		};

		return this.createEventForPeers('msc', payload, peers);
	}

	// Create a `messageUpdated(msu)` event
	messageUpdated(federatedRoom, federatedMessage, federatedUser, options = {}) {
		const peers = FederationEvents.normalizePeers(federatedRoom.getPeers(), options);

		const payload = {
			message: federatedMessage.getMessage(),
			federated_user_id: federatedUser.getFederationId(),
		};

		return this.createEventForPeers('msu', payload, peers);
	}

	// Create a `deleteMessage(msd)` event
	messageDeleted(federatedRoom, federatedMessage, options = {}) {
		const peers = FederationEvents.normalizePeers(federatedRoom.getPeers(), options);

		const payload = {
			federated_message_id: federatedMessage.getFederationId(),
		};

		return this.createEventForPeers('msd', payload, peers);
	}

	// Create a `messagesRead(msr)` event
	messagesRead(federatedRoom, federatedUser, options = {}) {
		const peers = FederationEvents.normalizePeers(federatedRoom.getPeers(), options);

		const payload = {
			federated_room_id: federatedRoom.getFederationId(),
			federated_user_id: federatedUser.getFederationId(),
		};

		return this.createEventForPeers('msr', payload, peers);
	}

	// Create a `messagesSetReaction(mrs)` event
	messagesSetReaction(federatedRoom, federatedMessage, federatedUser, reaction, shouldReact, options = {}) {
		const peers = FederationEvents.normalizePeers(federatedRoom.getPeers(), options);

		const payload = {
			federated_room_id: federatedRoom.getFederationId(),
			federated_message_id: federatedMessage.getFederationId(),
			federated_user_id: federatedUser.getFederationId(),
			reaction,
			shouldReact,
		};

		return this.createEventForPeers('mrs', payload, peers);
	}

	// Create a `messagesUnsetReaction(mru)` event
	messagesUnsetReaction(federatedRoom, federatedMessage, federatedUser, reaction, shouldReact, options = {}) {
		const peers = FederationEvents.normalizePeers(federatedRoom.getPeers(), options);

		const payload = {
			federated_room_id: federatedRoom.getFederationId(),
			federated_message_id: federatedMessage.getFederationId(),
			federated_user_id: federatedUser.getFederationId(),
			reaction,
			shouldReact,
		};

		return this.createEventForPeers('mru', payload, peers);
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
