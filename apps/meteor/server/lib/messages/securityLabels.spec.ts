import type { IMessage } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { describe, it } from 'mocha';

import { listUsersNotClearedFor, prepareMessagesForReader } from './securityLabels';

const label = { policyId: '2.999.1', classification: 4, categories: [] };
const plain: Partial<IMessage> = { _id: 'plain', msg: 'stand-up at 09:00' };
const secret: Partial<IMessage> = { _id: 'secret', msg: 'convoy at 0300', securityLabel: label };

describe('prepareMessagesForReader', () => {
	it('leaves labeled messages out entirely when nobody is cleared', async () => {
		const prepared = await prepareMessagesForReader([plain, secret], 'bob');
		expect(prepared.map(({ _id }) => _id)).to.deep.equal(['plain']);
		expect(JSON.stringify(prepared)).not.to.contain('secret');
	});
});

describe('listUsersNotClearedFor', () => {
	it('treats everyone as uncleared for a labeled message when nobody is cleared', async () => {
		expect(await listUsersNotClearedFor(secret, ['alice', 'bob'])).to.deep.equal(['alice', 'bob']);
	});

	it('clears everyone for an unlabeled message', async () => {
		expect(await listUsersNotClearedFor(plain, ['alice', 'bob'])).to.deep.equal([]);
	});
});
