import { assert } from 'chai';
import { isFederationJoinInternalPublicRoomProps } from '@rocket.chat/rest-typings';

describe('FederationJoinInternalPublicRoomProps (definition/rest/v1)', () => {
	describe('isFederationJoinInternalPublicRoomProps', () => {
		it('should be a function', () => {
			assert.isFunction(isFederationJoinInternalPublicRoomProps);
		});
		it('should return false when provided anything that is not an FederationJoinInternalPublicRoomProps', () => {
			assert.isFalse(isFederationJoinInternalPublicRoomProps(undefined));
			assert.isFalse(isFederationJoinInternalPublicRoomProps(null));
			assert.isFalse(isFederationJoinInternalPublicRoomProps(''));
			assert.isFalse(isFederationJoinInternalPublicRoomProps(123));
			assert.isFalse(isFederationJoinInternalPublicRoomProps({}));
			assert.isFalse(isFederationJoinInternalPublicRoomProps([]));
			assert.isFalse(isFederationJoinInternalPublicRoomProps(new Date()));
			assert.isFalse(isFederationJoinInternalPublicRoomProps(new Error()));
		});

		it('should return false if internalRoomId is not provided to FederationJoinInternalPublicRoomProps', () => {
			assert.isFalse(isFederationJoinInternalPublicRoomProps({}));
		});

		it('should accept a internalRoomId with nothing else', () => {
			assert.isTrue(
				isFederationJoinInternalPublicRoomProps({
					internalRoomId: 'd543f65g6h8m',
				}),
			);
		});

		it('should return false when extra parameters are provided to FederationJoinInternalPublicRoomProps', () => {
			assert.isFalse(
				isFederationJoinInternalPublicRoomProps({
					internalRoomId: 'd543f65g6h8m',
					extra: 'extra',
				}),
			);
		});
	});
});
