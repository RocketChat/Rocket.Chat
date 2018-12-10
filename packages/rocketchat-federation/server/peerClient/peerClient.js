import { HTTP } from 'meteor/http';
import qs from 'querystring';

import { updateDNSCache } from '../utils';

import FederatedMessage from '../federatedResources/FederatedMessage';
import FederatedRoom from '../federatedResources/FederatedRoom';
import FederatedUser from '../federatedResources/FederatedUser';

const { FederationDNSCache } = RocketChat.models;

class PeerClient {
	constructor(config) {
		// General
		this.config = config;

		// Keep resources we should skip callbacks
		this.callbacksToSkip = {};

		// Setup HubPeer
		const { hub: { url } } = this.config;

		// Remove trailing slash
		this.HubPeer = { server: { url } };
	}

	log(message) {
		console.log(`[federation-client] ${ message }`);
	}

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

	register() {
		const { identifier, domains, peer: server } = this.config;

		this.log(`Registering ${ identifier }'s peer domains...`);

		// Attempt to register peer
		try {
			const {
				data: { peer, otherPeers },
			} = this.doRequest(this.HubPeer, 'POST', '/peers', { identifier, domains, server });

			// Keep peer reference
			this.peer = peer;

			// Update local DNS cache
			updateDNSCache.call(this, otherPeers);

			// Setup callbacks only if it correctly registered
			this.setupCallbacks();

			// Also, send the unfulfilled events
			this.resendUnfulfilledEvents();

			this.log('Peer registered!');

			return true;
		} catch (err) {
			this.log(err);
			this.log('Could not register peer, federation is NOT running.');

			return false;
		}
	}

	doRequest(peer, method, uri, body) {
		const { server: { url: serverBaseURL } } = peer;

		const url = `${ serverBaseURL }${ uri }`;

		let data = null;

		if (method === 'POST' || method === 'PUT') {
			data = body;
		}

		this.log(`Sending request: ${ method } - ${ url }`);

		return HTTP.call(method, url, { data, timeout: 2000 });
	}

	request(peer, method, uri, body) {
		try {
			return this.doRequest(peer, method, uri, body);
		} catch (err) {
			if (err.code !== 'ENOTFOUND') {
				this.log(err);

				throw new Error(`Could not send request to ${ peer.identifier }`);
			}

			this.log(`Trying to update local DNS cache for peer:${ peer.identifier }`);

			// If there is an error, try to update the cache and do it again
			const newPeer = this.updateDNSCache(peer.identifier);

			try {
				return this.doRequest(newPeer, method, uri, body);
			} catch (err) {
				this.log(err);

				throw new Error(`Could not send request to ${ peer.identifier }`);
			}
		}
	}

	updateDNSCache(identifier) {
		const {
			data: { peer },
		} = this.doRequest(this.HubPeer, 'GET', `/peers?search=${ identifier }`);

		updateDNSCache.call(this, peer);
	}

	searchPeer(identifier) {
		let peer = FederationDNSCache.findOneByIdentifierOrDomain(identifier);

		// Try to lookup at the DNS Cache
		if (!peer) {
			this.updateDNSCache(identifier);

			peer = FederationDNSCache.findOneByIdentifierOrDomain(identifier);
		}

		return peer;
	}

	getUpload(options) {
		const { identifier, localMessage: { file: { _id: fileId } } } = options;

		let peer = null;

		try {
			peer = this.searchPeer(identifier);
		} catch (err) {
			this.log(`Could not find peer using identifier:${ identifier }`);
			throw new Meteor.Error('federation-peer-does-not-exist', `Could not find peer using identifier:${ identifier }`);
		}

		const { data: { upload, buffer } } = this.request(peer, 'GET', `/api/v1/federation.uploads?${ qs.stringify({ upload_id: fileId }) }`);

		return { upload, buffer: Buffer.from(buffer) };
	}

	findUser(options) {
		const { peer: { identifier: localPeerIdentifier } } = this;

		const { identifier, username } = options;

		let peer = null;

		try {
			peer = this.searchPeer(identifier);
		} catch (err) {
			this.log(`Could not find peer using identifier:${ identifier }`);
			throw new Meteor.Error('federation-peer-does-not-exist', `Could not find peer using identifier:${ identifier }`);
		}

		try {
			const { data: { federatedUser: { user } } } = this.request(peer, 'GET', `/api/v1/federation.users?${ qs.stringify({ username }) }`);

			const federatedUser = new FederatedUser(localPeerIdentifier, user);

			return federatedUser;
		} catch (err) {
			this.log(`Could not find user:${ username }@${ identifier } at ${ peer.identifier }`);
			throw new Meteor.Error('federation-user-does-not-exist', `Could not find user:${ username }@${ identifier } at ${ peer.identifier }`);
		}
	}

