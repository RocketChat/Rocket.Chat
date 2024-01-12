import { isFederationSearchPublicRoomsProps } from '@rocket.chat/rest-typings';
import { assert } from 'chai';

describe('FederationPublicRoomProps (definition/rest/v1)', () => {
	describe('isFederationSearchPublicRoomsProps', () => {
		it('should be a function', () => {
			assert.isFunction(isFederationSearchPublicRoomsProps);
		});
		it('should return false when provided anything that is not a FederationPublicRoomProps', () => {
			assert.isFalse(isFederationSearchPublicRoomsProps(''));
			assert.isFalse(isFederationSearchPublicRoomsProps(123));
		});

		it('should accept a externalRoomId with nothing else', () => {
			assert.isTrue(
				isFederationSearchPublicRoomsProps({
					serverName: 'server',
					roomName: 'roomName',
					count: '1',
					pageToken: 'token',
				}),
			);
		});

		it('should return false when extra parameters are provided to FederationPublicRoomProps', () => {
			assert.isFalse(
				isFederationSearchPublicRoomsProps({
					serverName: 'server',
					roomName: 'roomName',
					count: '1',
					pageToken: 'token',
					extra: 'extra',
				}),
			);
		});
	});
});
