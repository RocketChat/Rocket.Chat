import { expect } from 'chai';

import {
	FederationRoomInviteUserDto,
	FederationOnRoomCreationDto,
	FederationSetupRoomDto,
} from '../../../../../../../../app/federation-v2/server/application/input/RoomSenderDto';
import { FederationRoomSenderConverterEE } from '../../../../../../../../app/federation-v2/server/infrastructure/rocket-chat/converters/RoomSender';

describe('FederationEE - Infrastructure - Matrix - FederationRoomSenderConverterEE', () => {
	const inviteeId = '@marcos.defendi:matrix.org';

	describe('#toRoomInviteUserDto()', () => {
		it('should return an instance of FederationRoomInviteUserDto', () => {
			expect(FederationRoomSenderConverterEE.toRoomInviteUserDto('inviterId', 'roomId', inviteeId)).to.be.instanceOf(
				FederationRoomInviteUserDto,
			);
		});

		it('should return the basic user  properties correctly (normalizedInviteeId without any "@" and inviteeUsernameOnly only the part before the ":") if any', () => {
			const result = FederationRoomSenderConverterEE.toRoomInviteUserDto('inviterId', 'roomId', inviteeId);
			expect(result.normalizedInviteeId).to.be.equal('marcos.defendi:matrix.org');
			expect(result.internalRoomId).to.be.equal('roomId');
			expect(result.inviteeUsernameOnly).to.be.equal('marcos.defendi');
			expect(result.internalInviterId).to.be.equal('inviterId');
			expect(result.rawInviteeId).to.be.equal(inviteeId);
		});
	});

	describe('#toSetupRoomDto()', () => {
		it('should return an instance of FederationSetupRoomDto', () => {
			expect(FederationRoomSenderConverterEE.toSetupRoomDto('inviterId', 'roomId')).to.be.instanceOf(FederationSetupRoomDto);
		});

		it('should return the invitees without the owner and with normalized invitees', () => {
			const result = FederationRoomSenderConverterEE.toSetupRoomDto('inviterId', 'roomId');

			expect(result.internalRoomId).to.be.equal('roomId');
			expect(result.internalInviterId).to.be.equal('inviterId');
		});
	});

	describe('#toOnRoomCreationDto()', () => {
		it('should return an instance of FederationRoomInviteUserDto', () => {
			expect(
				FederationRoomSenderConverterEE.toOnRoomCreationDto('inviterId', 'username', 'roomId', ['username1'], 'domain'),
			).to.be.instanceOf(FederationOnRoomCreationDto);
		});

		it('should return the invitees without the owner and with normalized invitees', () => {
			const result = FederationRoomSenderConverterEE.toOnRoomCreationDto(
				'inviterId',
				'username',
				'roomId',
				[inviteeId, 'username'],
				'domain',
			);
			expect(result.internalRoomId).to.be.equal('roomId');
			expect(result.internalInviterId).to.be.equal('inviterId');
			expect(result.invitees).to.be.eql([
				{
					normalizedInviteeId: inviteeId.replace('@', ''),
					inviteeUsernameOnly: inviteeId.split(':')[0]?.replace('@', ''),
					rawInviteeId: `@${inviteeId.replace('@', '')}`,
				},
			]);
		});
	});

	describe('#toOnAddedUsersToARoomDto()', () => {
		it('should return the invitees without the owner and with normalized invitees', () => {
			const result = FederationRoomSenderConverterEE.toOnAddedUsersToARoomDto(
				'inviterId',
				'username',
				'roomId',
				[inviteeId, 'username'],
				'domain',
			);
			expect(result.internalRoomId).to.be.equal('roomId');
			expect(result.internalInviterId).to.be.equal('inviterId');
			expect(result.invitees).to.be.eql([
				{
					normalizedInviteeId: inviteeId.replace('@', ''),
					inviteeUsernameOnly: inviteeId.split(':')[0]?.replace('@', ''),
					rawInviteeId: `@${inviteeId.replace('@', '')}`,
				},
			]);
		});

		it('should return the inviteComesFromAnExternalHomeServer property as true when the invite comes from an external home server', () => {
			const result = FederationRoomSenderConverterEE.toOnAddedUsersToARoomDto(
				'inviterId',
				'username:matrix.org',
				'roomId',
				[inviteeId, 'username'],
				'domain',
			);
			expect(result.inviteComesFromAnExternalHomeServer).to.be.equal(true);
		});

		it('should return the inviteComesFromAnExternalHomeServer property as false when the invite comes from an external home server', () => {
			const result = FederationRoomSenderConverterEE.toOnAddedUsersToARoomDto(
				'inviterId',
				'username:matrix.org',
				'roomId',
				[inviteeId, 'username'],
				'matrix.org',
			);
			expect(result.inviteComesFromAnExternalHomeServer).to.be.equal(false);
		});
	});

	describe('#toOnDirectMessageCreatedDto()', () => {
		it('should return the invitees without the owner and with normalized invitees', () => {
			const result = FederationRoomSenderConverterEE.toOnDirectMessageCreatedDto(
				'inviterId',
				'roomId',
				[inviteeId, { _id: 'inviterId', username: 'username' } as any, { _id: '_id', username: 'usernameToBeInvited' } as any],
				'domain',
			);

			expect(result.invitees).to.be.eql([
				{
					normalizedInviteeId: inviteeId.replace('@', ''),
					inviteeUsernameOnly: inviteeId.split(':')[0]?.replace('@', ''),
					rawInviteeId: `@${inviteeId.replace('@', '')}`,
				},
				{
					normalizedInviteeId: 'usernameToBeInvited:domain',
					inviteeUsernameOnly: 'usernameToBeInvited',
					rawInviteeId: '@usernameToBeInvited:domain',
				},
			]);
		});

		it('should return the inviteComesFromAnExternalHomeServer property as true when the invite comes from an external home server', () => {
			const result = FederationRoomSenderConverterEE.toOnDirectMessageCreatedDto(
				'@inviterId:matrix.org',
				'roomId',
				[inviteeId, 'username'],
				'domain',
			);
			expect(result.inviteComesFromAnExternalHomeServer).to.be.equal(true);
		});

		it('should return the inviteComesFromAnExternalHomeServer property as false when the invite comes from an external home server', () => {
			const result = FederationRoomSenderConverterEE.toOnDirectMessageCreatedDto(
				'inviterId',
				'roomId',
				[inviteeId, 'username'],
				'matrix.org',
			);
			expect(result.inviteComesFromAnExternalHomeServer).to.be.equal(false);
		});
	});

	describe('#toBeforeDirectMessageCreatedDto()', () => {
		it('should return the invitees without the owner and with normalized invitees', () => {
			const result = FederationRoomSenderConverterEE.toBeforeDirectMessageCreatedDto(
				[inviteeId, { _id: 'inviterId', username: 'username' } as any, { _id: '_id', username: 'usernameToBeInvited' } as any],
				'domain',
			);

			expect(result.invitees).to.be.eql([
				{
					normalizedInviteeId: inviteeId.replace('@', ''),
					inviteeUsernameOnly: inviteeId.split(':')[0]?.replace('@', ''),
					rawInviteeId: `@${inviteeId.replace('@', '')}`,
				},
			]);
		});
	});

	describe('#toBeforeAddUserToARoomDto()', () => {
		it('should return the invitees correctly', () => {
			const result = FederationRoomSenderConverterEE.toBeforeAddUserToARoomDto(
				[inviteeId, { _id: 'inviterId', username: 'username' } as any, { _id: '_id', username: 'usernameToBeInvited' } as any],
				{ _id: 'roomId' } as any,
				'domain',
			);

			expect(result.internalRoomId).to.be.equal('roomId');
			expect(result.invitees).to.be.eql([
				{
					normalizedInviteeId: inviteeId.replace('@', ''),
					inviteeUsernameOnly: inviteeId.split(':')[0]?.replace('@', ''),
					rawInviteeId: `@${inviteeId.replace('@', '')}`,
				},
			]);
		});
	});

	describe('#toCreateDirectMessageDto()', () => {
		it('should return the invitees correctly', () => {
			const result = FederationRoomSenderConverterEE.toCreateDirectMessageDto('inviterId', [
				inviteeId,
				{ _id: 'inviterId', username: 'username' } as any,
				{ _id: '_id', username: 'usernameToBeInvited' } as any,
			]);

			expect(result.internalInviterId).to.be.equal('inviterId');
			expect(result.invitees).to.be.eql([
				inviteeId,
				{ _id: 'inviterId', username: 'username' },
				{ _id: '_id', username: 'usernameToBeInvited' },
			]);
		});
	});
});
