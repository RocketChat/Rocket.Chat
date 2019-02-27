import { API } from 'meteor/rocketchat:api';
import { FederationKeys } from 'meteor/rocketchat:models';

import { Federation } from '../../../federation';

export default function eventsRoutes() {
	const self = this;

	API.v1.addRoute('federation.events', { authRequired: false }, {
		post() {
			if (!self.enabled) {
				return API.v1.failure('Not found');
			}

			if (!this.bodyParams.payload) {
				return API.v1.failure('Payload was not sent');
			}

			if (!this.request.headers['x-federation-domain']) {
				return API.v1.failure('Cannot handle that request');
			}

			const remotePeerDomain = this.request.headers['x-federation-domain'];

			const peer = Federation.peerDNS.searchPeer(remotePeerDomain);

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

			self.log(`Received event:${ e.t }`);

			try {
				switch (e.t) {
					case 'drc':
						self.handleDirectRoomCreatedEvent(e);
						break;
					case 'roc':
						self.handleRoomCreatedEvent(e);
						break;
					case 'usj':
						self.handleUserJoinedEvent(e);
						break;
					case 'usa':
						self.handleUserAddedEvent(e);
						break;
					case 'usl':
						self.handleUserLeftEvent(e);
						break;
					case 'usr':
						self.handleUserRemovedEvent(e);
						break;
					case 'usm':
						self.handleUserMutedEvent(e);
						break;
					case 'usu':
						self.handleUserUnmutedEvent(e);
						break;
					case 'msc':
						self.handleMessageCreatedEvent(e);
						break;
					case 'msu':
						self.handleMessageUpdatedEvent(e);
						break;
					case 'msd':
						self.handleMessageDeletedEvent(e);
						break;
					case 'msr':
						self.handleMessagesReadEvent(e);
						break;
					case 'mrs':
						self.handleMessagesSetReactionEvent(e);
						break;
					case 'mru':
						self.handleMessagesUnsetReactionEvent(e);
						break;
					default:
						throw new Error(`Invalid event:${ e.t }`);
				}

				self.log('Success, responding...');

				// Respond
				return API.v1.success();
			} catch (err) {
				self.log(`Error handling event:${ e.t } - ${ err.toString() }`);

				return API.v1.failure(`Error handling event:${ e.t } - ${ err.toString() }`, err.error || 'unknown-error');
			}
		},
	});
}
