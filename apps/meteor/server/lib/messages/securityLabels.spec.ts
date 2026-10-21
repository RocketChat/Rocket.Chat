import type { IMessage } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { describe, it } from 'mocha';

import { filterSearchResultsForUser, redactMessagesForUser } from './securityLabels';

const label = { policyId: '2.999.1', classification: 4, categories: [] };
const plain: Partial<IMessage> = { _id: 'plain', msg: 'stand-up at 09:00' };
const cleared: Partial<IMessage> = { _id: 'cleared', msg: 'fuel report', securityLabel: { ...label, classification: 3 } };
const secret: Partial<IMessage> = { _id: 'secret', msg: 'convoy at 0300', securityLabel: label };

describe('filterSearchResultsForUser', () => {
	it('leaves labeled messages out when nobody is cleared', async () => {
		expect((await filterSearchResultsForUser([plain, secret], 'bob')).map(({ _id }) => _id)).to.deep.equal(['plain']);
	});

	it('keeps what the reader may read and drops what would be withheld', async () => {
		const unpatch = redactMessagesForUser.patch(async (_next, messages) =>
			messages.map((message) => (message._id === 'secret' ? { _id: message._id, msg: '', securityWithheld: true as const } : message)),
		);
		try {
			const results = await filterSearchResultsForUser([plain, cleared, secret], 'bob');
			expect(results.map(({ _id }) => _id)).to.deep.equal(['plain', 'cleared']);
			expect(JSON.stringify(results)).not.to.contain('convoy');
		} finally {
			unpatch();
		}
	});
});
