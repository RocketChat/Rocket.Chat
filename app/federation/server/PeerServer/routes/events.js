import { Meteor } from 'meteor/meteor';
import { API } from '../../../../api';
import { FederationKeys } from '../../../../models';

import { Federation } from '../..';

API.v1.addRoute(
	'federation.events',
	{ authRequired: false },
	{
		post() {
			if (!Federation.peerServer.enabled) {
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

			let payload;

			// Decrypt with the peer's public key
			try {
				payload = FederationKeys.loadKey(
					peer.public_key,
					'public'
				).decryptPublic(payloadBuffer);

				// Decrypt with the local private key
				payload = Federation.privateKey.decrypt(payload);
			} catch (err) {
				throw new Meteor.Error('error-decrypt', 'Could not decrypt');
			}

			// Get the event
			const { event: e } = JSON.parse(payload.toString());

			if (!e) {
				return API.v1.failure('Event was not sent');
			}

			Federation.peerServer.log(`Received event:${ e.t }`);

			try {
				switch (e.t) {
					case 'png':
						// This is a ping so we should do nothing, just respond with success
						break;
					case 'drc':
						Federation.peerServer.handleDirectRoomCreatedEvent(e);
						break;
					case 'roc':
						Federation.peerServer.handleRoomCreatedEvent(e);
						break;
					case 'usj':
						Federation.peerServer.handleUserJoinedEvent(e);
						break;
					case 'usa':
						Federation.peerServer.handleUserAddedEvent(e);
						break;
					case 'usl':
						Federation.peerServer.handleUserLeftEvent(e);
						break;
					case 'usr':
						Federation.peerServer.handleUserRemovedEvent(e);
						break;
					case 'usm':
						Federation.peerServer.handleUserMutedEvent(e);
						break;
					case 'usu':
						Federation.peerServer.handleUserUnmutedEvent(e);
						break;
					case 'msc':
						Federation.peerServer.handleMessageCreatedEvent(e);
						break;
					case 'msu':
						Federation.peerServer.handleMessageUpdatedEvent(e);
						break;
					case 'msd':
						Federation.peerServer.handleMessageDeletedEvent(e);
						break;
					case 'msr':
						Federation.peerServer.handleMessagesReadEvent(e);
						break;
					case 'mrs':
						Federation.peerServer.handleMessagesSetReactionEvent(e);
						break;
					case 'mru':
						Federation.peerServer.handleMessagesUnsetReactionEvent(e);
						break;
					default:
						throw new Error(`Invalid event:${ e.t }`);
				}

				Federation.peerServer.log('Success, responding...');

				// Respond
				return API.v1.success();
			} catch (err) {
				Federation.peerServer.log(
					`Error handling event:${ e.t } - ${ err.toString() }`
				);

				return API.v1.failure(
					`Error handling event:${ e.t } - ${ err.toString() }`,
					err.error || 'unknown-error'
				);
			}
		},
	}
);
