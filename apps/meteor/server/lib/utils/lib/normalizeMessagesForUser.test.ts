import { before, beforeEach, describe, it, mock } from 'node:test';

import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import sinon from 'sinon';

const settingsGet = sinon.stub();
const findUsersByUsernames = sinon.stub();

let normalizeMessagesForUser: any;

before(async () => {
	const moduleMocks = [mock.module('../../../settings', { exports: { settings: { get: settingsGet } } })];
	({ normalizeMessagesForUser } = await import('./normalizeMessagesForUser'));
	moduleMocks.forEach((moduleMock) => moduleMock.restore());
});

describe('normalizeMessagesForUser', () => {
	before(() => {
		mockModel('Users', { findUsersByUsernames });
	});

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

	for (const useRealName of [true, false]) {
		it(`should return only the public identity of the message author (real names: ${useRealName})`, async () => {
			settingsGet.withArgs('UI_Use_Real_Name').returns(useRealName);

			const [message] = await normalizeMessagesForUser(
				[{ u: { _id: 'u', username: 'alice', name: 'Alice', statusText: 'busy' } }],
				'viewer',
			);

			expect(message.u).to.deep.equal({ _id: 'u', username: 'alice', name: useRealName ? 'Alice Real' : 'Alice' });
		});
	}

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
