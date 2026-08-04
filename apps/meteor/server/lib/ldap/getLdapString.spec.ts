import type { ILDAPEntry } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import 'mocha';

import { getLdapString } from './getLdapString';

const ldapUser: ILDAPEntry = {
	_raw: {},
	username: 'john_doe',
	email: 'john.doe@example.com',
	phoneNumber: '123-456-7890',
	memberOf: 'group1,group2',
};

describe('getLdapString', () => {
	it('should return the correct value for a given key', () => {
		expect(getLdapString(ldapUser, 'username')).to.equal('john_doe');
		expect(getLdapString(ldapUser, 'email')).to.equal('john.doe@example.com');
		expect(getLdapString(ldapUser, 'phoneNumber')).to.equal('123-456-7890');
		expect(getLdapString(ldapUser, 'memberOf')).to.equal('group1,group2');
	});

	it('should trim the key and return the correct value', () => {
		expect(getLdapString(ldapUser, '  username  ')).to.equal('john_doe');
		expect(getLdapString(ldapUser, ' email ')).to.equal('john.doe@example.com');
	});

	it('should return undefined for non-existing keys', () => {
		expect(getLdapString(ldapUser, 'nonExistingKey')).to.be.undefined;
		expect(getLdapString(ldapUser, 'foo')).to.be.undefined;
	});

	it('should handle empty keys and return an empty string', () => {
		expect(getLdapString(ldapUser, '')).to.be.undefined;
		expect(getLdapString(ldapUser, '   ')).to.be.undefined;
	});

	it('should handle keys with only whitespace', () => {
		expect(getLdapString(ldapUser, ' ')).to.be.undefined;
		expect(getLdapString(ldapUser, '   ')).to.be.undefined;
	});

	it('should handle case-sensitive keys accurately', () => {
		expect(getLdapString(ldapUser, 'Username')).to.be.undefined;
		expect(getLdapString(ldapUser, 'EMAIL')).to.be.undefined;
	});
});
