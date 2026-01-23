import type { ILDAPEntry } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { describe, it } from 'mocha';

import { ldapKeyExists } from './ldapKeyExists';

describe('ldapKeyExists', () => {
	it('should return true when key exists and is not empty', () => {
		const ldapUser: ILDAPEntry = {
			_raw: {},
			cn: 'John Doe',
			mail: 'john.doe@example.com',
		};

		expect(ldapKeyExists(ldapUser, 'cn')).to.be.true;
		expect(ldapKeyExists(ldapUser, 'mail')).to.be.true;
	});

	it('should return false when key exists but is empty', () => {
		const ldapUser: ILDAPEntry = {
			_raw: {},
			cn: '',
			mail: '',
		};

		expect(ldapKeyExists(ldapUser, 'cn')).to.be.false;
		expect(ldapKeyExists(ldapUser, 'mail')).to.be.false;
	});

	it('should return false when key does not exist', () => {
		const ldapUser: ILDAPEntry = {
			_raw: {},
			cn: 'John Doe',
		};
		expect(ldapKeyExists(ldapUser, 'mail')).to.be.false;
	});

	it('should trim the key before checking', () => {
		const ldapUser: ILDAPEntry = {
			_raw: {},
			cn: 'John Doe',
		};
		expect(ldapKeyExists(ldapUser, ' cn ')).to.be.true;
		expect(ldapKeyExists(ldapUser, ' mail ')).to.be.false;
	});

	it('should return false for empty keys', () => {
		const ldapUser: ILDAPEntry = {
			_raw: {},
			cn: 'John Doe',
		};
		expect(ldapKeyExists(ldapUser, '')).to.be.false;
		expect(ldapKeyExists(ldapUser, ' ')).to.be.false;
	});

	it('should handle keys with different casing', () => {
		const ldapUser: ILDAPEntry = {
			_raw: {},
			CN: 'John Doe',
		};

		expect(ldapKeyExists(ldapUser, 'CN')).to.be.true;
		expect(ldapKeyExists(ldapUser, 'cn')).to.be.false;
	});

	// #TODO: We only work with strings so this doesn't matter, but why are numbers and booleans being considered "empty"?
	it('should treat primitive non-string values as empty', () => {
		const ldapUser: ILDAPEntry = {
			_raw: {},
			numberValue: 123,
			booleanValue: true,
			anotherBooleanValue: false,
		};

		expect(ldapKeyExists(ldapUser, 'numberValue')).to.be.false;
		expect(ldapKeyExists(ldapUser, 'booleanValue')).to.be.false;
		expect(ldapKeyExists(ldapUser, 'anotherBooleanValue')).to.be.false;
	});

	it('should treat non-string values as empty', () => {
		const ldapUser: ILDAPEntry = {
			_raw: {},
			nullValue: null,
			undefinedValue: undefined,
			objectValue: {},
			arrayValue: [],
		};

		expect(ldapKeyExists(ldapUser, 'nullValue')).to.be.false;
		expect(ldapKeyExists(ldapUser, 'undefinedValue')).to.be.false;
		expect(ldapKeyExists(ldapUser, 'objectValue')).to.be.false;
		expect(ldapKeyExists(ldapUser, 'arrayValue')).to.be.false;
	});
});
