import type { ILDAPEntry } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import 'mocha';

import { getLdapDynamicValue } from './getLdapDynamicValue';

describe('getLdapDynamicValue', () => {
	const ldapUser: ILDAPEntry = {
		_raw: {},
		displayName: 'John Doe',
		email: 'john.doe@example.com',
		uid: 'johndoe',
		emptyField: '',
	};

	it('should return undefined if attributeSetting is undefined', () => {
		const result = getLdapDynamicValue(ldapUser, undefined);
		expect(result).to.be.undefined;
	});

	it('should return the correct value from a single valid attribute', () => {
		const result = getLdapDynamicValue(ldapUser, 'displayName');
		expect(result).to.equal('John Doe');
	});

	it('should return the correct value from a template attribute', () => {
		const result = getLdapDynamicValue(ldapUser, 'Hello, #{displayName}!');
		expect(result).to.equal('Hello, John Doe!');
	});

	it('should replace missing keys with an empty string in a template', () => {
		const result = getLdapDynamicValue(ldapUser, 'Hello, #{nonExistentField}!');
		expect(result).to.equal('Hello, !');
	});

	it('should return the first valid key from a CSV list of attributes', () => {
		const result = getLdapDynamicValue(ldapUser, 'nonExistentField,email,uid');
		expect(result).to.equal('john.doe@example.com');
	});

	it('should return undefined if none of the keys in CSV list exist', () => {
		const result = getLdapDynamicValue(ldapUser, 'nonExistentField,anotherNonExistentField');
		expect(result).to.be.undefined;
	});

	it('should handle attribute keys with surrounding whitespace correctly', () => {
		const result = getLdapDynamicValue(ldapUser, '  email   ');
		expect(result).to.equal('john.doe@example.com');
	});

	it('should correctly resolve multiple variables in a template', () => {
		const result = getLdapDynamicValue(ldapUser, 'User: #{displayName}, Email: #{email}, UID: #{uid}');
		expect(result).to.equal('User: John Doe, Email: john.doe@example.com, UID: johndoe');
	});

	it('should return undefined if the attribute has an empty value', () => {
		const result = getLdapDynamicValue(ldapUser, 'emptyField');
		expect(result).to.be.undefined;
	});

	it('should return an empty string if using only a template attribute that has an empty value', () => {
		const result = getLdapDynamicValue(ldapUser, '#{emptyField}');
		expect(result).to.be.equal('');
	});
});
