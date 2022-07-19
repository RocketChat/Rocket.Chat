import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { expect } from 'chai';

import { FederatedRoom } from '../../../../../../../app/federation-v2/server/domain/FederatedRoom';

describe('Federation - Domain - FederatedRoom', () => {
	const members = [{ internalReference: { id: 'userId' } }, { internalReference: { id: 'userId2' } }] as any;

	describe('#createInstance()', () => {
		it('should set the internal room name when it was provided', () => {
			const federatedRoom = FederatedRoom.createInstance('!externalId@id', 'externalId', { id: 'userId' } as any, 'p' as any, 'myRoomName');
			expect(federatedRoom.internalReference.name).to.be.equal('myRoomName');
			expect(federatedRoom.internalReference.fname).to.be.equal('myRoomName');
		});

		it('should generate automatically a room name when it was not provided', () => {
			const federatedRoom = FederatedRoom.createInstance('!externalId@id', 'externalId', { id: 'userId' } as any, 'p' as any);
			expect(federatedRoom.internalReference.name).to.be.equal('Federation-externalId');
			expect(federatedRoom.internalReference.fname).to.be.equal('Federation-externalId');
		});

		it('should set the members property when the room is a direct message one(the only one available)', () => {
			const federatedRoom = FederatedRoom.createInstance(
				'!externalId@id',
				'externalId',
				{ id: 'userId' } as any,
				RoomType.DIRECT_MESSAGE,
				'',
				members,
			);
			expect(federatedRoom.members).to.be.eql(members);
		});
		it('should return an instance of FederatedRoom', () => {
			const federatedRoom = FederatedRoom.createInstance('!externalId@id', 'externalId', { id: 'userId' } as any, RoomType.CHANNEL);
			expect(federatedRoom).to.be.instanceOf(FederatedRoom);
		});
	});

	describe('#getMembers()', () => {
		it('should return the internalReference members if the room is a direct message (the only available)', () => {
			const federatedRoom = FederatedRoom.createInstance(
				'!externalId@id',
				'externalId',
				{ id: 'userId' } as any,
				RoomType.DIRECT_MESSAGE,
				'',
				members,
			);
			expect(federatedRoom.getMembers()).to.be.eql(members.map((user: any) => user.internalReference));
		});
	});

	describe('#isFederated()', () => {
		it('should return true if the room is federated', () => {
			const federatedRoom = FederatedRoom.createInstance(
				'!externalId@id',
				'externalId',
				{ id: 'userId' } as any,
				RoomType.DIRECT_MESSAGE,
				'',
				members,
			);
			federatedRoom.internalReference.federated = true;
			expect(federatedRoom.isFederated()).to.be.true;
		});

		it('should return false if the room is NOT federated', () => {
			const federatedRoom = FederatedRoom.createInstance(
				'!externalId@id',
				'externalId',
				{ id: 'userId' } as any,
				RoomType.DIRECT_MESSAGE,
				'',
				members,
			);
			expect(federatedRoom.isFederated()).to.be.false;
		});
	});

	describe('#buildRoomIdForDirectMessages()', () => {
		it('should throw an error if the inviter does not have the user', () => {
			expect(() =>
				FederatedRoom.buildRoomIdForDirectMessages(
					{ internalReference: undefined } as any,
					{ internalReference: { _id: 'userId2', name: 'name' } } as any,
				),
			).to.throw('Cannot create room Id without the user ids');
		});

		it('should throw an error if the invitee does not have the user', () => {
			expect(() =>
				FederatedRoom.buildRoomIdForDirectMessages(
					{ internalReference: { _id: 'userId2', name: 'name' } } as any,
					{ internalReference: undefined } as any,
				),
			).to.throw('Cannot create room Id without the user ids');
		});

		it('should return a string with the users id concatenated', () => {
			expect(
				FederatedRoom.buildRoomIdForDirectMessages(
					{ internalReference: { _id: 'userId1', name: 'name' } } as any,
					{ internalReference: { _id: 'userId2', name: 'name' } } as any,
				),
			).to.be.equal('userId1userId2');
		});

		it('should return a string with the users id concatenated ordering alphabetically', () => {
			expect(
				FederatedRoom.buildRoomIdForDirectMessages(
					{ internalReference: { _id: 'userId1', name: 'name2' } } as any,
					{ internalReference: { _id: 'userId2', name: 'name1' } } as any,
				),
			).to.be.equal('userId1userId2');
		});
	});

	describe('#setRoomType()', () => {
		it('should set the Room type if its not a direct message room', () => {
			const federatedRoom = FederatedRoom.createInstance('!externalId@id', 'externalId', { id: 'userId' } as any, RoomType.PRIVATE_GROUP);
			federatedRoom.setRoomType(RoomType.CHANNEL);
			expect(federatedRoom.internalReference.t).to.be.equal(RoomType.CHANNEL);
		});

		it('should throw an error when trying to set the room type if its a direct message room', () => {
			const federatedRoom = FederatedRoom.createInstance('!externalId@id', 'externalId', { id: 'userId' } as any, RoomType.DIRECT_MESSAGE);
			expect(() => federatedRoom.setRoomType(RoomType.CHANNEL)).to.be.throw('Its not possible to change a direct message type');
		});
	});

	describe('#changeRoomName()', () => {
		it('should change the Room name if its not a direct message room', () => {
			const federatedRoom = FederatedRoom.createInstance('!externalId@id', 'externalId', { id: 'userId' } as any, RoomType.PRIVATE_GROUP);
			federatedRoom.changeRoomName('newName');
			expect(federatedRoom.internalReference.name).to.be.equal('newName');
			expect(federatedRoom.internalReference.fname).to.be.equal('newName');
		});

		it('should throw an error when trying to change the room name if its a direct message room', () => {
			const federatedRoom = FederatedRoom.createInstance('!externalId@id', 'externalId', { id: 'userId' } as any, RoomType.DIRECT_MESSAGE);
			expect(() => federatedRoom.changeRoomName('newName')).to.be.throw('Its not possible to change a direct message name');
		});
	});

	describe('#changeRoomTopic()', () => {
		it('should change the Room topic if its not a direct message room', () => {
			const federatedRoom = FederatedRoom.createInstance('!externalId@id', 'externalId', { id: 'userId' } as any, RoomType.PRIVATE_GROUP);
			federatedRoom.changeRoomTopic('newName');
			expect(federatedRoom.internalReference.topic).to.be.equal('newName');
		});

		it('should throw an error when trying to change the room topic if its a direct message room', () => {
			const federatedRoom = FederatedRoom.createInstance('!externalId@id', 'externalId', { id: 'userId' } as any, RoomType.DIRECT_MESSAGE);
			expect(() => federatedRoom.changeRoomTopic('newName')).to.be.throw('Its not possible to change a direct message topic');
		});
	});
});
