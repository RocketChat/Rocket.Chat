import { isFederationAddServerProps } from '@rocket.chat/rest-typings';
import { assert } from 'chai';

describe('FederationAddServerProps (definition/rest/v1)', () => {
	describe('isFederationAddServerProps', () => {
		it('should be a function', () => {
			assert.isFunction(isFederationAddServerProps);
		});
		it('should return false when provided anything that is not an FederationAddServerProps', () => {
			assert.isFalse(isFederationAddServerProps(undefined));
			assert.isFalse(isFederationAddServerProps(null));
			assert.isFalse(isFederationAddServerProps(''));
			assert.isFalse(isFederationAddServerProps(123));
			assert.isFalse(isFederationAddServerProps({}));
			assert.isFalse(isFederationAddServerProps([]));
			assert.isFalse(isFederationAddServerProps(new Date()));
			assert.isFalse(isFederationAddServerProps(new Error()));
		});

		it('should return false if serverName is not provided to FederationAddServerProps', () => {
			assert.isFalse(isFederationAddServerProps({}));
		});

		it('should accept a serverName with nothing else', () => {
			assert.isTrue(
				isFederationAddServerProps({
					serverName: 'serverName',
				}),
			);
		});

		it('should return false when extra parameters are provided to FederationAddServerProps', () => {
			assert.isFalse(
				isFederationAddServerProps({
					serverName: 'serverName',
					extra: 'extra',
				}),
			);
		});
	});
});
