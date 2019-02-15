import { Meteor } from 'meteor/meteor';
import { logger } from '../logger.js';

import qs from 'querystring';

import FederatedMessage from '../federatedResources/FederatedMessage';
import FederatedRoom from '../federatedResources/FederatedRoom';
import FederatedUser from '../federatedResources/FederatedUser';

const { FederationKeys, Subscriptions } = RocketChat.models;

class PeerClient {
	constructor(config) {
		// Keep resources we should skip callbacks
		this.callbacksToSkip = {};

		this.updateConfig(config);
	}

	updateConfig(config) {
		// General
		this.config = config;

		// Setup HubPeer
		const { hub: { url } } = this.config;

		// Remove trailing slash
		this.HubPeer = { url };
	}

	log(message) {
		logger.info(`[federation-client] ${ message }`);
	}

	// ###########
	//
	// Registering
	//
	// ###########
	register() {
		this.peer = {
			domain: this.config.peer.domain,
			url: this.config.peer.url,
			public_key: this.config.peer.public_key,
		};

		if (this.config.hub.active && !Meteor.federationPeerDNS.register(this.peer)) { return false; }

		// Setup callbacks only if it correctly registered
		this.setupCallbacks();

		// Also, send the unfulfilled events
		this.resendUnfulfilledEvents();

		return true;
	}

	// ###################
	//
	// Callback management
	//
	// ###################
	addCallbackToSkip(callback, resourceId) {
		this.callbacksToSkip[`${ callback }_${ resourceId }`] = true;
	}

	skipCallbackIfNeeded(callback, resource) {
		const { federation } = resource;

		if (!federation) { return false; }

		const { _id } = federation;

		const callbackName = `${ callback }_${ _id }`;

		const skipCallback = this.callbacksToSkip[callbackName];

		delete this.callbacksToSkip[callbackName];

		this.log(`${ callbackName } callback ${ skipCallback ? '' : 'not ' }skipped`);

		return skipCallback;
	}

	setupCallbacks() {
		// Accounts.onLogin(onLoginCallbackHandler.bind(this));
		// Accounts.onLogout(onLogoutCallbackHandler.bind(this));

		RocketChat.models.FederationEvents.on('createEvent', this.onCreateEvent.bind(this));

		RocketChat.callbacks.add('afterCreateDirectRoom', this.afterCreateDirectRoom.bind(this), RocketChat.callbacks.priority.LOW, 'federation-create-direct-room');
		RocketChat.callbacks.add('afterCreateRoom', this.afterCreateRoom.bind(this), RocketChat.callbacks.priority.LOW, 'federation-join-room');
		RocketChat.callbacks.add('afterSaveRoomSettings', this.afterSaveRoomSettings.bind(this), RocketChat.callbacks.priority.LOW, 'federation-after-save-room-settings');
		RocketChat.callbacks.add('afterAddedToRoom', this.afterAddedToRoom.bind(this), RocketChat.callbacks.priority.LOW, 'federation-join-room');
		RocketChat.callbacks.add('beforeLeaveRoom', this.beforeLeaveRoom.bind(this), RocketChat.callbacks.priority.LOW, 'federation-leave-room');
		RocketChat.callbacks.add('beforeRemoveFromRoom', this.beforeRemoveFromRoom.bind(this), RocketChat.callbacks.priority.LOW, 'federation-leave-room');
		RocketChat.callbacks.add('afterSaveMessage', this.afterSaveMessage.bind(this), RocketChat.callbacks.priority.LOW, 'federation-save-message');
		RocketChat.callbacks.add('afterDeleteMessage', this.afterDeleteMessage.bind(this), RocketChat.callbacks.priority.LOW, 'federation-delete-message');
		RocketChat.callbacks.add('afterReadMessages', this.afterReadMessages.bind(this), RocketChat.callbacks.priority.LOW, 'federation-read-messages');
		RocketChat.callbacks.add('afterSetReaction', this.afterSetReaction.bind(this), RocketChat.callbacks.priority.LOW, 'federation-after-set-reaction');
		RocketChat.callbacks.add('afterUnsetReaction', this.afterUnsetReaction.bind(this), RocketChat.callbacks.priority.LOW, 'federation-after-unset-reaction');
		RocketChat.callbacks.add('afterMuteUser', this.afterMuteUser.bind(this), RocketChat.callbacks.priority.LOW, 'federation-mute-user');
		RocketChat.callbacks.add('afterUnmuteUser', this.afterUnmuteUser.bind(this), RocketChat.callbacks.priority.LOW, 'federation-unmute-user');

		this.log('Callbacks set');
	}

