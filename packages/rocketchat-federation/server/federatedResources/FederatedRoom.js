import FederatedResource from './FederatedResource';

import FederatedUser from './FederatedUser';

class FederatedRoom extends FederatedResource {
	constructor(localPeerIdentifier, roomOrFederatedRoom, extras = {}) {
		super('room');

		if (!roomOrFederatedRoom) {
			throw new Error('roomOrFederatedRoom param cannot be empty');
		}

		this.localPeerIdentifier = localPeerIdentifier;

		if (roomOrFederatedRoom.resourceName) {
			// If resourceName exists, it means it is a federated resource
			const federatedRoomObject = roomOrFederatedRoom;

			const { room, federatedOwner: federatedOwnerObject, federatedUsers } = federatedRoomObject;

			// Make sure room dates are correct
			room.ts = new Date(room.ts);
			room._updatedAt = new Date(room._updatedAt);

			// Set room property
			this.room = room;

			// Set the owner
			this.federatedOwner = new FederatedUser(localPeerIdentifier, federatedOwnerObject);

			// Set the users
			this.federatedUsers = [];

			for (const federatedUserObject of federatedUsers) {
				this.federatedUsers.push(new FederatedUser(localPeerIdentifier, federatedUserObject));
			}
		} else {
			// If resourceName does not exist, this is a common resource
			const room = roomOrFederatedRoom;

			// Set the name
			if (room.t !== 'd' && room.name.indexOf('@') === -1) {
				room.name = `${ room.name }@${ localPeerIdentifier }`;
			}

			// Set the federated owner
			const { owner } = extras;

			if (!owner && room.federation) {
				this.federatedOwner = FederatedUser.loadByFederationId(localPeerIdentifier, room.federation.ownerId);
			} else {
				this.federatedOwner = new FederatedUser(localPeerIdentifier, owner);
			}

			// Set base federation
			room.federation = room.federation || {
				_id: room._id,
				peer: localPeerIdentifier,
				ownerId: this.federatedOwner.getFederationId(),
			};

			// Set room property
			this.room = room;

			// Refresh federation
			this.refreshFederation();
		}
	}

	refreshFederation() {
		const { localPeerIdentifier, room } = this;

		// Initialize federatedUsers
		this.federatedUsers = [];

		// Get all room users
		const users = FederatedRoom.loadRoomUsers(room);

		// Prepare the federated users
		let federation = {
			peers: [],
			users: [],
		};

		// Check all the peers
		for (const user of users) {
			const federatedUser = new FederatedUser(localPeerIdentifier, user);

			// Keep the federated user
			this.federatedUsers.push(federatedUser);

			// Add federation data to the room
			const { user: { federation: { _id, peer } } } = federatedUser;

			federation.peers.push(peer);
			federation.users.push({ _id, peer });
		}

		federation.peers = [...new Set(federation.peers)];

		federation = Object.assign(room.federation || {}, federation);

		// Prepare the room
		room.federation = federation;

		// Update the room
		RocketChat.models.Rooms.update(room._id, { $set: { federation } });
	}

	getFederationId() {
		return this.room.federation._id;
	}

	getPeers() {
		return this.room.federation.peers;
	}

	getLocalRoom() {
		this.log('getLocalRoom');

		const { localPeerIdentifier, room, room: { federation } } = this;

		const localRoom = Object.assign({}, room);

		if (federation.peer === localPeerIdentifier) {
			if (localRoom.t !== 'd') {
				localRoom.name = room.name.split('@')[0];
			}
		}

		return localRoom;
	}

	createUsers() {
		this.log('createUsers');

		const { federatedUsers } = this;

		// Create, if needed, all room's users
		for (const federatedUser of federatedUsers) {
			federatedUser.create();
		}
	}

	create() {
		this.log('create');

		// Get the local room object (with or without suffixes)
		const localRoomObject = this.getLocalRoom();

		// Grab the federation id
		const { federation: { _id: federationId } } = localRoomObject;

		// Check if the user exists
		let localRoom = FederatedRoom.loadByFederationId(this.localPeerIdentifier, federationId);

		// Create if needed
		if (!localRoom) {
			delete localRoomObject._id;

			localRoom = localRoomObject;

			const { t: type, name, broadcast, customFields, federation, sysMes } = localRoom;
			const { federatedOwner, federatedUsers } = this;

			// Get usernames for the owner and members
			const ownerUsername = federatedOwner.user.username;
			const members = [];

			if (type !== 'd') {
				for (const federatedUser of federatedUsers) {
					const localUser = federatedUser.getLocalUser();
					members.push(localUser.username);
				}
			} else {
				for (const federatedUser of federatedUsers) {
					const localUser = federatedUser.getLocalUser();
					members.push(localUser);
				}
			}

			// Is this a broadcast channel? Then mute everyone but the owner
			let muted = [];

			if (broadcast) {
				muted = members.filter((u) => u !== ownerUsername);
			}

			// Set the extra data and create room options
			let extraData = {
				federation,
			};

			let createRoomOptions = {
				subscriptionExtra: {
					alert: true,
					open: true,
				},
			};

			if (type !== 'd') {
				extraData = Object.assign(extraData, {
					broadcast,
					customFields,
					encrypted: false, // Always false for now
					muted,
					sysMes,
				});

				createRoomOptions = Object.assign(extraData, {
					nameValidationRegex: '^[0-9a-zA-Z-_.@]+$',
					subscriptionExtra: {
						alert: true,
					},
				});
			}

			// Create the room
			const { rid } = RocketChat.createRoom(type, name, ownerUsername, members, false, extraData, createRoomOptions);

			localRoom._id = rid;
		}

		return localRoom;
	}
}

FederatedRoom.loadByFederationId = function loadByFederationId(localPeerIdentifier, federationId) {
	const localRoom = RocketChat.models.Rooms.findOne({ 'federation._id': federationId });

	if (!localRoom) { return; }

	return new FederatedRoom(localPeerIdentifier, localRoom);
};

FederatedRoom.loadRoomUsers = function loadRoomUsers(room) {
	const subscriptions = RocketChat.models.Subscriptions.findByRoomIdWhenUsernameExists(room._id, { fields: { 'u._id': 1 } }).fetch();
	const userIds = subscriptions.map((s) => s.u._id);
	return RocketChat.models.Users.findUsersWithUsernameByIds(userIds).fetch();
};

FederatedRoom.isFederated = function isFederated(localPeerIdentifier, room, options = {}) {
	this.log('federated-room', `${ room._id } - isFederated?`);

	let isFederated = false;

	if (options.checkUsingUsers) {
		// Get all room users
		const users = FederatedRoom.loadRoomUsers(room);

		// Check all the users
		for (const user of users) {
			if (user.federation && user.federation.peer !== localPeerIdentifier) {
				isFederated = true;
				break;
			}
		}
	} else {
		isFederated = room.federation && room.federation.peers.length > 1;
	}

	this.log('federated-room', `${ room._id } - isFederated? ${ isFederated ? 'yes' : 'no' }`);

	return isFederated;
};

export default FederatedRoom;
