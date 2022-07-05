import { expect } from 'chai';
import sinon from 'sinon';
import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';

import { FederationRoomServiceReceiverEE } from '../../../../../../app/federation-v2/server/application/RoomServiceReceiver';
import { FederatedRoomEE } from '../../../../../../app/federation-v2/server/domain/FederatedRoom';

describe('FederationEE - Application - FederationRoomServiceReceiverEE', () => {
	let service: FederationRoomServiceReceiverEE;
	const roomAdapter = {
		getFederatedRoomByExternalId: sinon.stub(),
		updateRoomType: sinon.stub(),
		updateRoomName: sinon.stub(),
		updateRoomTopic: sinon.stub(),
	};
	const userAdapter = {};
	const messageAdapter = {};
	const settingsAdapter = {};
	const bridge = {};

	beforeEach(() => {
		service = new FederationRoomServiceReceiverEE(
			roomAdapter as any,
			userAdapter as any,
			messageAdapter as any,
			settingsAdapter as any,
			bridge as any,
		);
	});

	afterEach(() => {
		roomAdapter.getFederatedRoomByExternalId.reset();
		roomAdapter.updateRoomType.reset();
		roomAdapter.updateRoomName.reset();
		roomAdapter.updateRoomTopic.reset();
	});

	describe('#changeJoinRules()', () => {
		it('should NOT change the room type if the room does not exists', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(undefined);
			await service.changeJoinRules({
				roomType: RoomType.CHANNEL,
			} as any);

			expect(roomAdapter.updateRoomType.called).to.be.false;
		});

		it('should NOT change the room type if it exists and is a direct message', async () => {
			const room = FederatedRoomEE.build();
			room.internalReference = {} as any;
			room.internalReference.t = RoomType.DIRECT_MESSAGE;
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			await service.changeJoinRules({
				roomType: RoomType.CHANNEL,
			} as any);

			expect(roomAdapter.updateRoomType.called).to.be.false;
		});

		it('should change the room type if it exists and is NOT a direct message', async () => {
			const room = FederatedRoomEE.build();
			room.internalReference = {} as any;
			room.internalReference.t = RoomType.PRIVATE_GROUP;
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			await service.changeJoinRules({
				roomType: RoomType.CHANNEL,
			} as any);
			room.internalReference.t = RoomType.CHANNEL;
			expect(roomAdapter.updateRoomType.calledWith(room)).to.be.true;
		});
	});

	describe('#changeRoomName()', () => {
		it('should NOT change the room name if the room does not exists', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(undefined);
			await service.changeRoomName({
				normalizedRoomName: 'normalizedRoomName',
			} as any);

			expect(roomAdapter.updateRoomName.called).to.be.false;
		});

		it('should NOT change the room name if it exists and is a direct message', async () => {
			const room = FederatedRoomEE.build();
			room.internalReference = {} as any;
			room.internalReference.t = RoomType.DIRECT_MESSAGE;
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			await service.changeRoomName({
				normalizedRoomName: 'normalizedRoomName',
			} as any);

			expect(roomAdapter.updateRoomName.called).to.be.false;
		});

		it('should change the room name if it exists and is NOT a direct message', async () => {
			const room = FederatedRoomEE.build();
			room.internalReference = {} as any;
			room.internalReference.t = RoomType.PRIVATE_GROUP;
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			await service.changeRoomName({
				roomnormalizedRoomNameType: 'normalizedRoomName',
			} as any);
			room.internalReference.name = 'normalizedRoomName';
			room.internalReference.fname = 'normalizedRoomName';
			expect(roomAdapter.updateRoomName.calledWith(room)).to.be.true;
		});
	});

	describe('#changeRoomTopic()', () => {
		it('should NOT change the room topic if the room does not exists', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(undefined);
			await service.changeRoomTopic({
				roomTopic: 'roomTopic',
			} as any);

			expect(roomAdapter.updateRoomTopic.called).to.be.false;
		});

		it('should NOT change the room topic if it exists and is a direct message', async () => {
			const room = FederatedRoomEE.build();
			room.internalReference = {} as any;
			room.internalReference.t = RoomType.DIRECT_MESSAGE;
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			await service.changeRoomTopic({
				roomTopic: 'roomTopic',
			} as any);

			expect(roomAdapter.updateRoomTopic.called).to.be.false;
		});

		it('should change the room topic if it exists and is NOT a direct message', async () => {
			const room = FederatedRoomEE.build();
			room.internalReference = {} as any;
			room.internalReference.t = RoomType.PRIVATE_GROUP;
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			await service.changeRoomTopic({
				roomTopic: 'roomTopic',
			} as any);
			room.internalReference.description = 'roomTopic';
			expect(roomAdapter.updateRoomTopic.calledWith(room)).to.be.true;
		});
	});
});
