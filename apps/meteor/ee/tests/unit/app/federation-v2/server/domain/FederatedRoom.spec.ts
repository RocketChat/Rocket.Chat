import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { expect } from 'chai';

import { FederatedRoomEE } from '../../../../../../app/federation-v2/server/domain/FederatedRoom';

describe('FederationEE - Domain - FederatedRoomEE', () => {
	const members = [{ internalReference: { id: 'userId' } }, { internalReference: { id: 'userId2' } }] as any;

	describe('#createInstance()', () => {
		it('should set the internal room name when it was provided', () => {
			const federatedRoom = FederatedRoomEE.createInstanceEE(
				'!externalId@id',
				'externalId',
				{ id: 'userId' } as any,
				'p' as any,
				'myRoomName',
			);
			expect(federatedRoom.internalReference.name).to.be.equal('myRoomName');
			expect(federatedRoom.internalReference.fname).to.be.equal('myRoomName');
		});

		it('should generate automatically a room name when it was not provided', () => {
			const federatedRoom = FederatedRoomEE.createInstanceEE('!externalId@id', 'externalId', { id: 'userId' } as any, 'p' as any);
			expect(federatedRoom.internalReference.name).to.be.equal('Federation-externalId');
			expect(federatedRoom.internalReference.fname).to.be.equal('Federation-externalId');
		});

		it('should set the members property when the room is a direct message one', () => {
			const federatedRoom = FederatedRoomEE.createInstanceEE(
				'!externalId@id',
				'externalId',
				{ id: 'userId' } as any,
				RoomType.DIRECT_MESSAGE,
				'',
				members,
			);
			expect(federatedRoom.members).to.be.eql(members);
		});

		it('should NOT set the members property when the room is NOT a direct message one', () => {
			const federatedRoom = FederatedRoomEE.createInstanceEE(
				'!externalId@id',
				'externalId',
				{ id: 'userId' } as any,
				RoomType.CHANNEL,
				'',
				members,
			);
			expect(federatedRoom.members).to.be.undefined;
		});

		it('should return an instance of FederatedRoom', () => {
			const federatedRoom = FederatedRoomEE.createInstanceEE('!externalId@id', 'externalId', { id: 'userId' } as any, RoomType.CHANNEL);
			expect(federatedRoom).to.be.instanceOf(FederatedRoomEE);
		});
	});

	describe('#isDirectMessage()', () => {
		it('should return true if its a direct message room', () => {
			const federatedRoom = FederatedRoomEE.createInstanceEE(
				'!externalId@id',
				'externalId',
				{ id: 'userId' } as any,
				RoomType.DIRECT_MESSAGE,
			);
			expect(federatedRoom.isDirectMessage()).to.be.true;
		});

		it('should return false if its NOT a direct message room', () => {
			const federatedRoom = FederatedRoomEE.createInstanceEE('!externalId@id', 'externalId', { id: 'userId' } as any, RoomType.CHANNEL);
			expect(federatedRoom.isDirectMessage()).to.be.false;
		});
	});

	describe('#setRoomType()', () => {
		it('should set the Room type if its not a direct message room', () => {
			const federatedRoom = FederatedRoomEE.createInstanceEE(
				'!externalId@id',
				'externalId',
				{ id: 'userId' } as any,
				RoomType.PRIVATE_GROUP,
			);
			federatedRoom.setRoomType(RoomType.CHANNEL);
			expect(federatedRoom.internalReference.t).to.be.equal(RoomType.CHANNEL);
		});

		it('should throw an error when trying to set the room type if its a direct message room', () => {
			const federatedRoom = FederatedRoomEE.createInstanceEE(
				'!externalId@id',
				'externalId',
				{ id: 'userId' } as any,
				RoomType.DIRECT_MESSAGE,
			);
			expect(() => federatedRoom.setRoomType(RoomType.CHANNEL)).to.be.throw('Its not possible to change a direct message type');
		});
	});

	describe('#changeRoomName()', () => {
		it('should change the Room name if its not a direct message room', () => {
			const federatedRoom = FederatedRoomEE.createInstanceEE(
				'!externalId@id',
				'externalId',
				{ id: 'userId' } as any,
				RoomType.PRIVATE_GROUP,
			);
			federatedRoom.changeRoomName('newName');
			expect(federatedRoom.internalReference.name).to.be.equal('newName');
			expect(federatedRoom.internalReference.fname).to.be.equal('newName');
		});

		it('should throw an error when trying to change the room name if its a direct message room', () => {
			const federatedRoom = FederatedRoomEE.createInstanceEE(
				'!externalId@id',
				'externalId',
				{ id: 'userId' } as any,
				RoomType.DIRECT_MESSAGE,
			);
			expect(() => federatedRoom.changeRoomName('newName')).to.be.throw('Its not possible to change a direct message name');
		});
	});

	describe('#changeRoomTopic()', () => {
		it('should change the Room topic if its not a direct message room', () => {
			const federatedRoom = FederatedRoomEE.createInstanceEE(
				'!externalId@id',
				'externalId',
				{ id: 'userId' } as any,
				RoomType.PRIVATE_GROUP,
			);
			federatedRoom.changeRoomTopic('newName');
			expect(federatedRoom.internalReference.description).to.be.equal('newName');
		});

		it('should throw an error when trying to change the room topic if its a direct message room', () => {
			const federatedRoom = FederatedRoomEE.createInstanceEE(
				'!externalId@id',
				'externalId',
				{ id: 'userId' } as any,
				RoomType.DIRECT_MESSAGE,
			);
			expect(() => federatedRoom.changeRoomTopic('newName')).to.be.throw('Its not possible to change a direct message topic');
		});
	});

	describe('#changeRoomTopic()', () => {
		it('should change the Room topic if its not a direct message room', () => {
			const federatedRoom = FederatedRoomEE.createInstanceEE(
				'!externalId@id',
				'externalId',
				{ id: 'userId' } as any,
				RoomType.PRIVATE_GROUP,
			);
			federatedRoom.changeRoomTopic('newName');
			expect(federatedRoom.internalReference.description).to.be.equal('newName');
		});

		it('should throw an error when trying to change the room topic if its a direct message room', () => {
			const federatedRoom = FederatedRoomEE.createInstanceEE(
				'!externalId@id',
				'externalId',
				{ id: 'userId' } as any,
				RoomType.DIRECT_MESSAGE,
			);
			expect(() => federatedRoom.changeRoomTopic('newName')).to.be.throw('Its not possible to change a direct message topic');
		});
	});

	describe('#getMembers()', () => {
		it('should return the internalReference members if the room is a direct message', () => {
			const federatedRoom = FederatedRoomEE.createInstanceEE(
				'!externalId@id',
				'externalId',
				{ id: 'userId' } as any,
				RoomType.DIRECT_MESSAGE,
				'',
				members,
			);
			expect(federatedRoom.getMembers()).to.be.eql(members.map((user: any) => user.internalReference));
		});

		it('should return an empty array if the room is not a direct message room', () => {
			const federatedRoom = FederatedRoomEE.createInstanceEE(
				'!externalId@id',
				'externalId',
				{ id: 'userId' } as any,
				RoomType.CHANNEL,
				'',
				members,
			);
			expect(federatedRoom.getMembers()).to.be.eql([]);
		});
	});
});
