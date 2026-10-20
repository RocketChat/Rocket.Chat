import assert from 'node:assert';
import { describe, it } from 'node:test';

import { isFederationRemoveServerProps } from './FederationRemoveServerProps';

describe('FederationRemoveServerProps (definition/rest/v1)', () => {
	describe('isFederationRemoveServerProps', () => {
		it('should be a function', () => {
			assert.equal(typeof isFederationRemoveServerProps, 'function');
		});
		it('should return false when provided anything that is not an FederationRemoveServerProps', () => {
			assert.equal(isFederationRemoveServerProps(undefined), false);
			assert.equal(isFederationRemoveServerProps(null), false);
			assert.equal(isFederationRemoveServerProps(''), false);
			assert.equal(isFederationRemoveServerProps(123), false);
			assert.equal(isFederationRemoveServerProps({}), false);
			assert.equal(isFederationRemoveServerProps([]), false);
			assert.equal(isFederationRemoveServerProps(new Date()), false);
			assert.equal(isFederationRemoveServerProps(new Error()), false);
		});

		it('should return false if serverName is not provided to FederationRemoveServerProps', () => {
			assert.equal(isFederationRemoveServerProps({}), false);
		});

		it('should accept a serverName with nothing else', () => {
			assert.equal(
				isFederationRemoveServerProps({
					serverName: 'serverName',
				}),
				true,
			);
		});

		it('should return false when extra parameters are provided to FederationRemoveServerProps', () => {
			assert.equal(
				isFederationRemoveServerProps({
					serverName: 'serverName',
					extra: 'extra',
				}),
				false,
			);
		});
	});
});
