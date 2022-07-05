import { expect } from 'chai';

import { FederationRoomInviteUserDto } from '../../../../../../app/federation-v2/server/application/input/RoomSenderDto';
import { FederationRoomSenderConverterEE } from '../../../../../../app/federation-v2/server/infrastructure/rocket-chat/converters/RoomSender';

describe('Federation - Infrastructure - RocketChat - FederationRoomSenderConverterEE', () => {
	describe('#toRoomInviteUserDto()', () => {
		it('should return an instance of FederationRoomInviteUserDto', () => {
			expect(
				FederationRoomSenderConverterEE.toRoomInviteUserDto('internalInviterId', 'internalRoomId', 'externalInviteeId'),
			).to.be.instanceOf(FederationRoomInviteUserDto);
		});

		it('should return the normalizedInviteeId property without any @ if any', () => {
			expect(
				FederationRoomSenderConverterEE.toRoomInviteUserDto('internalInviterId', 'internalRoomId', '@externalInviteeId:server-name.com')
					.normalizedInviteeId,
			).to.be.equal('externalInviteeId:server-name.com');
		});

		it('should return the inviteeUsernameOnly property without any @ if any and only the first part before ":"', () => {
			expect(
				FederationRoomSenderConverterEE.toRoomInviteUserDto('internalInviterId', 'internalRoomId', '@externalInviteeId:server-name.com')
					.inviteeUsernameOnly,
			).to.be.equal('externalInviteeId');
		});

		it('should return the normalizedInviteeId AND inviteeUsernameOnly equals to the rawInviteeId if it does not have any special chars', () => {
			const result = FederationRoomSenderConverterEE.toRoomInviteUserDto('internalInviterId', 'internalRoomId', 'externalInviteeId');
			expect(result.rawInviteeId).to.be.equal('externalInviteeId');
			expect(result.normalizedInviteeId).to.be.equal('externalInviteeId');
			expect(result.inviteeUsernameOnly).to.be.equal('externalInviteeId');
		});

		it('should have all the properties set', () => {
			const internalInviterId = 'internalInviterId';
			const internalRoomId = 'internalRoomId';
			const externalInviteeId = 'externalInviteeId';
			const result: any = FederationRoomSenderConverterEE.toRoomInviteUserDto(internalInviterId, internalRoomId, externalInviteeId);
			expect(result).to.be.eql({
				internalInviterId,
				internalRoomId,
				rawInviteeId: externalInviteeId,
				normalizedInviteeId: externalInviteeId,
				inviteeUsernameOnly: externalInviteeId,
			});
		});
	});
});
