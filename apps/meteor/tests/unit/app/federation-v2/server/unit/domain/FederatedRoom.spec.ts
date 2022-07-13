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
		it('should return a string with the users id concatenated', () => {
			expect(
				FederatedRoom.buildRoomIdForDirectMessages(
					{ internalReference: { _id: 'userId1' } } as any,
					{ internalReference: { _id: 'userId2' } } as any,
				),
			).to.be.equal('userId1userId2');
		});
	});
});
