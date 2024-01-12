import { isFederationJoinExternalPublicRoomProps } from '@rocket.chat/rest-typings';
import { assert } from 'chai';

describe('FederationJoinExternalPublicRoomProps (definition/rest/v1)', () => {
	describe('isFederationJoinExternalPublicRoomProps', () => {
		it('should be a function', () => {
			assert.isFunction(isFederationJoinExternalPublicRoomProps);
		});
		it('should return false when provided anything that is not a FederationJoinExternalPublicRoomProps', () => {
			assert.isFalse(isFederationJoinExternalPublicRoomProps(undefined));
			assert.isFalse(isFederationJoinExternalPublicRoomProps(null));
			assert.isFalse(isFederationJoinExternalPublicRoomProps(''));
			assert.isFalse(isFederationJoinExternalPublicRoomProps(123));
			assert.isFalse(isFederationJoinExternalPublicRoomProps({}));
			assert.isFalse(isFederationJoinExternalPublicRoomProps([]));
			assert.isFalse(isFederationJoinExternalPublicRoomProps(new Date()));
			assert.isFalse(isFederationJoinExternalPublicRoomProps(new Error()));
		});

		it('should return false if externalRoomId is not provided to FederationJoinExternalPublicRoomProps', () => {
			assert.isFalse(isFederationJoinExternalPublicRoomProps({}));
		});

		it('should return false if externalRoomId was provided in the wrong format FederationJoinExternalPublicRoomProps', () => {
			assert.isFalse(
				isFederationJoinExternalPublicRoomProps({
					externalRoomId: 'wrongFormatId',
				}),
			);
		});

		it('should accept a externalRoomId with nothing else', () => {
			assert.isTrue(
				isFederationJoinExternalPublicRoomProps({
					externalRoomId: '!externalRoomId:server.com',
				}),
			);
		});

		it('should return false when extra parameters are provided to FederationJoinExternalPublicRoomProps', () => {
			assert.isFalse(
				isFederationJoinExternalPublicRoomProps({
					externalRoomId: '!externalRoomId:server.com',
					extra: 'extra',
				}),
			);
		});
	});
});