	afterCreateDirectRoom(room, { from: owner }) {
		this.log('afterCreateDirectRoom');

		const { peer: { identifier: localPeerIdentifier } } = this;

		// Check if room is federated
		if (!FederatedRoom.isFederated(localPeerIdentifier, room, { checkUsingUsers: true })) { return; }

		const federatedRoom = new FederatedRoom(localPeerIdentifier, room, { owner });

		// Load federated users
		federatedRoom.loadUsers();

		// Refresh room's federation
		federatedRoom.refreshFederation();

		RocketChat.models.FederationEvents.directRoomCreated(federatedRoom, { skipPeers: [localPeerIdentifier] });
	}

	afterCreateRoom({ _id: ownerId }, room) {
		this.log('afterCreateRoom');

		const { peer: { identifier: localPeerIdentifier } } = this;

		// Check if room is federated
		if (!FederatedRoom.isFederated(localPeerIdentifier, room, { checkUsingUsers: true })) { return; }

		const owner = RocketChat.models.Users.findOneById(ownerId);

		const federatedRoom = new FederatedRoom(localPeerIdentifier, room, { owner });

		// Load federated users
		federatedRoom.loadUsers();

		// Refresh room's federation
		federatedRoom.refreshFederation();

		RocketChat.models.FederationEvents.roomCreated(federatedRoom, { skipPeers: [localPeerIdentifier] });
	}

	afterAddedToRoom({ user: userWhoJoined, inviter: userWhoInvited }, room) {
		this.log('afterAddedToRoom');

		// Check if this should be skipped
		if (this.skipCallbackIfNeeded('afterAddedToRoom', userWhoJoined)) { return; }

		const { peer: { identifier: localPeerIdentifier } } = this;

		// Check if room is federated
		if (!FederatedRoom.isFederated(localPeerIdentifier, room, { checkUsingUsers: true })) { return; }

		const extras = {};

		if (!room.federation) {
			extras.owner = RocketChat.models.Users.findOneById(room.u._id);
		}

		const federatedRoom = new FederatedRoom(localPeerIdentifier, room, extras);

		// Load federated users
		federatedRoom.loadUsers();

		// Refresh room's federation
		federatedRoom.refreshFederation();

		// If the user who joined is from a different peer...
		if (userWhoJoined.federation && userWhoJoined.federation.peer !== localPeerIdentifier) {
			// ...create a "create room" event for that peer
			RocketChat.models.FederationEvents.roomCreated(federatedRoom, { peers: [userWhoJoined.federation.peer] });
		}

		// Then, create a "user join/added" event to the other peers
		const federatedUserWhoJoined = FederatedUser.loadOrCreate(localPeerIdentifier, userWhoJoined);

		if (userWhoInvited) {
			const federatedInviter = FederatedUser.loadOrCreate(localPeerIdentifier, userWhoInvited);

			RocketChat.models.FederationEvents.userAdded(federatedRoom, federatedUserWhoJoined, federatedInviter, { skipPeers: [localPeerIdentifier] });
		} else {
			RocketChat.models.FederationEvents.userJoined(federatedRoom, federatedUserWhoJoined, { skipPeers: [localPeerIdentifier] });
		}
	}

	beforeLeaveRoom(userWhoLeft, room) {
		this.log('beforeLeaveRoom');

		// Check if this should be skipped
		if (this.skipCallbackIfNeeded('beforeLeaveRoom', userWhoLeft)) { return; }

		const { peer: { identifier: localPeerIdentifier } } = this;

		// Check if room is federated
		if (!FederatedRoom.isFederated(localPeerIdentifier, room)) { return; }

		const federatedRoom = FederatedRoom.loadByFederationId(localPeerIdentifier, room.federation._id);

		const federatedUserWhoLeft = FederatedUser.loadByFederationId(localPeerIdentifier, userWhoLeft.federation._id);

		// Then, create a "user left" event to the other peers
		RocketChat.models.FederationEvents.userLeft(federatedRoom, federatedUserWhoLeft, { skipPeers: [localPeerIdentifier] });

		// Load federated users
		federatedRoom.loadUsers();

		// Refresh room's federation
		federatedRoom.refreshFederation();
	}

