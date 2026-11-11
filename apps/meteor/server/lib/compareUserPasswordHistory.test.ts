import { describe, it } from 'node:test';

import { SHA256 } from '@rocket.chat/sha256';
import bcrypt from 'bcrypt';
import { expect } from 'chai';
import proxyquire from 'proxyquire';

const settingsValues: Record<string, unknown> = {
	Accounts_Password_History_Enabled: true,
	Accounts_Password_History_Amount: 2,
};

const { compareUserPasswordHistory } = proxyquire.noCallThru().load('./compareUserPasswordHistory.ts', {
	'../settings': { settings: { get: (id: string) => settingsValues[id] } },
});

const hash = (password: string) => bcrypt.hashSync(SHA256(password), 4);

const user = {
	services: {
		password: { bcrypt: hash('current') },
		passwordHistory: [hash('oldest'), hash('older'), hash('old')],
	},
};

describe('compareUserPasswordHistory', () => {
	it('should reject a password among the most recent ones', async () => {
		expect(await compareUserPasswordHistory(user, { plain: 'old' })).to.be.false;
		expect(await compareUserPasswordHistory(user, { plain: 'older' })).to.be.false;
	});

	it('should accept a password older than the history amount', async () => {
		expect(await compareUserPasswordHistory(user, { plain: 'oldest' })).to.be.true;
	});

	it('should accept a password never used', async () => {
		expect(await compareUserPasswordHistory(user, { plain: 'new' })).to.be.true;
	});
});
