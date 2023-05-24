import { expect } from 'chai';

import {
	FederationJoinExternalPublicRoomInputDto,
	isAValidExternalRoomIdFormat,
} from '../../../../../../../../../server/local-services/federation/application/room/sender/input/RoomInputDto';

describe('FederationEE - Application - InputDto - RoomInputDto', () => {
	describe('#isAValidExternalRoomIdFormat()', () => {
		it('should return false if the provided value is not in a valid matrix external format for room ids', () => {
			expect(isAValidExternalRoomIdFormat('invalidFormat')).to.be.false;
		});

		it('should return true if the provided value is a valid matrix external format for room ids', () => {
			expect(isAValidExternalRoomIdFormat('!invalidFormat:server.com')).to.be.true;
		});
	});

	describe('FederationJoinPublicRoomInputDto', () => {
		it('should throw an error if the provided value is not in a valid matrix external format for room ids', () => {
			expect(
				() =>
					new FederationJoinExternalPublicRoomInputDto({
						externalRoomId: 'invalidFormat',
						externalRoomHomeServerName: 'server.com',
						internalUserId: 'internalUserId',
						normalizedRoomId: 'normalizedRoomId',
					}),
			).to.throw(Error, 'Invalid external room id format');
		});

		it('should NOT throw any error and should return the proper dto', () => {
			expect(
				new FederationJoinExternalPublicRoomInputDto({
					externalRoomId: '!roomId:server.com',
					externalRoomHomeServerName: 'server.com',
					internalUserId: 'internalUserId',
					normalizedRoomId: 'normalizedRoomId',
					roomName: 'roomName',
					pageToken: 'pageToken',
				}),
			).to.be.eql({
				externalRoomId: '!roomId:server.com',
				externalRoomHomeServerName: 'server.com',
				internalUserId: 'internalUserId',
				normalizedRoomId: 'normalizedRoomId',
				roomName: 'roomName',
				pageToken: 'pageToken',
			});
		});
	});
});