	beforeRemoveFromRoom({ removedUser, userWhoRemoved }, room) {
		this.log('beforeRemoveFromRoom');

		// Check if this should be skipped
		if (this.skipCallbackIfNeeded('beforeRemoveFromRoom', removedUser)) { return; }

		const { peer: { identifier: localPeerIdentifier } } = this;

		// Check if room is federated
		if (!FederatedRoom.isFederated(localPeerIdentifier, room)) { return; }

		const federatedRoom = FederatedRoom.loadByFederationId(localPeerIdentifier, room.federation._id);

		const federatedRemovedUser = FederatedUser.loadByFederationId(localPeerIdentifier, removedUser.federation._id);

		const federatedUserWhoRemoved = FederatedUser.loadByFederationId(localPeerIdentifier, userWhoRemoved.federation._id);

		RocketChat.models.FederationEvents.userRemoved(federatedRoom, federatedRemovedUser, federatedUserWhoRemoved, { skipPeers: [localPeerIdentifier] });

		// Load federated users
		federatedRoom.loadUsers();

		// Refresh room's federation
		federatedRoom.refreshFederation();
	}

	afterSaveMessage(message, room, userId) {
		this.log('afterSaveMessage');

		// Check if this should be skipped
		if (this.skipCallbackIfNeeded('afterSaveMessage', message)) { return; }

		const { peer: { identifier: localPeerIdentifier } } = this;

		// Check if room is federated
		if (!FederatedRoom.isFederated(localPeerIdentifier, room)) { return; }

		const federatedRoom = FederatedRoom.loadByFederationId(localPeerIdentifier, room.federation._id);

		const federatedMessage = FederatedMessage.loadOrCreate(localPeerIdentifier, message);

		// If editedAt exists, it means it is an update
		if (message.editedAt) {
			const user = RocketChat.models.Users.findOneById(userId);

			const federatedUser = FederatedUser.loadByFederationId(localPeerIdentifier, user.federation._id);

			RocketChat.models.FederationEvents.messageUpdated(federatedRoom, federatedMessage, federatedUser, { skipPeers: [localPeerIdentifier] });
		} else {
			RocketChat.models.FederationEvents.messageCreated(federatedRoom, federatedMessage, { skipPeers: [localPeerIdentifier] });
		}
	}

	afterDeleteMessage(message) {
		this.log('afterDeleteMessage');

		// Check if this should be skipped
		if (this.skipCallbackIfNeeded('afterDeleteMessage', message)) { return; }

		const { peer: { identifier: localPeerIdentifier } } = this;

		const room = RocketChat.models.Rooms.findOneById(message.rid);

		// Check if room is federated
		if (!FederatedRoom.isFederated(localPeerIdentifier, room)) { return; }

		const federatedRoom = FederatedRoom.loadByFederationId(localPeerIdentifier, room.federation._id);

		const federatedMessage = new FederatedMessage(localPeerIdentifier, message);

		RocketChat.models.FederationEvents.messageDeleted(federatedRoom, federatedMessage, { skipPeers: [localPeerIdentifier] });
	}

	afterReadMessages(roomId, userId) {
		this.log('afterReadMessages');

		if (!RocketChat.settings.get('Message_Read_Receipt_Enabled')) { this.log('Skipping: read receipts are not enabled'); return; }

		const room = RocketChat.models.Rooms.findOneById(roomId);

		const { peer: { identifier: localPeerIdentifier } } = this;

		// Check if room is federated
		if (!FederatedRoom.isFederated(localPeerIdentifier, room)) { return; }

		const user = RocketChat.models.Users.findOneById(userId);

		const federatedRoom = FederatedRoom.loadByFederationId(localPeerIdentifier, room.federation._id);

		const federatedUser = FederatedUser.loadByFederationId(localPeerIdentifier, user.federation._id);

		RocketChat.models.FederationEvents.messagesRead(federatedRoom, federatedUser, { skipPeers: [localPeerIdentifier] });
	}

