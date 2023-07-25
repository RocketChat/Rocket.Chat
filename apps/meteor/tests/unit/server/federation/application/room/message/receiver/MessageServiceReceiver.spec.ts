import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import { FederationMessageServiceReceiver } from '../../../../../../../../server/services/federation/application/room/message/receiver/MessageServiceReceiver';

const { FederatedUser } = proxyquire.noCallThru().load('../../../../../../../../server/services/federation/domain/FederatedUser', {
	mongodb: {
		'ObjectId': class ObjectId {
			toHexString(): string {
				return 'hexString';
			}
		},
		'@global': true,
	},
});

const { FederatedRoom } = proxyquire.noCallThru().load('../../../../../../../../server/services/federation/domain/FederatedRoom', {
	mongodb: {
		'ObjectId': class ObjectId {
			toHexString(): string {
				return 'hexString';
			}
		},
		'@global': true,
	},
});

describe('Federation - Application - FederationMessageServiceReceiver', () => {
	let service: FederationMessageServiceReceiver;
	const roomAdapter = {
		getFederatedRoomByExternalId: sinon.stub(),
	};
	const userAdapter = {
		getFederatedUserByExternalId: sinon.stub(),
	};
	const messageAdapter = {
		getMessageByFederationId: sinon.stub(),
		reactToMessage: sinon.stub(),
	};
	const settingsAdapter = {
		getHomeServerDomain: sinon.stub().returns('localDomain'),
	};

	beforeEach(() => {
		service = new FederationMessageServiceReceiver(
			roomAdapter as any,
			userAdapter as any,
			messageAdapter as any,
			{} as any,
			settingsAdapter as any,
			{} as any,
		);
	});

	afterEach(() => {
		roomAdapter.getFederatedRoomByExternalId.reset();
		userAdapter.getFederatedUserByExternalId.reset();
		messageAdapter.getMessageByFederationId.reset();
		messageAdapter.reactToMessage.reset();
	});

	describe('#onMessageReaction()', () => {
		const user = FederatedUser.createInstance('externalInviterId', {
			name: 'normalizedInviterId',
			username: 'normalizedInviterId',
			existsOnlyOnProxyServer: false,
		});
		const room = FederatedRoom.createInstance('externalRoomId', 'normalizedRoomId', user, RoomType.CHANNEL, 'externalRoomName');

		it('should NOT react to the message if the room does not exists', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(undefined);
			await service.onMessageReaction({
				externalReactedEventId: 'externalReactedEventId',
			} as any);

			expect(messageAdapter.reactToMessage.called).to.be.false;
		});

		it('should NOT react to the message if the user does not exists', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.resolves(undefined);
			await service.onMessageReaction({
				externalReactedEventId: 'externalReactedEventId',
			} as any);

			expect(messageAdapter.reactToMessage.called).to.be.false;
		});

		it('should NOT react to the message if the message does not exists', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.resolves(user);
			messageAdapter.getMessageByFederationId.resolves(undefined);
			await service.onMessageReaction({
				externalReactedEventId: 'externalReactedEventId',
			} as any);

			expect(messageAdapter.reactToMessage.called).to.be.false;
		});

		it('should NOT react to the message if it is not a Matrix federation one', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.resolves(user);
			messageAdapter.getMessageByFederationId.resolves({ msg: 'newMessageText' });
			await service.onMessageReaction({
				externalReactedEventId: 'externalReactedEventId',
			} as any);

			expect(messageAdapter.reactToMessage.called).to.be.false;
		});

		it('should NOT react to the message if the user already reacted to it', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.resolves(user);
			messageAdapter.getMessageByFederationId.resolves({
				msg: 'newMessageText',
				federation: { eventId: 'eventId' },
				reactions: {
					':emoji:': {
						usernames: ['normalizedInviterId'],
					},
				},
			});
			await service.onMessageReaction({
				externalReactedEventId: 'externalReactedEventId',
				emoji: ':emoji:',
			} as any);

			expect(messageAdapter.reactToMessage.called).to.be.false;
		});

		it('should react to the message', async () => {
			const message = {
				msg: 'newMessageText',
				federation: { eventId: 'eventId' },
				reactions: {
					':emoji:': {
						usernames: [],
					},
				},
			};
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.resolves(user);
			messageAdapter.getMessageByFederationId.resolves(message);
			await service.onMessageReaction({
				externalEventId: 'externalEventId',
				externalReactedEventId: 'externalReactedEventId',
				emoji: ':emoji:',
			} as any);

			expect(messageAdapter.reactToMessage.calledWith(user, message, ':emoji:', 'externalEventId')).to.be.true;
		});
	});
});
