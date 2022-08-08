import { expect } from 'chai';
import type { IMessage } from '@rocket.chat/core-typings';

import { FederationRoomSenderConverter } from '../../../../../../../../../app/federation-v2/server/infrastructure/rocket-chat/converters/RoomSender';
import {
	FederationAfterLeaveRoomDto,
	FederationAfterRemoveUserFromRoomDto,
	FederationCreateDMAndInviteUserDto,
	FederationRoomSendExternalMessageDto,
} from '../../../../../../../../../app/federation-v2/server/application/input/RoomSenderDto';

describe('Federation - Infrastructure - RocketChat - FederationRoomSenderConverter', () => {
	describe('#toCreateDirectMessageRoomDto()', () => {
		it('should return an instance of FederationCreateDMAndInviteUserDto', () => {
			expect(
				FederationRoomSenderConverter.toCreateDirectMessageRoomDto('internalInviterId', 'internalRoomId', 'externalInviteeId'),
			).to.be.instanceOf(FederationCreateDMAndInviteUserDto);
		});

		it('should return the normalizedInviteeId property without any @ if any', () => {
			expect(
				FederationRoomSenderConverter.toCreateDirectMessageRoomDto(
					'internalInviterId',
					'internalRoomId',
					'@externalInviteeId:server-name.com',
				).normalizedInviteeId,
			).to.be.equal('externalInviteeId:server-name.com');
		});

		it('should return the inviteeUsernameOnly property without any @ if any and only the first part before ":"', () => {
			expect(
				FederationRoomSenderConverter.toCreateDirectMessageRoomDto(
					'internalInviterId',
					'internalRoomId',
					'@externalInviteeId:server-name.com',
				).inviteeUsernameOnly,
			).to.be.equal('externalInviteeId');
		});

		it('should return the normalizedInviteeId AND inviteeUsernameOnly equals to the rawInviteeId if it does not have any special chars', () => {
			const result = FederationRoomSenderConverter.toCreateDirectMessageRoomDto('internalInviterId', 'internalRoomId', 'externalInviteeId');
			expect(result.rawInviteeId).to.be.equal('externalInviteeId');
			expect(result.normalizedInviteeId).to.be.equal('externalInviteeId');
			expect(result.inviteeUsernameOnly).to.be.equal('externalInviteeId');
		});

		it('should have all the properties set', () => {
			const internalInviterId = 'internalInviterId';
			const internalRoomId = 'internalRoomId';
			const externalInviteeId = 'externalInviteeId';
			const result: any = FederationRoomSenderConverter.toCreateDirectMessageRoomDto(internalInviterId, internalRoomId, externalInviteeId);
			expect(result).to.be.eql({
				internalInviterId,
				internalRoomId,
				rawInviteeId: externalInviteeId,
				normalizedInviteeId: externalInviteeId,
				inviteeUsernameOnly: externalInviteeId,
			});
		});
	});

	describe('#toSendExternalMessageDto()', () => {
		it('should return an instance of FederationRoomSendExternalMessageDto', () => {
			expect(
				FederationRoomSenderConverter.toSendExternalMessageDto('internalSenderId', 'internalRoomId', { msg: 'text' } as IMessage),
			).to.be.instanceOf(FederationRoomSendExternalMessageDto);
		});

		it('should have all the properties set', () => {
			const internalSenderId = 'internalSenderId';
			const internalRoomId = 'internalRoomId';
			const msg = { msg: 'text' } as IMessage;
			const result: any = FederationRoomSenderConverter.toSendExternalMessageDto(internalSenderId, internalRoomId, msg);
			expect(result).to.be.eql({
				internalSenderId,
				internalRoomId,
				message: msg,
			});
		});
	});

	describe('#toAfterUserLeaveRoom()', () => {
		it('should return an instance of FederationAfterLeaveRoomDto', () => {
			expect(FederationRoomSenderConverter.toAfterUserLeaveRoom('internalUserId', 'internalRoomId')).to.be.instanceOf(
				FederationAfterLeaveRoomDto,
			);
		});

		it('should have all the properties set', () => {
			const internalUserId = 'internalUserId';
			const internalRoomId = 'internalRoomId';
			const result: any = FederationRoomSenderConverter.toAfterUserLeaveRoom('internalUserId', 'internalRoomId');
			expect(result).to.be.eql({
				internalUserId,
				internalRoomId,
			});
		});
	});

	describe('#toOnUserRemovedFromRoom()', () => {
		it('should return an instance of FederationAfterRemoveUserFromRoomDto', () => {
			expect(
				FederationRoomSenderConverter.toOnUserRemovedFromRoom('internalUserId', 'internalRoomId', 'actionDoneByInternalId'),
			).to.be.instanceOf(FederationAfterRemoveUserFromRoomDto);
		});

		it('should have all the properties set', () => {
			const internalUserId = 'internalUserId';
			const internalRoomId = 'internalRoomId';
			const actionDoneByInternalId = 'actionDoneByInternalId';
			const result: any = FederationRoomSenderConverter.toOnUserRemovedFromRoom(
				'internalUserId',
				'internalRoomId',
				'actionDoneByInternalId',
			);
			expect(result).to.be.eql({
				internalUserId,
				internalRoomId,
				actionDoneByInternalId,
			});
		});
	});
});