	// ################
	//
	// Event management
	//
	// ################
	propagateEvent(e) {
		this.log(`propagateEvent: ${ e.t }`);

		const { peer: domain } = e;

		const peer = Meteor.federationPeerDNS.searchPeer(domain);

		if (!peer || !peer.public_key) {
			this.log(`Could not find valid peer:${ domain }`);

			RocketChat.models.FederationEvents.setEventAsErrored(e, 'Could not find valid peer');
		} else {
			try {
				const stringPayload = JSON.stringify({ event: e });

				// Encrypt with the peer's public key
				let payload = FederationKeys.loadKey(peer.public_key, 'public').encrypt(stringPayload);

				// Encrypt with the local private key
				payload = Meteor.federationPrivateKey.encryptPrivate(payload);

				Meteor.federationPeerHTTP.request(peer, 'POST', '/api/v1/federation.events', { payload });

				RocketChat.models.FederationEvents.setEventAsFullfilled(e);
			} catch (err) {
				this.log(`[${ e.t }] Event was refused by peer:${ domain }`);

				if (err.errorType === 'error-app-prevented-sending') {
					const { payload: {
						message: {
							rid: roomId,
							u: {
								username,
								federation: { _id: userId },
							},
						},
					} } = e;

					const localUsername = username.split('@')[0];

					// Create system message
					RocketChat.models.Messages.createRejectedMessageByPeer(roomId, localUsername, {
						u: {
							_id: userId,
							username: localUsername,
						},
						peer: domain,
					});

					return RocketChat.models.FederationEvents.setEventAsErrored(e, err.error, true);
				}

				return RocketChat.models.FederationEvents.setEventAsErrored(e, `Could not send request to ${ domain }`);
			}
		}
	}

	onCreateEvent(e) {
		this.propagateEvent(e);
	}

	resendUnfulfilledEvents() {
		// Should we use queues in here?
		const events = RocketChat.models.FederationEvents.getUnfulfilled();

		for (const e of events) {
			this.propagateEvent(e);
		}
	}

	// #####
	//
	// Users
	//
	// #####
	findUser(options) {
		const { peer: { domain: localPeerDomain } } = this;

		const { domain, username, email } = options;

		let peer = null;

		try {
			peer = Meteor.federationPeerDNS.searchPeer(domain);
		} catch (err) {
			this.log(`Could not find peer using domain:${ domain }`);
			throw new Meteor.Error('federation-peer-does-not-exist', `Could not find peer using domain:${ domain }`);
		}

		try {
			const { data: { federatedUser: { user } } } = Meteor.federationPeerHTTP.request(peer, 'GET', `/api/v1/federation.users?${ qs.stringify({ username, email }) }`);

			const federatedUser = new FederatedUser(localPeerDomain, user);

			return federatedUser;
		} catch (err) {
			this.log(`Could not find user:${ email || username }@${ domain } at ${ peer.domain }`);
			throw new Meteor.Error('federation-user-does-not-exist', `Could not find user:${ email || username }@${ domain } at ${ peer.domain }`);
		}
	}

	// #######
	//
	// Uploads
	//
	// #######
	getUpload(options) {
		const { identifier: domain, localMessage: { file: { _id: fileId } } } = options;

		let peer = null;

		try {
			peer = Meteor.federationPeerDNS.searchPeer(domain);
		} catch (err) {
			this.log(`Could not find peer using domain:${ domain }`);
			throw new Meteor.Error('federation-peer-does-not-exist', `Could not find peer using domain:${ domain }`);
		}

		const { data: { upload, buffer } } = Meteor.federationPeerHTTP.request(peer, 'GET', `/api/v1/federation.uploads?${ qs.stringify({ upload_id: fileId }) }`);

		return { upload, buffer: Buffer.from(buffer) };
	}

