import { expect } from 'chai';
import 'mocha';

import type { LDAPVariableReplace } from './replace';
import { executeReplace } from './replace';

describe('executeReplace', () => {
	describe('Validation', () => {
		it('throws an error when pattern is missing', () => {
			const operation: LDAPVariableReplace = {
				operation: 'replace',
				pattern: '',
				replacement: 'new-value',
			};
			expect(() => executeReplace('input', operation)).to.throw('Invalid REPLACE operation.');
		});

		it('throws an error when replacement is not a string', () => {
			const operation: LDAPVariableReplace = {
				operation: 'replace',
				pattern: 'old-value',
				replacement: 123 as any,
			};
			expect(() => executeReplace('input', operation)).to.throw('Invalid REPLACE operation.');
		});
	});

	describe('String Replacement', () => {
		it('replaces the first occurrence of the pattern', () => {
			const operation: LDAPVariableReplace = {
				operation: 'replace',
				pattern: 'old',
				replacement: 'new',
			};
			expect(executeReplace('old-value old-value', operation)).to.be.equal('new-value old-value');
		});

		it('replaces all occurrences of the pattern when `all` is true', () => {
			const operation: LDAPVariableReplace = {
				operation: 'replace',
				pattern: 'old',
				replacement: 'new',
				all: true,
			};
			expect(executeReplace('old-value old-value', operation)).to.be.equal('new-value new-value');
		});
	});

	describe('Regex Replacement', () => {
		it('replaces the first occurrence of the pattern', () => {
			const operation: LDAPVariableReplace = {
				operation: 'replace',
				pattern: 'old',
				replacement: 'new',
				regex: true,
			};
			expect(executeReplace('old-value old-value', operation)).to.be.equal('new-value old-value');
		});

		it('replaces all occurrences of the pattern when `regex` and `all` are true', () => {
			const operation: LDAPVariableReplace = {
				operation: 'replace',
				pattern: 'old',
				replacement: 'new',
				regex: true,
				all: true,
			};
			expect(executeReplace('old-value old-value', operation)).to.be.equal('new-value new-value');
		});

		it('uses the provided flags', () => {
			const operation: LDAPVariableReplace = {
				operation: 'replace',
				pattern: 'OLD',
				replacement: 'new',
				regex: true,
				flags: 'i',
			};
			expect(executeReplace('OLD-value old-value', operation)).to.be.equal('new-value old-value');
		});

		it('adds the `g` flag when `all` is true', () => {
			const operation: LDAPVariableReplace = {
				operation: 'replace',
				pattern: 'old',
				replacement: 'new',
				regex: true,
				all: true,
			};
			expect(executeReplace('old-value old-value', operation)).to.be.equal('new-value new-value');
		});

		it('does not duplicate the `g` flag when already present', () => {
			const operation: LDAPVariableReplace = {
				operation: 'replace',
				pattern: 'old',
				replacement: 'new',
				regex: true,
				all: true,
				flags: 'g',
			};
			expect(executeReplace('old-value old-value', operation)).to.be.equal('new-value new-value');
		});
	});
});
