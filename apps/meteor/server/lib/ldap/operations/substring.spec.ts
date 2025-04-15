import { expect } from 'chai';
import 'mocha';

import type { LDAPVariableSubString } from './substring';
import { executeSubstring } from './substring';

describe('executeSubstring function', () => {
	it('should throw an error if the start is missing', () => {
		const operation: LDAPVariableSubString = { operation: 'substring' } as unknown as LDAPVariableSubString;
		expect(() => executeSubstring('input', operation)).to.throw('Invalid SUBSTRING operation.');
	});

	it('should throw an error if the start is invalid', () => {
		const operation: LDAPVariableSubString = { operation: 'substring', start: 0, end: null } as unknown as LDAPVariableSubString;
		expect(() => executeSubstring('input', operation)).to.throw('Invalid SUBSTRING operation.');
	});

	it('should get the substring of the input, using the start param', () => {
		const result = executeSubstring('hello world', { operation: 'substring', start: 6 });
		expect(result).to.be.equal('world');
	});

	it('should get the substring of the input, using the start and end param', () => {
		const result = executeSubstring('hello world', { operation: 'substring', start: 6, end: 8 });
		expect(result).to.be.equal('wo');
	});
});
