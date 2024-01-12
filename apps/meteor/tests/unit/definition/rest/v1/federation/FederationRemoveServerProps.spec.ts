import { isFederationRemoveServerProps } from '@rocket.chat/rest-typings';
import { assert } from 'chai';

describe('FederationRemoveServerProps (definition/rest/v1)', () => {
	describe('isFederationRemoveServerProps', () => {
		it('should be a function', () => {
			assert.isFunction(isFederationRemoveServerProps);
		});
		it('should return false when provided anything that is not a FederationRemoveServerProps', () => {
			assert.isFalse(isFederationRemoveServerProps(undefined));
			assert.isFalse(isFederationRemoveServerProps(null));
			assert.isFalse(isFederationRemoveServerProps(''));
			assert.isFalse(isFederationRemoveServerProps(123));
			assert.isFalse(isFederationRemoveServerProps({}));
			assert.isFalse(isFederationRemoveServerProps([]));
			assert.isFalse(isFederationRemoveServerProps(new Date()));
			assert.isFalse(isFederationRemoveServerProps(new Error()));
		});

		it('should return false if serverName is not provided to FederationRemoveServerProps', () => {
			assert.isFalse(isFederationRemoveServerProps({}));
		});

		it('should accept a serverName with nothing else', () => {
			assert.isTrue(
				isFederationRemoveServerProps({
					serverName: 'serverName',
				}),
			);
		});

		it('should return false when extra parameters are provided to FederationRemoveServerProps', () => {
			assert.isFalse(
				isFederationRemoveServerProps({
					serverName: 'serverName',
					extra: 'extra',
				}),
			);
		});
	});
});
