import crypto from 'node:crypto';
import { describe, it } from 'node:test';

import bcrypt from 'bcrypt';
import { expect } from 'chai';

import { compareUserPassword } from './compareUserPassword';

const sha256 = (value: string) => crypto.createHash('sha256').update(value).digest('hex');

// Stored the way Meteor's accounts-password writes it: bcrypt over the hex SHA-256 digest
const userWithPassword = (password: string) => ({ services: { password: { bcrypt: bcrypt.hashSync(sha256(password), 4) } } });

describe('compareUserPassword', () => {
	it('should accept the plaintext password of a hash written by Meteor', async () => {
		expect(await compareUserPassword(userWithPassword('s3cret'), { plain: 's3cret' })).to.be.true;
	});

	it('should accept the SHA-256 digest of the password in any case', async () => {
		const user = userWithPassword('s3cret');

		expect(await compareUserPassword(user, { sha256: sha256('s3cret') })).to.be.true;
		expect(await compareUserPassword(user, { sha256: sha256('s3cret').toUpperCase() })).to.be.true;
	});

	it('should reject a wrong password', async () => {
		const user = userWithPassword('s3cret');

		expect(await compareUserPassword(user, { plain: 'wrong' })).to.be.false;
		expect(await compareUserPassword(user, { sha256: sha256('wrong') })).to.be.false;
	});

	it('should reject when the user has no password or none is given', async () => {
		expect(await compareUserPassword({ services: {} }, { plain: 's3cret' })).to.be.false;
		expect(await compareUserPassword({ services: { password: { bcrypt: ' ' } } }, { plain: 's3cret' })).to.be.false;
		expect(await compareUserPassword(userWithPassword('s3cret'), {})).to.be.false;
	});
});
