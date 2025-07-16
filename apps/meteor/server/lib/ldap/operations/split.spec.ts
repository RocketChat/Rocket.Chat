import { expect } from 'chai';
import 'mocha';

import type { LDAPVariableSplit } from './split';
import { executeSplit } from './split';

describe('executeSplit function', () => {
	it('should throw an error if the pattern is empty', () => {
		const operation: LDAPVariableSplit = { operation: 'split', pattern: '' };
		expect(() => executeSplit('input', operation)).to.throw('Invalid SPLIT operation.');
	});

	it('should split the input string by the pattern and return the first element by default', () => {
		const operation: LDAPVariableSplit = { operation: 'split', pattern: ',' };
		const result = executeSplit('hello,world', operation);
		expect(result).to.be.equal('hello');
	});

	it('should split the input string by the pattern and return the element at the specified index', () => {
		const operation: LDAPVariableSplit = { operation: 'split', pattern: ',', indexToUse: 1 };
		const result = executeSplit('hello,world', operation);
		expect(result).to.be.equal('world');
	});

	it('should return undefined if the index is out of range', () => {
		const operation: LDAPVariableSplit = { operation: 'split', pattern: ',', indexToUse: 2 };
		const result = executeSplit('hello,world', operation);
		expect(result).to.be.undefined;
	});

	it('should return undefined if the input string does not contain the pattern', () => {
		const operation: LDAPVariableSplit = { operation: 'split', pattern: ',' };
		const result = executeSplit('helloworld', operation);
		expect(result).to.be.equal('helloworld');
	});

	it('should return the first element if the input string is empty', () => {
		const operation: LDAPVariableSplit = { operation: 'split', pattern: ',' };
		const result = executeSplit('', operation);
		expect(result).to.be.equal('');
	});

	it('should return undefined if the input string is undefined', () => {
		const operation: LDAPVariableSplit = { operation: 'split', pattern: ',' };
		const result = executeSplit(undefined as any, operation);
		expect(result).to.be.undefined;
	});
});
