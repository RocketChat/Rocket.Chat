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

		// Setup DNSServerPeer
		const { dns: { url } } = this.config;

		this.DNSServerPeer = { server: { url } };
	}

	log(message) {
		console.log(`[federation-client] ${ message }`);
	}

	register() {
		const { identifier, domains, peer: server } = this.config;

		this.log(`Registering ${ identifier }'s peer domains...`);

		// Attempt to register peer
		try {
			const {
				data: { peer, otherPeers },
			} = this.doRequest(this.DNSServerPeer, 'POST', '/peers', { identifier, domains, server });

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
			const newPeer = this.updateDNSCacheByIdentifier(peer.identifier);

			try {
				return this.doRequest(newPeer, method, uri, body);
			} catch (err) {
				this.log(err);
				throw new Error(`Could not send request to ${ peer.identifier }`);
			}
		}
	}

	updateDNSCacheByEmail(email) {
		const domain = FederationDNSCache.getEmailDomain(email);

		const {
			data: { peer },
		} = this.doRequest(this.DNSServerPeer, 'GET', `/peers?domain=${ domain }`);

		updateDNSCache.call(this, peer);

		return peer;
	}

	updateDNSCacheByIdentifier(identifier) {
		const {
			data: { peer },
		} = this.doRequest(this.DNSServerPeer, 'GET', `/peers?identifier=${ identifier }`);

		updateDNSCache.call(this, peer);

		return peer;
	}

	getPeerByEmail(email) {
		let peer = FederationDNSCache.findOneByEmail(email);

		// Try to lookup at the DNS Cache
		if (!peer) {
			this.updateDNSCacheByEmail(email);

			peer = FederationDNSCache.findOneByEmail(email);
		}

		return peer;
	}

	getPeerByIdentifier(identifier) {
		let peer = FederationDNSCache.findOneByIdentifier(identifier);

		// Try to lookup at the DNS Cache
		if (!peer) {
			this.updateDNSCacheByIdentifier(identifier);

			peer = FederationDNSCache.findOneByIdentifier(identifier);
		}

		return peer;
	}

	findUser(options) {
		const { peer: { identifier: localPeerIdentifier } } = this;

		const { email, identifier, username } = options;

		let peer = null;
		let queryObject = {};

		try {
			if (email) {
				peer = this.getPeerByEmail(email);

				queryObject = { email };
			} else {
				peer = this.getPeerByIdentifier(identifier);

				queryObject = { username };
			}
		} catch (err) {
			this.log(`Could not find peer using: ${ email ? `email:${ email }` : `identifier:${ identifier }` }`);
			throw new Meteor.Error('federation-peer-does-not-exist', `Could not find peer using: ${ email ? `email:${ email }` : `identifier:${ identifier }` }`);
		}

		try {
			const { data: { federatedUser: federatedUserObject } } = this.request(peer, 'GET', `/api/v1/federation.users?${ qs.stringify(queryObject) }`);

			const federatedUser = new FederatedUser(localPeerIdentifier, federatedUserObject);

			return federatedUser;
		} catch (err) {
			this.log(`Could not find user ${ email } at ${ peer.identifier }`);
			throw new Meteor.Error('federation-user-does-not-exist', `Could not find a user - ${ email }@${ peer.identifier }`);
		}
	}

	afterCreateDirectRoom(room, { from: owner }) {
		this.log('afterCreateDirectRoom');

		const { peer: { identifier: localPeerIdentifier } } = this;

		// Check if room is federated
		if (!FederatedRoom.isFederated(localPeerIdentifier, room, { checkUsingUsers: true })) { return; }

		this.log('afterCreateDirectRoom - room is federated');

		const federatedRoom = new FederatedRoom(localPeerIdentifier, room, { owner });

		RocketChat.models.FederationEvents.createDirectRoomCreated(federatedRoom, { skipPeers: [localPeerIdentifier] });
	}

	afterCreateRoom({ _id: ownerId }, room) {
		this.log('afterCreateRoom');

		const { peer: { identifier: localPeerIdentifier } } = this;

		// Check if room is federated
		if (!FederatedRoom.isFederated(localPeerIdentifier, room, { checkUsingUsers: true })) { return; }

		this.log('afterCreateRoom - room is federated');

		const owner = RocketChat.models.Users.findOneById(ownerId);

		const federatedRoom = new FederatedRoom(localPeerIdentifier, room, { owner });

		RocketChat.models.FederationEvents.createRoomCreated(federatedRoom, { skipPeers: [localPeerIdentifier] });
	}

	afterAddedToRoom({ user: userWhoJoined, inviter: userWhoInvited }, room) {
		this.log('afterAddedToRoom');

		const { peer: { identifier: localPeerIdentifier } } = this;

		// Check if room is federated
		if (!FederatedRoom.isFederated(localPeerIdentifier, room, { checkUsingUsers: true })) { return; }

		this.log('afterAddedToRoom - room is federated');

		const extras = {};

		if (!room.federation) {
			extras.owner = RocketChat.models.Users.findOneById(room.u._id);
		}

		const federatedRoom = new FederatedRoom(localPeerIdentifier, room, extras);

		// If the user who joined is from a different peer...
		if (userWhoJoined.federation && userWhoJoined.federation.peer !== localPeerIdentifier) {
			// ...create a "create room" event for that peer
			RocketChat.models.FederationEvents.createRoomCreated(federatedRoom, { peers: [userWhoJoined.federation.peer] });
		}

		// Then, create a "user join/added" event to the other peers
		const federatedUserWhoJoined = new FederatedUser(localPeerIdentifier, userWhoJoined);

		if (userWhoInvited) {
			const federatedInviter = new FederatedUser(localPeerIdentifier, userWhoInvited);

			RocketChat.models.FederationEvents.createUserAddedToRoom(federatedRoom, federatedUserWhoJoined, federatedInviter, { skipPeers: [localPeerIdentifier] });
		} else {
			RocketChat.models.FederationEvents.createUserJoinedRoom(federatedRoom, federatedUserWhoJoined, { skipPeers: [localPeerIdentifier] });
		}
	}

	beforeLeaveRoom(userWhoLeft, room) {
		this.log('beforeLeaveRoom');

		const { peer: { identifier: localPeerIdentifier } } = this;

		// Check if room is federated
		if (!FederatedRoom.isFederated(localPeerIdentifier, room)) { return; }

		this.log('beforeLeaveRoom - room is federated');

		const federatedRoom = new FederatedRoom(localPeerIdentifier, room);

		const federatedUserWhoLeft = new FederatedUser(localPeerIdentifier, userWhoLeft);

		// Then, create a "user left" event to the other peers
		RocketChat.models.FederationEvents.createUserLeftRoom(federatedRoom, federatedUserWhoLeft, { skipPeers: [localPeerIdentifier] });

		// Refresh room's federation
		federatedRoom.refreshFederation();
	}

	beforeRemoveFromRoom({ removedUser, userWhoRemoved }, room) {
		this.log('beforeRemoveFromRoom');

		const { peer: { identifier: localPeerIdentifier } } = this;

		// Check if room is federated
		if (!FederatedRoom.isFederated(localPeerIdentifier, room)) { return; }

		this.log('beforeRemoveFromRoom - room is federated');

		const federatedRoom = new FederatedRoom(localPeerIdentifier, room);

		const federatedRemovedUser = new FederatedUser(localPeerIdentifier, removedUser);

		const federatedUserWhoRemoved = new FederatedUser(localPeerIdentifier, userWhoRemoved);

		RocketChat.models.FederationEvents.createUserRemovedFromRoom(federatedRoom, federatedRemovedUser, federatedUserWhoRemoved, { skipPeers: [localPeerIdentifier] });

		// Refresh room's federation
		federatedRoom.refreshFederation();
	}

	afterSaveMessage(message, room) {
		this.log('afterSaveMessage');

		const { peer: { identifier: localPeerIdentifier } } = this;

		// Check if room is federated
		if (!FederatedRoom.isFederated(localPeerIdentifier, room)) { return; }

		this.log('afterSaveMessage - room is federated');

		const federatedRoom = new FederatedRoom(localPeerIdentifier, room);

		const federatedMessage = new FederatedMessage(localPeerIdentifier, message);

		RocketChat.models.FederationEvents.createMessageSent(federatedRoom, federatedMessage, { skipPeers: [localPeerIdentifier] });
	}

	propagateEvent(e) {
		this.log(`propagateEvent: ${ e.t }`);

		const { peer: identifier } = e;

		const peer = this.getPeerByIdentifier(identifier);

		if (!peer) {
			this.log(`Could not find valid peer:${ identifier }`);

			RocketChat.models.FederationEvents.setEventAsErrored(e, 'Could not find valid peer');
		} else {
			try {
				this.request(peer, 'POST', '/api/v1/federation.events', { event: e });

				RocketChat.models.FederationEvents.setEventAsFullfilled(e);
			} catch (err) {
				this.log(`Could not send message to peer:${ identifier }`);

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

		RocketChat.callbacks.add('afterCreateDirectRoom', this.afterCreateDirectRoom.bind(this), RocketChat.callbacks.priority.LOW, 'federation-on-create-direct-room');
		RocketChat.callbacks.add('afterCreateRoom', this.afterCreateRoom.bind(this), RocketChat.callbacks.priority.LOW, 'federation-on-join-room');
		RocketChat.callbacks.add('afterAddedToRoom', this.afterAddedToRoom.bind(this), RocketChat.callbacks.priority.LOW, 'federation-on-join-room');
		RocketChat.callbacks.add('beforeLeaveRoom', this.beforeLeaveRoom.bind(this), RocketChat.callbacks.priority.LOW, 'federation-on-leave-room');
		// RocketChat.callbacks.add('afterLeaveRoom', this.afterLeaveRoom.bind(this), RocketChat.callbacks.priority.LOW, 'federation-on-leave-room');
		RocketChat.callbacks.add('beforeRemoveFromRoom', this.beforeRemoveFromRoom.bind(this), RocketChat.callbacks.priority.LOW, 'federation-on-leave-room');
		// RocketChat.callbacks.add('afterRemoveFromRoom', this.afterRemoveFromRoom.bind(this), RocketChat.callbacks.priority.LOW, 'federation-on-leave-room');
		RocketChat.callbacks.add('afterSaveMessage', this.afterSaveMessage.bind(this), RocketChat.callbacks.priority.LOW, 'federation-on-save-message');

		this.log('Callbacks set');
	}
}

export default PeerClient;
