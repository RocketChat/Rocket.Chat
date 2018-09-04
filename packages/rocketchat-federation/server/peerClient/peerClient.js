import { HTTP } from 'meteor/http';

import { upsertLocalPeerUsers } from '../utils';

import afterSaveMessageCallbackHandler from './callbackHandlers/afterSaveMessage';
import onLoginCallbackHandler from './callbackHandlers/onLogin';
import onLogoutCallbackHandler from './callbackHandlers/onLogout';

class PeerClient {
	constructor(config) {
		// General
		this.config = config;

		// Setup baseUrl
		const { client: { hub: { host, port } } } = this.config;

		this.baseUrl = `http://${ host }:${ port }`;

		// Setup callbacks
		this.setupCallbacks();
	}

	request(method, uri, body) {
		let data = null;

		if (method === 'POST' || method === 'PUT') {
			data = body;
		}

		return HTTP.call(method, `${ this.baseUrl }${ uri }`, { data });
	}

	register() {
		const { identifier, server: { host, port } } = this.config;

		console.log(`[federation] Registering ${ identifier }'s peer...`);

		// Get all local users
		const localUsers = Meteor.users
			.find(
				{ username: { $ne: 'rocket.cat' }, peer: { $exists: false } },
				{ fields: { services: 0 } },
			)
			.fetch();

		// Attempt to register peer
		try {
			const {
				data: { peer, users: peersUsers },
			} = this.request('POST', '/peers', { identifier, host, port, users: localUsers });

			// Keep peer reference
			this.peer = peer;

			// Upsert all the peer's users
			upsertLocalPeerUsers(peersUsers);

			console.log('[federation] Peer is registered!');
		} catch (err) {
			console.log('[federation] Could not register peer, federation is NOT running.', err);
		}
	}

	setupCallbacks() {
		Accounts.onLogin(onLoginCallbackHandler.bind(this));
		Accounts.onLogout(onLogoutCallbackHandler.bind(this));

		RocketChat.callbacks.add('afterSaveMessage',
			afterSaveMessageCallbackHandler.bind(this),
			RocketChat.callbacks.priority.LOW, 'federation-on-save-message');
	}
}

export default PeerClient;
