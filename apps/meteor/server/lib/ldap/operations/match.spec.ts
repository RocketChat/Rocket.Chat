import { expect } from 'chai';
import 'mocha';

import type { LDAPVariableMatch } from './match';
import { executeMatch } from './match';

describe('executeMatch function', () => {
	describe('Validation', () => {
		it('throws an error when pattern is missing', () => {
			const operation: LDAPVariableMatch = {
				operation: 'match',
				pattern: '',
				regex: true,
			};
			expect(() => executeMatch('input', operation)).to.throw('Invalid MATCH operation.');
		});

		it('throws an error when neither valueIfTrue nor indexToUse is provided', () => {
			const operation: LDAPVariableMatch = {
				operation: 'match',
				pattern: 'pattern',
			};
			expect(() => executeMatch('input', operation)).to.throw('Invalid MATCH operation.');
		});
	});

	describe('Non-Regex Matching', () => {
		it('returns valueIfTrue when input matches pattern', () => {
			const operation: LDAPVariableMatch = {
				operation: 'match',
				pattern: 'hello',
				valueIfTrue: 'matched',
				valueIfFalse: 'not matched',
			};
			expect(executeMatch('hello', operation)).to.be.equal('matched');
		});

		it('returns valueIfFalse when input does not match pattern', () => {
			const operation: LDAPVariableMatch = {
				operation: 'match',
				pattern: 'hello',
				valueIfTrue: 'matched',
				valueIfFalse: 'not matched',
			};
			expect(executeMatch('world', operation)).to.be.equal('not matched');
		});
	});

	describe('Regex Matching', () => {
		it('returns valueIfTrue when input matches regex pattern', () => {
			const operation: LDAPVariableMatch = {
				operation: 'match',
				pattern: '^hello$',
				regex: true,
				valueIfTrue: 'matched',
				valueIfFalse: 'not matched',
			};
			expect(executeMatch('hello', operation)).to.be.equal('matched');
		});

		it('returns valueIfFalse when input does not match regex pattern', () => {
			const operation: LDAPVariableMatch = {
				operation: 'match',
				pattern: '^hello$',
				regex: true,
				valueIfTrue: 'matched',
				valueIfFalse: 'not matched',
			};
			expect(executeMatch('world', operation)).to.be.equal('not matched');
		});

		it('uses flags when provided', () => {
			const operation: LDAPVariableMatch = {
				operation: 'match',
				pattern: '^HELLO$',
				regex: true,
				flags: 'i',
				valueIfTrue: 'matched',
				valueIfFalse: 'not matched',
			};
			expect(executeMatch('hello', operation)).to.be.equal('matched');
		});
	});

	describe('IndexToUse', () => {
		it('returns the matched group at indexToUse', () => {
			const operation: LDAPVariableMatch = {
				operation: 'match',
				pattern: '(hello) (world)',
				regex: true,
				indexToUse: 1,
			};
			expect(executeMatch('hello world', operation)).to.be.equal('hello');
		});

		it('returns undefined when indexToUse is out of range', () => {
			const operation: LDAPVariableMatch = {
				operation: 'match',
				pattern: '(hello)',
				regex: true,
				indexToUse: 2,
			};
			expect(executeMatch('hello', operation)).to.be.undefined;
		});
	});
});
