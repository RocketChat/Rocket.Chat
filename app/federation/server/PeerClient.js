import qs from 'querystring';

import { Meteor } from 'meteor/meteor';

import { updateStatus } from './settingsUpdater';
import { logger } from './logger';
import { FederatedMessage, FederatedRoom, FederatedUser } from './federatedResources';
import { callbacks } from '../../callbacks/server';
import { settings } from '../../settings/server';
import { FederationEvents, FederationKeys, Messages, Rooms, Subscriptions, Users } from '../../models/server';

import { Federation } from '.';

export class PeerClient {
	constructor() {
		this.config = {};

		this.enabled = false;

		// Keep resources we should skip callbacks
		this.callbacksToSkip = {};
	}

	setConfig(config) {
		// General
		this.config = config;

		// Setup HubPeer
		const { hub: { url } } = this.config;

		// Remove trailing slash
		this.HubPeer = { url };

		// Set the local peer
		this.peer = {
			domain: this.config.peer.domain,
			url: this.config.peer.url,
			public_key: this.config.peer.public_key,
			cloud_token: this.config.cloud.token,
		};
	}

	log(message) {
		logger.peerClient.info(message);
	}

	disable() {
		this.log('Disabling...');

		this.enabled = false;
	}

	enable() {
		this.log('Enabling...');

		this.enabled = true;
	}

	start() {
		this.setupCallbacks();
	}

