import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { expect } from 'chai';
import sinon from 'sinon';
import proxyquire from 'proxyquire';

import { FederationMessageServiceSender } from '../../../../../../../../app/federation-v2/server/application/sender/MessageServiceSender';

const { FederatedUser } = proxyquire.noCallThru().load('../../../../../../../../app/federation-v2/server/domain/FederatedUser', {
	mongodb: {
		'ObjectId': class ObjectId {
			toHexString(): string {
				return 'hexString';
			}
		},
		'@global': true,
	},
});

const { FederatedRoom } = proxyquire.noCallThru().load('../../../../../../../../app/federation-v2/server/domain/FederatedRoom', {
	mongodb: {
		'ObjectId': class ObjectId {
			toHexString(): string {
				return 'hexString';
			}
		},
		'@global': true,
	},
});

describe('Federation - Application - FederationMessageServiceSender', () => {
	let service: FederationMessageServiceSender;
	const roomAdapter = {
		getFederatedRoomByInternalId: sinon.stub(),
	};
	const userAdapter = {
		getFederatedUserByInternalId: sinon.stub(),
	};
	const settingsAdapter = {
		getHomeServerDomain: sinon.stub().returns('localDomain'),
	};
	const messageAdapter = {
		setExternalFederationEventOnMessageReaction: sinon.stub(),
		unsetExternalFederationEventOnMessageReaction: sinon.stub(),
	};
	const bridge = {
		extractHomeserverOrigin: sinon.stub(),
		sendMessageReaction: sinon.stub(),
		redactEvent: sinon.stub(),
	};

	beforeEach(() => {
		service = new FederationMessageServiceSender(
			roomAdapter as any,
			userAdapter as any,
			settingsAdapter as any,
			messageAdapter as any,
			bridge as any,
		);
	});

	afterEach(() => {
		roomAdapter.getFederatedRoomByInternalId.reset();
		userAdapter.getFederatedUserByInternalId.reset();
		bridge.extractHomeserverOrigin.reset();
		messageAdapter.setExternalFederationEventOnMessageReaction.reset();
		messageAdapter.unsetExternalFederationEventOnMessageReaction.reset();
		bridge.sendMessageReaction.reset();
		bridge.redactEvent.reset();
	});

	describe('#sendExternalMessageReaction()', () => {
		const user = FederatedUser.createInstance('externalInviterId', {
			name: 'normalizedInviterId',
			username: 'normalizedInviterId',
			existsOnlyOnProxyServer: true,
		});
		const room = FederatedRoom.createInstance('externalRoomId', 'normalizedRoomId', user, RoomType.CHANNEL, 'externalRoomName');

		it('should not send the reaction if the internal message does not exists', async () => {
			await service.sendExternalMessageReaction(undefined as any, {} as any, 'reaction');

			expect(bridge.sendMessageReaction.called).to.be.false;
			expect(userAdapter.getFederatedUserByInternalId.called).to.be.false;
		});

		it('should not send the reaction if the internal user does not exists', async () => {
			await service.sendExternalMessageReaction({} as any, undefined as any, 'reaction');

			expect(bridge.sendMessageReaction.called).to.be.false;
			expect(userAdapter.getFederatedUserByInternalId.called).to.be.false;
		});

		it('should not send the reaction if the internal user id does not exists', async () => {
			await service.sendExternalMessageReaction({} as any, {} as any, 'reaction');

			expect(bridge.sendMessageReaction.called).to.be.false;
			expect(userAdapter.getFederatedUserByInternalId.called).to.be.false;
		});

		it('should not send the reaction if the internal message room id does not exists', async () => {
			await service.sendExternalMessageReaction({} as any, { _id: 'id' } as any, 'reaction');

			expect(bridge.sendMessageReaction.called).to.be.false;
			expect(userAdapter.getFederatedUserByInternalId.called).to.be.false;
		});

		it('should not send the reaction the user does not exists', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(undefined);
			await service.sendExternalMessageReaction({ rid: 'roomId' } as any, { _id: 'id' } as any, 'reaction');

			expect(bridge.sendMessageReaction.called).to.be.false;
		});

		it('should not send the reaction the room does not exists', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(user);
			roomAdapter.getFederatedRoomByInternalId.resolves(undefined);
			await service.sendExternalMessageReaction({ rid: 'roomId' } as any, { _id: 'id' } as any, 'reaction');

			expect(bridge.sendMessageReaction.called).to.be.false;
		});

		it('should not send the reaction the the message is not from matrix federation', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(user);
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			await service.sendExternalMessageReaction({ rid: 'roomId' } as any, { _id: 'id' } as any, 'reaction');

			expect(bridge.sendMessageReaction.called).to.be.false;
		});

		it('should not send the reaction if the user is not from the same home server', async () => {
			bridge.extractHomeserverOrigin.returns('externalDomain');
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.resolves(user);
			await service.sendExternalMessageReaction(
				{ rid: 'roomId', federation: { eventId: 'eventId' } } as any,
				{ _id: 'id' } as any,
				'reaction',
			);

			expect(bridge.sendMessageReaction.called).to.be.false;
		});

		it('should send the reaction', async () => {
			bridge.extractHomeserverOrigin.returns('localDomain');
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.resolves(user);
			bridge.sendMessageReaction.resolves('returnedEventId');
			await service.sendExternalMessageReaction(
				{ rid: 'roomId', federation: { eventId: 'eventId' } } as any,
				{ _id: 'id' } as any,
				'reaction',
			);

			expect(bridge.sendMessageReaction.calledWith(room.getExternalId(), user.getExternalId(), 'eventId', 'reaction')).to.be.true;
			expect(
				messageAdapter.setExternalFederationEventOnMessageReaction.calledWith(
					user.getUsername(),
					{ rid: 'roomId', federation: { eventId: 'eventId' } },
					'reaction',
					'returnedEventId',
				),
			).to.be.true;
		});
	});

	describe('#sendExternalMessageUnReaction()', () => {
		const user = FederatedUser.createInstance('externalInviterId', {
			name: 'normalizedInviterId',
			username: 'normalizedInviterId',
			existsOnlyOnProxyServer: true,
		});
		const room = FederatedRoom.createInstance('externalRoomId', 'normalizedRoomId', user, RoomType.CHANNEL, 'externalRoomName');

		it('should not send the unreaction if the internal message does not exists', async () => {
			await service.sendExternalMessageUnReaction(undefined as any, {} as any, 'reaction');

			expect(bridge.sendMessageReaction.called).to.be.false;
			expect(userAdapter.getFederatedUserByInternalId.called).to.be.false;
		});

		it('should not send the unreaction if the internal user does not exists', async () => {
			await service.sendExternalMessageUnReaction({} as any, undefined as any, 'reaction');

			expect(bridge.sendMessageReaction.called).to.be.false;
			expect(userAdapter.getFederatedUserByInternalId.called).to.be.false;
		});

		it('should not send the unreaction if the internal user id does not exists', async () => {
			await service.sendExternalMessageUnReaction({} as any, {} as any, 'reaction');

			expect(bridge.sendMessageReaction.called).to.be.false;
			expect(userAdapter.getFederatedUserByInternalId.called).to.be.false;
		});

		it('should not send the unreaction if the internal message room id does not exists', async () => {
			await service.sendExternalMessageUnReaction({} as any, { _id: 'id' } as any, 'reaction');

			expect(bridge.sendMessageReaction.called).to.be.false;
			expect(userAdapter.getFederatedUserByInternalId.called).to.be.false;
		});

		it('should not send the unreaction the user does not exists', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(undefined);
			await service.sendExternalMessageUnReaction({ rid: 'roomId' } as any, { _id: 'id' } as any, 'reaction');

			expect(bridge.sendMessageReaction.called).to.be.false;
		});

		it('should not send the unreaction the room does not exists', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(user);
			roomAdapter.getFederatedRoomByInternalId.resolves(undefined);
			await service.sendExternalMessageUnReaction({ rid: 'roomId' } as any, { _id: 'id' } as any, 'reaction');

			expect(bridge.sendMessageReaction.called).to.be.false;
		});

		it('should not send the unreaction the the message is not from matrix federation', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(user);
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			await service.sendExternalMessageUnReaction({ rid: 'roomId' } as any, { _id: 'id' } as any, 'reaction');

			expect(bridge.sendMessageReaction.called).to.be.false;
		});

		it('should not send the unreaction if the user is not from the same home server', async () => {
			bridge.extractHomeserverOrigin.onCall(0).returns('localDomain');
			bridge.extractHomeserverOrigin.onCall(1).returns('externalDomain');
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.resolves(user);
			await service.sendExternalMessageUnReaction(
				{ rid: 'roomId', federation: { eventId: 'eventId' } } as any,
				{ _id: 'id' } as any,
				'reaction',
			);

			expect(bridge.sendMessageReaction.called).to.be.false;
		});

		it('should not send the unreaction if the user is not from the same home server', async () => {
			bridge.extractHomeserverOrigin.returns('externalDomain');
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.resolves(user);
			await service.sendExternalMessageUnReaction(
				{ rid: 'roomId', federation: { eventId: 'eventId' } } as any,
				{ _id: 'id' } as any,
				'reaction',
			);

			expect(bridge.sendMessageReaction.called).to.be.false;
		});

		it('should not send the unreaction if there is no existing reaction', async () => {
			bridge.extractHomeserverOrigin.returns('localDomain');
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.resolves(user);
			await service.sendExternalMessageUnReaction(
				{ rid: 'roomId', federation: { eventId: 'eventId' } } as any,
				{ _id: 'id' } as any,
				'reaction',
			);

			expect(bridge.sendMessageReaction.called).to.be.false;
		});

		it('should send the unreaction', async () => {
			const message = {
				rid: 'roomId',
				federation: { eventId: 'eventId' },
				reactions: {
					reaction: {
						federationReactionEventIds: {
							eventId: user.getUsername(),
						},
					},
				},
			} as any;
			bridge.extractHomeserverOrigin.returns('localDomain');
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.resolves(user);
			await service.sendExternalMessageUnReaction(message, { _id: 'id', username: user.getUsername() } as any, 'reaction');

			expect(bridge.redactEvent.calledWith(room.getExternalId(), user.getExternalId(), 'eventId')).to.be.true;
			expect(messageAdapter.unsetExternalFederationEventOnMessageReaction.calledWith('eventId', message, 'reaction')).to.be.true;
		});
	});
});