	// #################
	//
	// Callback handlers
	//
	// #################
	afterCreateDirectRoom(room, { from: owner }) {
		this.log('afterCreateDirectRoom');

		const { peer: { domain: localPeerDomain } } = this;

		// Check if room is federated
		if (!FederatedRoom.isFederated(localPeerDomain, room, { checkUsingUsers: true })) { return; }

		const federatedRoom = new FederatedRoom(localPeerDomain, room, { owner });

		// Check if this should be skipped
		if (this.skipCallbackIfNeeded('afterCreateDirectRoom', federatedRoom.getLocalRoom())) { return; }

		// Load federated users
		federatedRoom.loadUsers();

		// Refresh room's federation
		federatedRoom.refreshFederation();

		RocketChat.models.FederationEvents.directRoomCreated(federatedRoom, { skipPeers: [localPeerDomain] });
	}

	afterCreateRoom({ _id: ownerId }, room) {
		this.log('afterCreateRoom');

		const { peer: { domain: localPeerDomain } } = this;

		// Check if room is federated
		if (!FederatedRoom.isFederated(localPeerDomain, room, { checkUsingUsers: true })) { return; }

		const owner = RocketChat.models.Users.findOneById(ownerId);

		const federatedRoom = new FederatedRoom(localPeerDomain, room, { owner });

		// Check if this should be skipped
		if (this.skipCallbackIfNeeded('afterCreateRoom', federatedRoom.getLocalRoom())) { return; }

		// Load federated users
		federatedRoom.loadUsers();

		// Refresh room's federation
		federatedRoom.refreshFederation();

		RocketChat.models.FederationEvents.roomCreated(federatedRoom, { skipPeers: [localPeerDomain] });
	}

	afterSaveRoomSettings(/* room */) {
		this.log('afterSaveRoomSettings - NOT IMPLEMENTED');
	}

	afterAddedToRoom({ user: userWhoJoined, inviter: userWhoInvited }, room) {
		this.log('afterAddedToRoom');

		// Check if this should be skipped
		if (this.skipCallbackIfNeeded('afterAddedToRoom', userWhoJoined)) { return; }

		const { peer: { domain: localPeerDomain } } = this;

		// Check if room is federated
		if (!FederatedRoom.isFederated(localPeerDomain, room, { checkUsingUsers: true })) { return; }

		const extras = {};

		// If the room is not federated and has an owner
		if (!room.federation) {
			let ownerId;

			// If the room does not have an owner, get the first user subscribed to that room
			if (!room.u) {
				const userSubscription = Subscriptions.findOne({ rid: room._id }, {
					sort: {
						ts: 1,
					},
				});

				ownerId = userSubscription.u._id;
			} else {
				ownerId = room.u._id;
			}

			extras.owner = RocketChat.models.Users.findOneById(ownerId);
		}

		const federatedRoom = new FederatedRoom(localPeerDomain, room, extras);

		// Load federated users
		federatedRoom.loadUsers();

		// Refresh room's federation
		federatedRoom.refreshFederation();

		// If the user who joined is from a different peer...
		if (userWhoJoined.federation && userWhoJoined.federation.peer !== localPeerDomain) {
			// ...create a "create room" event for that peer
			RocketChat.models.FederationEvents.roomCreated(federatedRoom, { peers: [userWhoJoined.federation.peer] });
		}

		// Then, create a "user join/added" event to the other peers
		const federatedUserWhoJoined = FederatedUser.loadOrCreate(localPeerDomain, userWhoJoined);

		if (userWhoInvited) {
			const federatedInviter = FederatedUser.loadOrCreate(localPeerDomain, userWhoInvited);

			RocketChat.models.FederationEvents.userAdded(federatedRoom, federatedUserWhoJoined, federatedInviter, { skipPeers: [localPeerDomain] });
		} else {
			RocketChat.models.FederationEvents.userJoined(federatedRoom, federatedUserWhoJoined, { skipPeers: [localPeerDomain] });
		}
	}