	// ###########
	//
	// Registering
	//
	// ###########
	register() {
		if (this.config.hub.active) {
			updateStatus('Registering with Hub...');

			return Federation.peerDNS.register(this.peer);
		}

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

	wrapEnabled(callbackHandler) {
		return function(...parameters) {
			if (!this.enabled) { return; }

			callbackHandler.apply(this, parameters);
		}.bind(this);
	}

	setupCallbacks() {
		// Accounts.onLogin(onLoginCallbackHandler.bind(this));
		// Accounts.onLogout(onLogoutCallbackHandler.bind(this));

		FederationEvents.on('createEvent', this.wrapEnabled(this.onCreateEvent.bind(this)));

		callbacks.add('afterCreateDirectRoom', this.wrapEnabled(this.afterCreateDirectRoom.bind(this)), callbacks.priority.LOW, 'federation-create-direct-room');
		callbacks.add('afterCreateRoom', this.wrapEnabled(this.afterCreateRoom.bind(this)), callbacks.priority.LOW, 'federation-create-room');
		callbacks.add('afterSaveRoomSettings', this.wrapEnabled(this.afterSaveRoomSettings.bind(this)), callbacks.priority.LOW, 'federation-after-save-room-settings');
		callbacks.add('afterAddedToRoom', this.wrapEnabled(this.afterAddedToRoom.bind(this)), callbacks.priority.LOW, 'federation-added-to-room');
		callbacks.add('beforeLeaveRoom', this.wrapEnabled(this.beforeLeaveRoom.bind(this)), callbacks.priority.LOW, 'federation-leave-room');
		callbacks.add('beforeRemoveFromRoom', this.wrapEnabled(this.beforeRemoveFromRoom.bind(this)), callbacks.priority.LOW, 'federation-remove-from-room');
		callbacks.add('afterSaveMessage', this.wrapEnabled(this.afterSaveMessage.bind(this)), callbacks.priority.LOW, 'federation-save-message');
		callbacks.add('afterDeleteMessage', this.wrapEnabled(this.afterDeleteMessage.bind(this)), callbacks.priority.LOW, 'federation-delete-message');
		callbacks.add('afterReadMessages', this.wrapEnabled(this.afterReadMessages.bind(this)), callbacks.priority.LOW, 'federation-read-messages');
		callbacks.add('afterSetReaction', this.wrapEnabled(this.afterSetReaction.bind(this)), callbacks.priority.LOW, 'federation-after-set-reaction');
		callbacks.add('afterUnsetReaction', this.wrapEnabled(this.afterUnsetReaction.bind(this)), callbacks.priority.LOW, 'federation-after-unset-reaction');
		callbacks.add('afterMuteUser', this.wrapEnabled(this.afterMuteUser.bind(this)), callbacks.priority.LOW, 'federation-mute-user');
		callbacks.add('afterUnmuteUser', this.wrapEnabled(this.afterUnmuteUser.bind(this)), callbacks.priority.LOW, 'federation-unmute-user');

		this.log('Callbacks set');
	}

	// ################
	//
	// Event management
	//
	// ################
	propagateEvent(e) {
		this.log(`propagateEvent: ${ e.t }`);

		const { peer: domain, options: eventOptions } = e;

		const peer = Federation.peerDNS.searchPeer(domain);

		if (!peer || !peer.public_key) {
			this.log(`Could not find valid peer:${ domain }`);

			FederationEvents.setEventAsErrored(e, 'Could not find valid peer');
		} else {
			try {
				const stringPayload = JSON.stringify({ event: e });

				// Encrypt with the peer's public key
				let payload = FederationKeys.loadKey(peer.public_key, 'public').encrypt(stringPayload);

				// Encrypt with the local private key
				payload = Federation.privateKey.encryptPrivate(payload);

				Federation.peerHTTP.request(peer, 'POST', '/api/v1/federation.events', { payload }, eventOptions.retry || { total: 5, stepSize: 500, stepMultiplier: 10 });

				FederationEvents.setEventAsFullfilled(e);
			} catch (err) {
				this.log(`[${ e.t }] Event could not be sent to peer:${ domain }`);

				if (err.response) {
					const { response: { data: error } } = err;

					if (error.errorType === 'error-app-prevented-sending') {
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
						Messages.createRejectedMessageByPeer(roomId, localUsername, {
							u: {
								_id: userId,
								username: localUsername,
							},
							peer: domain,
						});

						return FederationEvents.setEventAsErrored(e, err.error, true);
					}
				}

				if (err.error === 'federation-peer-does-not-exist') {
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
					Messages.createPeerDoesNotExist(roomId, localUsername, {
						u: {
							_id: userId,
							username: localUsername,
						},
						peer: domain,
					});

					return FederationEvents.setEventAsErrored(e, err.error, true);
				}

				return FederationEvents.setEventAsErrored(e, `Could not send request to ${ domain }`);
			}
		}
	}

	onCreateEvent(e) {
		this.propagateEvent(e);
	}

	resendUnfulfilledEvents() {
		// Should we use queues in here?
		const events = FederationEvents.getUnfulfilled();

		events.forEach((e) => this.propagateEvent(e));
	}

	// #####
	//
	// Users
	//
	// #####
	findUsers(identifier, options = {}) {
		const [username, domain] = identifier.split('@');

		const { peer: { domain: localPeerDomain } } = this;

		let peer = null;

		try {
			peer = Federation.peerDNS.searchPeer(options.domainOverride || domain);
		} catch (err) {
			this.log(`Could not find peer using domain:${ domain }`);
			throw new Meteor.Error('federation-peer-does-not-exist', `Could not find peer using domain:${ domain }`);
		}

		try {
			const { data: { federatedUsers: remoteFederatedUsers } } = Federation.peerHTTP.request(peer, 'GET', `/api/v1/federation.users?${ qs.stringify({ username, domain, usernameOnly: options.usernameOnly }) }`);

			const federatedUsers = [];

			for (const federatedUser of remoteFederatedUsers) {
				federatedUsers.push(new FederatedUser(localPeerDomain, federatedUser.user));
			}

			return federatedUsers;
		} catch (err) {
			this.log(`Could not find user:${ username } at ${ peer.domain }`);
			throw new Meteor.Error('federation-user-does-not-exist', `Could not find user:${ identifier } at ${ peer.domain }`);
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
			peer = Federation.peerDNS.searchPeer(domain);
		} catch (err) {
			this.log(`Could not find peer using domain:${ domain }`);
			throw new Meteor.Error('federation-peer-does-not-exist', `Could not find peer using domain:${ domain }`);
		}

		const { data: { upload, buffer } } = Federation.peerHTTP.request(peer, 'GET', `/api/v1/federation.uploads?${ qs.stringify({ upload_id: fileId }) }`);

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
		if (!FederatedRoom.isFederated(localPeerDomain, room, { checkUsingUsers: true })) { return room; }

		const federatedRoom = new FederatedRoom(localPeerDomain, room, { owner });

		// Check if this should be skipped
		if (this.skipCallbackIfNeeded('afterCreateDirectRoom', federatedRoom.getLocalRoom())) { return room; }

		// Load federated users
		federatedRoom.loadUsers();

		// Refresh room's federation
		federatedRoom.refreshFederation();

		FederationEvents.directRoomCreated(federatedRoom, { skipPeers: [localPeerDomain] });

		return room;
	}

	afterCreateRoom(roomOwner, room) {
		this.log('afterCreateRoom');

		const { _id: ownerId } = roomOwner;

		const { peer: { domain: localPeerDomain } } = this;

		// Check if room is federated
		if (!FederatedRoom.isFederated(localPeerDomain, room, { checkUsingUsers: true })) { return roomOwner; }

		const owner = Users.findOneById(ownerId);

		const federatedRoom = new FederatedRoom(localPeerDomain, room, { owner });

		// Check if this should be skipped
		if (this.skipCallbackIfNeeded('afterCreateRoom', federatedRoom.getLocalRoom())) { return roomOwner; }

		// Load federated users
		federatedRoom.loadUsers();

		// Refresh room's federation
		federatedRoom.refreshFederation();

		FederationEvents.roomCreated(federatedRoom, { skipPeers: [localPeerDomain] });

		return roomOwner;
	}

	afterSaveRoomSettings(/* room */) {
		this.log('afterSaveRoomSettings - NOT IMPLEMENTED');
	}

	afterAddedToRoom(users, room) {
		this.log('afterAddedToRoom');

		const { user: userWhoJoined, inviter: userWhoInvited } = users;

		// Check if this should be skipped
		if (this.skipCallbackIfNeeded('afterAddedToRoom', userWhoJoined)) { return users; }

		const { peer: { domain: localPeerDomain } } = this;

		// Check if room or user who joined are federated
		if ((!userWhoJoined.federation || userWhoJoined.federation.peer === localPeerDomain)
			&& !FederatedRoom.isFederated(localPeerDomain, room)) {
			return users;
		}

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

			extras.owner = Users.findOneById(ownerId);
		}

		const federatedRoom = new FederatedRoom(localPeerDomain, room, extras);

		// Load federated users
		federatedRoom.loadUsers();

		// Refresh room's federation
		federatedRoom.refreshFederation();

		// If the user who joined is from a different peer...
		if (userWhoJoined.federation && userWhoJoined.federation.peer !== localPeerDomain) {
			// ...create a "create room" event for that peer
			FederationEvents.roomCreated(federatedRoom, { peers: [userWhoJoined.federation.peer] });
		}

		// Then, create a "user join/added" event to the other peers
		const federatedUserWhoJoined = FederatedUser.loadOrCreate(localPeerDomain, userWhoJoined);

		if (userWhoInvited) {
			const federatedInviter = FederatedUser.loadOrCreate(localPeerDomain, userWhoInvited);

			FederationEvents.userAdded(federatedRoom, federatedUserWhoJoined, federatedInviter, { skipPeers: [localPeerDomain] });
		} else {
			FederationEvents.userJoined(federatedRoom, federatedUserWhoJoined, { skipPeers: [localPeerDomain] });
		}

		return users;
	}

