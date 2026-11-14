import { afterEach, before, beforeEach, describe, it } from 'node:test';

import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const DAY = 24 * 60 * 60 * 1000;

const getValueById = sinon.stub();
const toArray = sinon.stub();
const findWithLoginTokensOlderThan = sinon.stub().returns({ toArray });
const removeLoginTokensOlderThan = sinon.stub().resolves();
const broadcast = sinon.stub();

const { expireLoginTokens } = proxyquire.noCallThru().load('./expireLoginTokens.ts', {
	'@rocket.chat/core-services': { api: { broadcast } },
});

describe('expireLoginTokens', () => {
	let clock: sinon.SinonFakeTimers;

	before(() => {
		mockModel('Settings', { getValueById });
		mockModel('Users', { findWithLoginTokensOlderThan, removeLoginTokensOlderThan });
	});

	beforeEach(() => {
		clock = sinon.useFakeTimers(new Date('2026-11-06T12:00:00Z'));
		getValueById.reset();
		toArray.reset();
		findWithLoginTokensOlderThan.resetHistory();
		removeLoginTokensOlderThan.resetHistory();
		broadcast.reset();
	});

	afterEach(() => {
		clock.restore();
	});

	it('should find and remove tokens with the same cutoff, taken from Accounts_LoginExpiration', async () => {
		getValueById.resolves(30);
		toArray.resolves([]);

		await expireLoginTokens();

		const cutoff = new Date(Date.now() - 30 * DAY);
		sinon.assert.calledOnceWithExactly(getValueById, 'Accounts_LoginExpiration');
		sinon.assert.calledOnceWithMatch(findWithLoginTokensOlderThan, cutoff);
		sinon.assert.calledOnceWithExactly(removeLoginTokensOlderThan, cutoff);
		sinon.assert.notCalled(broadcast);
	});

	it('should broadcast the tokens each affected user keeps', async () => {
		getValueById.resolves(30);
		const kept = { hashedToken: 'kept', when: new Date(Date.now() - DAY) };
		const expired = { hashedToken: 'expired', when: new Date(Date.now() - 31 * DAY) };
		toArray.resolves([
			{ _id: 'u1', services: { resume: { loginTokens: [kept, expired] } } },
			{ _id: 'u2', services: { resume: { loginTokens: [expired] } } },
		]);

		await expireLoginTokens();

		expect(broadcast.callCount).to.equal(2);
		sinon.assert.calledWithExactly(broadcast, 'watch.users', {
			clientAction: 'updated',
			id: 'u1',
			diff: { 'services.resume.loginTokens': [kept] },
			unset: {},
		});
		sinon.assert.calledWithExactly(broadcast, 'watch.users', {
			clientAction: 'updated',
			id: 'u2',
			diff: { 'services.resume.loginTokens': [] },
			unset: {},
		});
	});
});
