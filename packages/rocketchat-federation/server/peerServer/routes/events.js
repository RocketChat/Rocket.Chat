import { API } from 'meteor/rocketchat:api';
import { FederationKeys } from 'meteor/rocketchat:models';

import { Federation } from '../../main';

import peerDNS from '../../peerDNS';
import peerServer from '../peerServer';

API.v1.addRoute('federation.events', { authRequired: false }, {
	post() {
		if (!peerServer.enabled) {
			return API.v1.failure('Not found');
		}

		if (!this.bodyParams.payload) {
			return API.v1.failure('Payload was not sent');
		}

		if (!this.request.headers['x-federation-domain']) {
			return API.v1.failure('Cannot handle that request');
		}

		const remotePeerDomain = this.request.headers['x-federation-domain'];

		const peer = peerDNS.searchPeer(remotePeerDomain);

		if (!peer) {
			return API.v1.failure('Could not find valid peer');
		}

		const payloadBuffer = Buffer.from(this.bodyParams.payload.data);

		// Decrypt with the peer's public key
		let payload = FederationKeys.loadKey(peer.public_key, 'public').decryptPublic(payloadBuffer);

		// Decrypt with the local private key
		payload = Federation.privateKey.decrypt(payload);

		// Get the event
		const { event: e } = JSON.parse(payload.toString());

		if (!e) {
			return API.v1.failure('Event was not sent');
		}

		peerServer.log(`Received event:${ e.t }`);

		try {
			switch (e.t) {
				case 'drc':
					peerServer.handleDirectRoomCreatedEvent(e);
					break;
				case 'roc':
					peerServer.handleRoomCreatedEvent(e);
					break;
				case 'usj':
					peerServer.handleUserJoinedEvent(e);
					break;
				case 'usa':
					peerServer.handleUserAddedEvent(e);
					break;
				case 'usl':
					peerServer.handleUserLeftEvent(e);
					break;
				case 'usr':
					peerServer.handleUserRemovedEvent(e);
					break;
				case 'usm':
					peerServer.handleUserMutedEvent(e);
					break;
				case 'usu':
					peerServer.handleUserUnmutedEvent(e);
					break;
				case 'msc':
					peerServer.handleMessageCreatedEvent(e);
					break;
				case 'msu':
					peerServer.handleMessageUpdatedEvent(e);
					break;
				case 'msd':
					peerServer.handleMessageDeletedEvent(e);
					break;
				case 'msr':
					peerServer.handleMessagesReadEvent(e);
					break;
				case 'mrs':
					peerServer.handleMessagesSetReactionEvent(e);
					break;
				case 'mru':
					peerServer.handleMessagesUnsetReactionEvent(e);
					break;
				default:
					throw new Error(`Invalid event:${ e.t }`);
			}

			peerServer.log('Success, responding...');

			// Respond
			return API.v1.success();
		} catch (err) {
			peerServer.log(`Error handling event:${ e.t } - ${ err.toString() }`);

			return API.v1.failure(`Error handling event:${ e.t } - ${ err.toString() }`, err.error || 'unknown-error');
		}
	},
});
