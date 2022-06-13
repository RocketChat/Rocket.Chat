import { expect } from 'chai';
import sinon from 'sinon';

import { FederationRoomServiceSender } from '../../../../../../app/federation-v2/server/application/RoomServiceSender';
import { FederatedRoom } from '../../../../../../app/federation-v2/server/domain/FederatedRoom';

describe('Federation - Application - FederationRoomServiceSender', () => {
	let service: FederationRoomServiceSender;
	const roomAdapter = {
		getFederatedRoomByExternalId: sinon.stub(),
		getFederatedRoomByInternalId: sinon.stub(),
		createFederatedRoom: sinon.stub(),
		updateFederatedRoomByInternalRoomId: sinon.stub(),
		removeUserFromRoom: sinon.stub(),
		addUserToRoom: sinon.stub(),
		getInternalRoomById: sinon.stub(),
	};
	const userAdapter = {
		getFederatedUserByExternalId: sinon.stub(),
		getFederatedUserByInternalId: sinon.stub(),
		createFederatedUser: sinon.stub(),
		getInternalUserById: sinon.stub(),
		getFederatedUserByInternalUsername: sinon.stub(),
	};
	const settingsAdapter = {
		getHomeServerDomain: sinon.stub(),
	};
	const bridge = {
		getUserProfileInformation: sinon.stub().resolves({}),
		isUserIdFromTheSameHomeserver: sinon.stub(),
		sendMessage: sinon.stub(),
		createUser: sinon.stub(),
		inviteToRoom: sinon.stub().returns(new Promise((resolve) => resolve({}))),
		createRoom: sinon.stub(),
		joinRoom: sinon.stub(),
	};

	beforeEach(() => {
		service = new FederationRoomServiceSender(roomAdapter as any, userAdapter as any, settingsAdapter as any, bridge as any);
	});

	afterEach(() => {
		roomAdapter.getFederatedRoomByExternalId.reset();
		roomAdapter.getFederatedRoomByInternalId.reset();
		roomAdapter.createFederatedRoom.reset();
		roomAdapter.updateFederatedRoomByInternalRoomId.reset();
		roomAdapter.addUserToRoom.reset();
		roomAdapter.getInternalRoomById.reset();
		userAdapter.getFederatedUserByExternalId.reset();
		userAdapter.getFederatedUserByInternalId.reset();
		userAdapter.getInternalUserById.reset();
		userAdapter.createFederatedUser.reset();
		userAdapter.getFederatedUserByInternalUsername.reset();
		settingsAdapter.getHomeServerDomain.reset();
		bridge.isUserIdFromTheSameHomeserver.reset();
		bridge.sendMessage.reset();
		bridge.createUser.reset();
		bridge.createRoom.reset();
		bridge.inviteToRoom.reset();
		bridge.joinRoom.reset();
	});

	describe('#sendMessageFromRocketChat()', () => {
		it('should throw an error if the sender does not exists ', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(undefined);
			try {
				await service.sendMessageFromRocketChat({ internalSenderId: 'internalSenderId' } as any);
			} catch (e: any) {
				expect(e.message).to.be.equal('Could not find user id for internalSenderId');
			}
		});

		it('should throw an error if the room does not exists', async () => {
			userAdapter.getFederatedUserByInternalId.resolves({} as any);
			roomAdapter.getFederatedRoomByInternalId.resolves(undefined);
			try {
				await service.sendMessageFromRocketChat({ internalRoomId: 'internalRoomId' } as any);
			} catch (e: any) {
				expect(e.message).to.be.equal('Could not find room id for internalRoomId');
			}
		});

		it('should send the message through the bridge', async () => {
			userAdapter.getFederatedUserByInternalId.resolves({ externalId: 'externalId' } as any);
			roomAdapter.getFederatedRoomByInternalId.resolves({ externalId: 'externalId' } as any);
			await service.sendMessageFromRocketChat({ message: { msg: 'text' } } as any);
			expect(bridge.sendMessage.calledWith('externalId', 'externalId', 'text')).to.be.true;
		});
	});

	describe('#isAFederatedRoom()', () => {
		it('should return false if internalRoomId is undefined', async () => {
			expect(await service.isAFederatedRoom('')).to.be.false;
		});

		it('should return false if the room does not exist', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(undefined);
			expect(await service.isAFederatedRoom('')).to.be.false;
		});

		it('should return true if the room is NOT federated', async () => {
			const room = FederatedRoom.build();
			room.internalReference = {} as any;
			room.internalReference.federated = false;
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			expect(await service.isAFederatedRoom('internalRoomId')).to.be.false;
		});

		it('should return true if the room is federated', async () => {
			const room = FederatedRoom.build();
			room.internalReference = {} as any;
			room.internalReference.federated = true;
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			expect(await service.isAFederatedRoom('internalRoomId')).to.be.true;
		});
	});
});
