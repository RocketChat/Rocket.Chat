import { assert } from 'chai';
import { isFederationJoinPublicRoomProps } from '@rocket.chat/rest-typings';

describe('FederationJoinPublicRoomProps (definition/rest/v1)', () => {
	describe('isFederationJoinPublicRoomProps', () => {
		it('should be a function', () => {
			assert.isFunction(isFederationJoinPublicRoomProps);
		});
		it('should return false when provided anything that is not an FederationJoinPublicRoomProps', () => {
			assert.isFalse(isFederationJoinPublicRoomProps(undefined));
			assert.isFalse(isFederationJoinPublicRoomProps(null));
			assert.isFalse(isFederationJoinPublicRoomProps(''));
			assert.isFalse(isFederationJoinPublicRoomProps(123));
			assert.isFalse(isFederationJoinPublicRoomProps({}));
			assert.isFalse(isFederationJoinPublicRoomProps([]));
			assert.isFalse(isFederationJoinPublicRoomProps(new Date()));
			assert.isFalse(isFederationJoinPublicRoomProps(new Error()));
		});

		it('should return false if externalRoomId is not provided to FederationJoinPublicRoomProps', () => {
			assert.isFalse(isFederationJoinPublicRoomProps({}));
		});

		it('should return false if externalRoomId was provided in the wrong format FederationJoinPublicRoomProps', () => {
			assert.isFalse(
				isFederationJoinPublicRoomProps({
					externalRoomId: 'wrongFormatId',
				}),
			);
		});

		it('should accept a externalRoomId with nothing else', () => {
			assert.isTrue(
				isFederationJoinPublicRoomProps({
					externalRoomId: '!externalRoomId:server.com',
				}),
			);
		});

		it('should return false when extra parameters are provided to FederationJoinPublicRoomProps', () => {
			assert.isFalse(
				isFederationJoinPublicRoomProps({
					externalRoomId: '!externalRoomId:server.com',
					extra: 'extra',
				}),
			);
		});
	});
});
