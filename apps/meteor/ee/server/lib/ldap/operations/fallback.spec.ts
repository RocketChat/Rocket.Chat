import type { ILDAPEntry } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import 'mocha';

import type { LDAPVariableFallback } from './fallback';
import { executeFallback } from './fallback';

describe('executeFallback function', () => {
	const mockUser: ILDAPEntry = {
		_raw: {},
		defaultFallback: 'defaultFallbackValue',
	};

	it('should return the input value when it is valid and no minLength is provided', () => {
		const input = 'validInput';
		const operation: LDAPVariableFallback = { operation: 'fallback', fallback: 'defaultFallback' };
		const result = executeFallback(mockUser, input, operation);
		expect(result).to.equal(input);
	});

	it('should return the input value when it is valid and meets minLength requirement', () => {
		const input = 'validInput';
		const operation: LDAPVariableFallback = { operation: 'fallback', fallback: 'defaultFallback', minLength: 5 };
		const result = executeFallback(mockUser, input, operation);
		expect(result).to.equal(input);
	});

	it('should return fallback when input is invalid', () => {
		const input = '';
		const operation: LDAPVariableFallback = { operation: 'fallback', fallback: 'defaultFallback' };
		const result = executeFallback(mockUser, input, operation);
		expect(result).to.equal('defaultFallbackValue');
	});

	it('should return fallback when input is too short', () => {
		const input = 'short';
		const operation: LDAPVariableFallback = { operation: 'fallback', fallback: 'defaultFallback', minLength: 10 };
		const result = executeFallback(mockUser, input, operation);
		expect(result).to.equal('defaultFallbackValue');
	});

	it('should return fallback when input is undefined', () => {
		const operation: LDAPVariableFallback = { operation: 'fallback', fallback: 'defaultFallback' };
		const result = executeFallback(mockUser, undefined as any, operation);
		expect(result).to.equal('defaultFallbackValue');
	});

	it('should return fallback when input is an empty string and minLength is zero', () => {
		const input = '';
		const operation: LDAPVariableFallback = { operation: 'fallback', fallback: 'defaultFallback', minLength: 0 };
		const result = executeFallback(mockUser, input, operation);
		expect(result).to.equal('defaultFallbackValue');
	});

	it('should return fallback when input is an empty string and minLength is undefined', () => {
		const input = '';
		const operation: LDAPVariableFallback = { operation: 'fallback', fallback: 'defaultFallback', minLength: undefined };
		const result = executeFallback(mockUser, input, operation);
		expect(result).to.equal('defaultFallbackValue');
	});
});
