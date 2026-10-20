import assert from 'node:assert';
import { describe, it } from 'node:test';

import { isFederationJoinExternalPublicRoomProps } from './FederationJoinExternalPublicRoomProps';

describe('FederationJoinExternalPublicRoomProps (definition/rest/v1)', () => {
	describe('isFederationJoinExternalPublicRoomProps', () => {
		it('should be a function', () => {
			assert.equal(typeof isFederationJoinExternalPublicRoomProps, 'function');
		});
		it('should return false when provided anything that is not an FederationJoinExternalPublicRoomProps', () => {
			assert.equal(isFederationJoinExternalPublicRoomProps(undefined), false);
			assert.equal(isFederationJoinExternalPublicRoomProps(null), false);
			assert.equal(isFederationJoinExternalPublicRoomProps(''), false);
			assert.equal(isFederationJoinExternalPublicRoomProps(123), false);
			assert.equal(isFederationJoinExternalPublicRoomProps({}), false);
			assert.equal(isFederationJoinExternalPublicRoomProps([]), false);
			assert.equal(isFederationJoinExternalPublicRoomProps(new Date()), false);
			assert.equal(isFederationJoinExternalPublicRoomProps(new Error()), false);
		});

		it('should return false if externalRoomId is not provided to FederationJoinExternalPublicRoomProps', () => {
			assert.equal(isFederationJoinExternalPublicRoomProps({}), false);
		});

		it('should return false if externalRoomId was provided in the wrong format FederationJoinExternalPublicRoomProps', () => {
			assert.equal(
				isFederationJoinExternalPublicRoomProps({
					externalRoomId: 'wrongFormatId',
				}),
				false,
			);
		});

		it('should accept a externalRoomId with nothing else', () => {
			assert.equal(
				isFederationJoinExternalPublicRoomProps({
					externalRoomId: '!externalRoomId:server.com',
				}),
				true,
			);
		});

		it('should return false when extra parameters are provided to FederationJoinExternalPublicRoomProps', () => {
			assert.equal(
				isFederationJoinExternalPublicRoomProps({
					externalRoomId: '!externalRoomId:server.com',
					extra: 'extra',
				}),
				false,
			);
		});
	});
});
