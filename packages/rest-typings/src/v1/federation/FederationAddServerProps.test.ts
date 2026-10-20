import assert from 'node:assert';
import { describe, it } from 'node:test';

import { isFederationAddServerProps } from './FederationAddServerProps';

describe('FederationAddServerProps (definition/rest/v1)', () => {
	describe('isFederationAddServerProps', () => {
		it('should be a function', () => {
			assert.equal(typeof isFederationAddServerProps, 'function');
		});
		it('should return false when provided anything that is not an FederationAddServerProps', () => {
			assert.equal(isFederationAddServerProps(undefined), false);
			assert.equal(isFederationAddServerProps(null), false);
			assert.equal(isFederationAddServerProps(''), false);
			assert.equal(isFederationAddServerProps(123), false);
			assert.equal(isFederationAddServerProps({}), false);
			assert.equal(isFederationAddServerProps([]), false);
			assert.equal(isFederationAddServerProps(new Date()), false);
			assert.equal(isFederationAddServerProps(new Error()), false);
		});

		it('should return false if serverName is not provided to FederationAddServerProps', () => {
			assert.equal(isFederationAddServerProps({}), false);
		});

		it('should accept a serverName with nothing else', () => {
			assert.equal(
				isFederationAddServerProps({
					serverName: 'serverName',
				}),
				true,
			);
		});

		it('should return false when extra parameters are provided to FederationAddServerProps', () => {
			assert.equal(
				isFederationAddServerProps({
					serverName: 'serverName',
					extra: 'extra',
				}),
				false,
			);
		});
	});
});
