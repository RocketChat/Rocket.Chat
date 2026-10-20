import assert from 'node:assert';
import { describe, it } from 'node:test';

import { isFederationSearchPublicRoomsProps } from './FederationPublicRoomsProps';

describe('FederationPublicRoomProps (definition/rest/v1)', () => {
	describe('isFederationSearchPublicRoomsProps', () => {
		it('should be a function', () => {
			assert.equal(typeof isFederationSearchPublicRoomsProps, 'function');
		});
		it('should return false when provided anything that is not an FederationPublicRoomProps', () => {
			assert.equal(isFederationSearchPublicRoomsProps(''), false);
			assert.equal(isFederationSearchPublicRoomsProps(123), false);
		});

		it('should accept a externalRoomId with nothing else', () => {
			assert.equal(
				isFederationSearchPublicRoomsProps({
					serverName: 'server',
					roomName: 'roomName',
					count: '1',
					pageToken: 'token',
				}),
				true,
			);
		});

		it('should return false when extra parameters are provided to FederationPublicRoomProps', () => {
			assert.equal(
				isFederationSearchPublicRoomsProps({
					serverName: 'server',
					roomName: 'roomName',
					count: '1',
					pageToken: 'token',
					extra: 'extra',
				}),
				false,
			);
		});
	});
});