	beforeLeaveRoom(userWhoLeft, room) {
		this.log('beforeLeaveRoom');

		// Check if this should be skipped
		if (this.skipCallbackIfNeeded('beforeLeaveRoom', userWhoLeft)) { return; }

		const { peer: { domain: localPeerDomain } } = this;

		// Check if room is federated
		if (!FederatedRoom.isFederated(localPeerDomain, room)) { return; }

		const federatedRoom = FederatedRoom.loadByFederationId(localPeerDomain, room.federation._id);

		const federatedUserWhoLeft = FederatedUser.loadByFederationId(localPeerDomain, userWhoLeft.federation._id);

		// Then, create a "user left" event to the other peers
		RocketChat.models.FederationEvents.userLeft(federatedRoom, federatedUserWhoLeft, { skipPeers: [localPeerDomain] });

		// Load federated users
		federatedRoom.loadUsers();

		// Refresh room's federation
		federatedRoom.refreshFederation();
	}

	beforeRemoveFromRoom({ removedUser, userWhoRemoved }, room) {
		this.log('beforeRemoveFromRoom');

		// Check if this should be skipped
		if (this.skipCallbackIfNeeded('beforeRemoveFromRoom', removedUser)) { return; }

		const { peer: { domain: localPeerDomain } } = this;

		// Check if room is federated
		if (!FederatedRoom.isFederated(localPeerDomain, room)) { return; }

		const federatedRoom = FederatedRoom.loadByFederationId(localPeerDomain, room.federation._id);

		const federatedRemovedUser = FederatedUser.loadByFederationId(localPeerDomain, removedUser.federation._id);

		const federatedUserWhoRemoved = FederatedUser.loadByFederationId(localPeerDomain, userWhoRemoved.federation._id);

		RocketChat.models.FederationEvents.userRemoved(federatedRoom, federatedRemovedUser, federatedUserWhoRemoved, { skipPeers: [localPeerDomain] });

		// Load federated users
		federatedRoom.loadUsers();

		// Refresh room's federation
		federatedRoom.refreshFederation();
	}

	afterSaveMessage(message, room) {
		this.log('afterSaveMessage');

		// Check if this should be skipped
		if (this.skipCallbackIfNeeded('afterSaveMessage', message)) { return; }

		const { peer: { domain: localPeerDomain } } = this;

		// Check if room is federated
		if (!FederatedRoom.isFederated(localPeerDomain, room)) { return; }

		const federatedRoom = FederatedRoom.loadByFederationId(localPeerDomain, room.federation._id);

		const federatedMessage = FederatedMessage.loadOrCreate(localPeerDomain, message);

		// If editedAt exists, it means it is an update
		if (message.editedAt) {
			const user = RocketChat.models.Users.findOneById(message.editedBy._id);

			const federatedUser = FederatedUser.loadByFederationId(localPeerDomain, user.federation._id);

			RocketChat.models.FederationEvents.messageUpdated(federatedRoom, federatedMessage, federatedUser, { skipPeers: [localPeerDomain] });
		} else {
			RocketChat.models.FederationEvents.messageCreated(federatedRoom, federatedMessage, { skipPeers: [localPeerDomain] });
		}
	}

	afterDeleteMessage(message) {
		this.log('afterDeleteMessage');

		// Check if this should be skipped
		if (this.skipCallbackIfNeeded('afterDeleteMessage', message)) { return; }

		const { peer: { domain: localPeerDomain } } = this;

		const room = RocketChat.models.Rooms.findOneById(message.rid);

		// Check if room is federated
		if (!FederatedRoom.isFederated(localPeerDomain, room)) { return; }

		const federatedRoom = FederatedRoom.loadByFederationId(localPeerDomain, room.federation._id);

		const federatedMessage = new FederatedMessage(localPeerDomain, message);

		RocketChat.models.FederationEvents.messageDeleted(federatedRoom, federatedMessage, { skipPeers: [localPeerDomain] });
	}

