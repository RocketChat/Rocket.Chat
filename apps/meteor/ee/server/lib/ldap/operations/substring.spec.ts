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

	it('should get the whole string when the start is zero', () => {
		const result = executeSubstring('hello world', { operation: 'substring', start: 0 });
		expect(result).to.be.equal('hello world');
	});

	it('should get the substring of the input, using the start and end param', () => {
		const result = executeSubstring('hello world', { operation: 'substring', start: 6, end: 8 });
		expect(result).to.be.equal('wo');
	});

	it('should work backwards if end is smaller than start', () => {
		const result = executeSubstring('hello world', { operation: 'substring', start: 5, end: 0 });
		expect(result).to.be.equal('hello');
	});

	it('should get an empty string if start and end are the same', () => {
		expect(executeSubstring('hello world', { operation: 'substring', start: 0, end: 0 })).to.be.equal('');
		expect(executeSubstring('hello world', { operation: 'substring', start: 5, end: 5 })).to.be.equal('');
	});

	it('should treat negative values as zero', () => {
		expect(executeSubstring('hello world', { operation: 'substring', start: -4, end: 5 })).to.be.equal('hello');
		expect(executeSubstring('hello world', { operation: 'substring', start: 5, end: -4 })).to.be.equal('hello');
		expect(executeSubstring('hello world', { operation: 'substring', start: -5, end: -4 })).to.be.equal('');
	});
});