	afterSetReaction(message, { user, reaction, shouldReact }) {
		this.log('afterSetReaction');

		const room = RocketChat.models.Rooms.findOneById(message.rid);

		const { peer: { identifier: localPeerIdentifier } } = this;

		// Check if room is federated
		if (!FederatedRoom.isFederated(localPeerIdentifier, room)) { return; }

		const federatedUser = FederatedUser.loadByFederationId(localPeerIdentifier, user.federation._id);

		const federatedMessage = FederatedMessage.loadByFederationId(localPeerIdentifier, message.federation._id);

		const federatedRoom = FederatedRoom.loadByFederationId(localPeerIdentifier, room.federation._id);

		RocketChat.models.FederationEvents.messagesSetReaction(federatedRoom, federatedMessage, federatedUser, reaction, shouldReact, { skipPeers: [localPeerIdentifier] });
	}

	afterUnsetReaction(message, { user, reaction, shouldReact }) {
		this.log('afterUnsetReaction');

		const room = RocketChat.models.Rooms.findOneById(message.rid);

		const { peer: { identifier: localPeerIdentifier } } = this;

		// Check if room is federated
		if (!FederatedRoom.isFederated(localPeerIdentifier, room)) { return; }

		const federatedUser = FederatedUser.loadByFederationId(localPeerIdentifier, user.federation._id);

		const federatedMessage = FederatedMessage.loadByFederationId(localPeerIdentifier, message.federation._id);

		const federatedRoom = FederatedRoom.loadByFederationId(localPeerIdentifier, room.federation._id);

		RocketChat.models.FederationEvents.messagesUnsetReaction(federatedRoom, federatedMessage, federatedUser, reaction, shouldReact, { skipPeers: [localPeerIdentifier] });
	}

	afterMuteUser({ mutedUser, fromUser }, room) {
		this.log('afterMuteUser');

		const { peer: { identifier: localPeerIdentifier } } = this;

		// Check if room is federated
		if (!FederatedRoom.isFederated(localPeerIdentifier, room)) { return; }

		const federatedRoom = FederatedRoom.loadByFederationId(localPeerIdentifier, room.federation._id);

		const federatedMutedUser = FederatedUser.loadByFederationId(localPeerIdentifier, mutedUser.federation._id);

		const federatedUserWhoMuted = FederatedUser.loadByFederationId(localPeerIdentifier, fromUser.federation._id);

		RocketChat.models.FederationEvents.userMuted(federatedRoom, federatedMutedUser, federatedUserWhoMuted, { skipPeers: [localPeerIdentifier] });
	}

	afterUnmuteUser({ unmutedUser, fromUser }, room) {
		this.log('afterUnmuteUser');

		const { peer: { identifier: localPeerIdentifier } } = this;

		// Check if room is federated
		if (!FederatedRoom.isFederated(localPeerIdentifier, room)) { return; }

		const federatedRoom = FederatedRoom.loadByFederationId(localPeerIdentifier, room.federation._id);

		const federatedUnmutedUser = FederatedUser.loadByFederationId(localPeerIdentifier, unmutedUser.federation._id);

		const federatedUserWhoUnmuted = FederatedUser.loadByFederationId(localPeerIdentifier, fromUser.federation._id);

		RocketChat.models.FederationEvents.userUnmuted(federatedRoom, federatedUnmutedUser, federatedUserWhoUnmuted, { skipPeers: [localPeerIdentifier] });
	}

	propagateEvent(e) {
		this.log(`propagateEvent: ${ e.t }`);

		const { peer: identifier } = e;

		const peer = this.searchPeer(identifier);

		if (!peer) {
			this.log(`Could not find valid peer:${ identifier }`);

			RocketChat.models.FederationEvents.setEventAsErrored(e, 'Could not find valid peer');
		} else {
			try {
				this.request(peer, 'POST', '/api/v1/federation.events', { event: e });

				RocketChat.models.FederationEvents.setEventAsFullfilled(e);
			} catch (err) {
				this.log(`[${ e.t }] Event was refused by peer:${ identifier }`);

				RocketChat.models.FederationEvents.setEventAsErrored(e, err.toString());
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

	setupCallbacks() {
		// Accounts.onLogin(onLoginCallbackHandler.bind(this));
		// Accounts.onLogout(onLogoutCallbackHandler.bind(this));

		RocketChat.models.FederationEvents.on('createEvent', this.onCreateEvent.bind(this));

		RocketChat.callbacks.add('afterCreateDirectRoom', this.afterCreateDirectRoom.bind(this), RocketChat.callbacks.priority.LOW, 'federation-create-direct-room');
		RocketChat.callbacks.add('afterCreateRoom', this.afterCreateRoom.bind(this), RocketChat.callbacks.priority.LOW, 'federation-join-room');
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
}

export default PeerClient;