	beforeLeaveRoom(userWhoLeft, room) {
		this.log('beforeLeaveRoom');

		// Check if this should be skipped
		if (this.skipCallbackIfNeeded('beforeLeaveRoom', userWhoLeft)) { return userWhoLeft; }

		const { peer: { domain: localPeerDomain } } = this;

		// Check if room is federated
		if (!FederatedRoom.isFederated(localPeerDomain, room)) { return userWhoLeft; }

		const federatedRoom = FederatedRoom.loadByFederationId(localPeerDomain, room.federation._id);

		const federatedUserWhoLeft = FederatedUser.loadByFederationId(localPeerDomain, userWhoLeft.federation._id);

		// Then, create a "user left" event to the other peers
		FederationEvents.userLeft(federatedRoom, federatedUserWhoLeft, { skipPeers: [localPeerDomain] });

		// Load federated users
		federatedRoom.loadUsers();

		// Refresh room's federation
		federatedRoom.refreshFederation();

		return userWhoLeft;
	}

	beforeRemoveFromRoom(users, room) {
		this.log('beforeRemoveFromRoom');

		const { removedUser, userWhoRemoved } = users;

		// Check if this should be skipped
		if (this.skipCallbackIfNeeded('beforeRemoveFromRoom', removedUser)) { return users; }

		const { peer: { domain: localPeerDomain } } = this;

		// Check if room is federated
		if (!FederatedRoom.isFederated(localPeerDomain, room)) { return users; }

		const federatedRoom = FederatedRoom.loadByFederationId(localPeerDomain, room.federation._id);

		const federatedRemovedUser = FederatedUser.loadByFederationId(localPeerDomain, removedUser.federation._id);

		const federatedUserWhoRemoved = FederatedUser.loadByFederationId(localPeerDomain, userWhoRemoved.federation._id);

		FederationEvents.userRemoved(federatedRoom, federatedRemovedUser, federatedUserWhoRemoved, { skipPeers: [localPeerDomain] });

		// Load federated users
		federatedRoom.loadUsers();

		// Refresh room's federation
		federatedRoom.refreshFederation();

		return users;
	}