	afterReadMessages(roomId, userId) {
		this.log('afterReadMessages');

		if (!RocketChat.settings.get('Message_Read_Receipt_Enabled')) { this.log('Skipping: read receipts are not enabled'); return; }

		const room = RocketChat.models.Rooms.findOneById(roomId);

		const { peer: { domain: localPeerDomain } } = this;

		// Check if room is federated
		if (!FederatedRoom.isFederated(localPeerDomain, room)) { return; }

		const user = RocketChat.models.Users.findOneById(userId);

		const federatedRoom = FederatedRoom.loadByFederationId(localPeerDomain, room.federation._id);

		const federatedUser = FederatedUser.loadByFederationId(localPeerDomain, user.federation._id);

		RocketChat.models.FederationEvents.messagesRead(federatedRoom, federatedUser, { skipPeers: [localPeerDomain] });
	}

	afterSetReaction(message, { user, reaction, shouldReact }) {
		this.log('afterSetReaction');

		const room = RocketChat.models.Rooms.findOneById(message.rid);

		const { peer: { domain: localPeerDomain } } = this;

		// Check if room is federated
		if (!FederatedRoom.isFederated(localPeerDomain, room)) { return; }

		const federatedUser = FederatedUser.loadByFederationId(localPeerDomain, user.federation._id);

		const federatedMessage = FederatedMessage.loadByFederationId(localPeerDomain, message.federation._id);

		const federatedRoom = FederatedRoom.loadByFederationId(localPeerDomain, room.federation._id);

		RocketChat.models.FederationEvents.messagesSetReaction(federatedRoom, federatedMessage, federatedUser, reaction, shouldReact, { skipPeers: [localPeerDomain] });
	}

	afterUnsetReaction(message, { user, reaction, shouldReact }) {
		this.log('afterUnsetReaction');

		const room = RocketChat.models.Rooms.findOneById(message.rid);

		const { peer: { domain: localPeerDomain } } = this;

		// Check if room is federated
		if (!FederatedRoom.isFederated(localPeerDomain, room)) { return; }

		const federatedUser = FederatedUser.loadByFederationId(localPeerDomain, user.federation._id);

		const federatedMessage = FederatedMessage.loadByFederationId(localPeerDomain, message.federation._id);

		const federatedRoom = FederatedRoom.loadByFederationId(localPeerDomain, room.federation._id);

		RocketChat.models.FederationEvents.messagesUnsetReaction(federatedRoom, federatedMessage, federatedUser, reaction, shouldReact, { skipPeers: [localPeerDomain] });
	}

	afterMuteUser({ mutedUser, fromUser }, room) {
		this.log('afterMuteUser');

		const { peer: { domain: localPeerDomain } } = this;

		// Check if room is federated
		if (!FederatedRoom.isFederated(localPeerDomain, room)) { return; }

		const federatedRoom = FederatedRoom.loadByFederationId(localPeerDomain, room.federation._id);

		const federatedMutedUser = FederatedUser.loadByFederationId(localPeerDomain, mutedUser.federation._id);

		const federatedUserWhoMuted = FederatedUser.loadByFederationId(localPeerDomain, fromUser.federation._id);

		RocketChat.models.FederationEvents.userMuted(federatedRoom, federatedMutedUser, federatedUserWhoMuted, { skipPeers: [localPeerDomain] });
	}

	afterUnmuteUser({ unmutedUser, fromUser }, room) {
		this.log('afterUnmuteUser');

		const { peer: { domain: localPeerDomain } } = this;

		// Check if room is federated
		if (!FederatedRoom.isFederated(localPeerDomain, room)) { return; }

		const federatedRoom = FederatedRoom.loadByFederationId(localPeerDomain, room.federation._id);

		const federatedUnmutedUser = FederatedUser.loadByFederationId(localPeerDomain, unmutedUser.federation._id);

		const federatedUserWhoUnmuted = FederatedUser.loadByFederationId(localPeerDomain, fromUser.federation._id);

		RocketChat.models.FederationEvents.userUnmuted(federatedRoom, federatedUnmutedUser, federatedUserWhoUnmuted, { skipPeers: [localPeerDomain] });
	}
}

export default PeerClient;
