import { describe, it } from 'node:test';

import { hashPassword } from '@rocket.chat/account-utils';
import { SHA256 } from '@rocket.chat/sha256';
import bcrypt from 'bcrypt';
import { expect } from 'chai';

import { compareUserPassword } from './compareUserPassword';

// Stored the way Meteor's accounts-password writes it: bcrypt over the hex SHA-256 digest
const userWithPassword = (password: string) => ({ services: { password: { bcrypt: bcrypt.hashSync(SHA256(password), 4) } } });

describe('compareUserPassword', () => {
	it('should accept the plaintext password of a hash written by Meteor', async () => {
		expect(await compareUserPassword(userWithPassword('s3cret'), { plain: 's3cret' })).to.be.true;
	});

	it('should accept the SHA-256 digest of the password in any case', async () => {
		const user = userWithPassword('s3cret');

		expect(await compareUserPassword(user, { sha256: SHA256('s3cret') })).to.be.true;
		expect(await compareUserPassword(user, { sha256: SHA256('s3cret').toUpperCase() })).to.be.true;
	});

	it('should accept a plaintext password with characters outside the BMP', async () => {
		expect(await compareUserPassword(userWithPassword('pass😀'), { plain: 'pass😀' })).to.be.true;
	});

	it('should accept the client digest of a password hashed by hashPassword', async () => {
		const user = { services: { password: { bcrypt: await hashPassword('pass😀') } } };

		expect(await compareUserPassword(user, { sha256: SHA256('pass😀') })).to.be.true;
	});

	it('should reject a wrong password', async () => {
		const user = userWithPassword('s3cret');

		expect(await compareUserPassword(user, { plain: 'wrong' })).to.be.false;
		expect(await compareUserPassword(user, { sha256: SHA256('wrong') })).to.be.false;
	});

	it('should reject when the user has no password or none is given', async () => {
		expect(await compareUserPassword({ services: {} }, { plain: 's3cret' })).to.be.false;
		expect(await compareUserPassword({ services: { password: { bcrypt: ' ' } } }, { plain: 's3cret' })).to.be.false;
		expect(await compareUserPassword(userWithPassword('s3cret'), {})).to.be.false;
	});
});