	afterSaveMessage(message, room) {
		this.log('afterSaveMessage');

		// Check if this should be skipped
		if (this.skipCallbackIfNeeded('afterSaveMessage', message)) { return message; }

		const { peer: { domain: localPeerDomain } } = this;

		// Check if room is federated
		if (!FederatedRoom.isFederated(localPeerDomain, room)) { return message; }

		const federatedRoom = FederatedRoom.loadByFederationId(localPeerDomain, room.federation._id);

		const federatedMessage = FederatedMessage.loadOrCreate(localPeerDomain, message);

		// If editedAt exists, it means it is an update
		if (message.editedAt) {
			const user = Users.findOneById(message.editedBy._id);

			const federatedUser = FederatedUser.loadByFederationId(localPeerDomain, user.federation._id);

			FederationEvents.messageUpdated(federatedRoom, federatedMessage, federatedUser, { skipPeers: [localPeerDomain] });
		} else {
			FederationEvents.messageCreated(federatedRoom, federatedMessage, { skipPeers: [localPeerDomain] });
		}

		return message;
	}

	afterDeleteMessage(message) {
		this.log('afterDeleteMessage');

		// Check if this should be skipped
		if (this.skipCallbackIfNeeded('afterDeleteMessage', message)) { return message; }

		const { peer: { domain: localPeerDomain } } = this;

		const room = Rooms.findOneById(message.rid);

		// Check if room is federated
		if (!FederatedRoom.isFederated(localPeerDomain, room)) { return message; }

		const federatedRoom = FederatedRoom.loadByFederationId(localPeerDomain, room.federation._id);

		const federatedMessage = new FederatedMessage(localPeerDomain, message);

		FederationEvents.messageDeleted(federatedRoom, federatedMessage, { skipPeers: [localPeerDomain] });

		return message;
	}

