import { beforeEach, describe, it } from 'node:test';

import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const settingsGet = sinon.stub();
const findUsersByUsernames = sinon.stub();

const { normalizeMessagesForUser } = proxyquire.noCallThru().load('./normalizeMessagesForUser', {
	'@rocket.chat/models': { Users: { findUsersByUsernames } },
	'../../../settings': { settings: { get: settingsGet } },
});

describe('normalizeMessagesForUser', () => {
	beforeEach(() => {
		settingsGet.reset();
		settingsGet.withArgs('UI_Use_Real_Name').returns(true);
		findUsersByUsernames.reset();
		findUsersByUsernames.returns({ toArray: async () => [{ username: 'alice', name: 'Alice Real' }] });
	});

	it('should show the real name of the reacting users', async () => {
		const [message] = await normalizeMessagesForUser(
			[{ u: { _id: 'u', username: 'alice' }, reactions: { ':smile:': { usernames: ['alice'] } } }],
			'viewer',
		);

		expect(message.reactions[':smile:'].names).to.deep.equal(['Alice Real']);
	});

	it('should not fail on a reaction that has no list of usernames', async () => {
		const [message] = await normalizeMessagesForUser(
			[
				{
					u: { _id: 'u', username: 'alice' },
					reactions: { ':smile:': {}, ':cry:': { usernames: 'alice' }, ':wink:': { usernames: ['alice'] } },
				},
			],
			'viewer',
		);

		expect(message.reactions[':wink:'].names).to.deep.equal(['Alice Real']);
		expect(message.reactions[':smile:']).to.deep.equal({ usernames: [], names: [] });
		expect(message.reactions[':cry:']).to.deep.equal({ usernames: [], names: [] });
	});
});