	afterReadMessages(roomId, { userId }) {
		this.log('afterReadMessages');

		if (!settings.get('Message_Read_Receipt_Enabled')) { this.log('Skipping: read receipts are not enabled'); return roomId; }

		const { peer: { domain: localPeerDomain } } = this;

		const room = Rooms.findOneById(roomId);

		// Check if room is federated
		if (!FederatedRoom.isFederated(localPeerDomain, room)) { return roomId; }

		const federatedRoom = FederatedRoom.loadByFederationId(localPeerDomain, room.federation._id);

		if (this.skipCallbackIfNeeded('afterReadMessages', federatedRoom.getLocalRoom())) { return roomId; }

		const user = Users.findOneById(userId);

		const federatedUser = FederatedUser.loadByFederationId(localPeerDomain, user.federation._id);

		FederationEvents.messagesRead(federatedRoom, federatedUser, { skipPeers: [localPeerDomain] });

		return roomId;
	}

	afterSetReaction(message, { user, reaction, shouldReact }) {
		this.log('afterSetReaction');

		const room = Rooms.findOneById(message.rid);

		const { peer: { domain: localPeerDomain } } = this;

		// Check if room is federated
		if (!FederatedRoom.isFederated(localPeerDomain, room)) { return message; }

		const federatedUser = FederatedUser.loadByFederationId(localPeerDomain, user.federation._id);

		const federatedMessage = FederatedMessage.loadByFederationId(localPeerDomain, message.federation._id);

		const federatedRoom = FederatedRoom.loadByFederationId(localPeerDomain, room.federation._id);

		FederationEvents.messagesSetReaction(federatedRoom, federatedMessage, federatedUser, reaction, shouldReact, { skipPeers: [localPeerDomain] });

		return message;
	}

	afterUnsetReaction(message, { user, reaction, shouldReact }) {
		this.log('afterUnsetReaction');

		const room = Rooms.findOneById(message.rid);

		const { peer: { domain: localPeerDomain } } = this;

		// Check if room is federated
		if (!FederatedRoom.isFederated(localPeerDomain, room)) { return message; }

		const federatedUser = FederatedUser.loadByFederationId(localPeerDomain, user.federation._id);

		const federatedMessage = FederatedMessage.loadByFederationId(localPeerDomain, message.federation._id);

		const federatedRoom = FederatedRoom.loadByFederationId(localPeerDomain, room.federation._id);

		FederationEvents.messagesUnsetReaction(federatedRoom, federatedMessage, federatedUser, reaction, shouldReact, { skipPeers: [localPeerDomain] });

		return message;
	}

	afterMuteUser(users, room) {
		this.log('afterMuteUser');

		const { mutedUser, fromUser } = users;

		const { peer: { domain: localPeerDomain } } = this;

		// Check if room is federated
		if (!FederatedRoom.isFederated(localPeerDomain, room)) { return users; }

		const federatedRoom = FederatedRoom.loadByFederationId(localPeerDomain, room.federation._id);

		const federatedMutedUser = FederatedUser.loadByFederationId(localPeerDomain, mutedUser.federation._id);

		const federatedUserWhoMuted = FederatedUser.loadByFederationId(localPeerDomain, fromUser.federation._id);

		FederationEvents.userMuted(federatedRoom, federatedMutedUser, federatedUserWhoMuted, { skipPeers: [localPeerDomain] });

		return users;
	}

	afterUnmuteUser(users, room) {
		this.log('afterUnmuteUser');

		const { unmutedUser, fromUser } = users;

		const { peer: { domain: localPeerDomain } } = this;

		// Check if room is federated
		if (!FederatedRoom.isFederated(localPeerDomain, room)) { return users; }

		const federatedRoom = FederatedRoom.loadByFederationId(localPeerDomain, room.federation._id);

		const federatedUnmutedUser = FederatedUser.loadByFederationId(localPeerDomain, unmutedUser.federation._id);

		const federatedUserWhoUnmuted = FederatedUser.loadByFederationId(localPeerDomain, fromUser.federation._id);

		FederationEvents.userUnmuted(federatedRoom, federatedUnmutedUser, federatedUserWhoUnmuted, { skipPeers: [localPeerDomain] });

		return users;
	}
}
