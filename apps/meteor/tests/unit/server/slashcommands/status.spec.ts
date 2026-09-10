import { MeteorError } from '@rocket.chat/core-services';
import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import sinon from 'sinon';

import { loadCommand } from './helpers';

describe('/status', () => {
	let findUser: sinon.SinonStub;
	let setStatus: sinon.SinonStub;
	let harness: ReturnType<typeof loadCommand>;
	beforeEach(() => {
		findUser = sinon.stub().resolves({ _id: 'actor', language: 'pt' });
		setStatus = sinon.stub().resolves();
		harness = loadCommand('status/status', {
			'@rocket.chat/models': { Users: { findOneById: findUser } },
			'../../meteor-methods/users/setUserStatus': { setUserStatusMethod: setStatus },
		});
	});
	[
		{ user: { _id: 'actor', language: 'pt' }, language: 'de', expected: 'pt' },
		{ user: { _id: 'actor' }, language: 'de', expected: 'de' },
		{ user: { _id: 'actor' }, language: undefined, expected: 'en' },
	].forEach(({ user, language, expected }) => {
		it(`updates status text and reports success in ${expected}`, async () => {
			findUser.resolves(user);
			harness.settings.get.withArgs('Language').returns(language);
			await harness.run('status', { params: 'On vacation' });
			sinon.assert.calledOnceWithExactly(setStatus, user, undefined, 'On vacation');
			harness.expectFeedback('StatusMessage_Changed_Successfully');
			expect(harness.translate.firstCall.args[1]).to.deep.equal({ lng: expected });
		});
	});
	it('allows clearing the status text', async () => {
		await harness.run('status');
		sinon.assert.calledOnceWithExactly(setStatus, { _id: 'actor', language: 'pt' }, undefined, '');
	});
	it('does nothing without an actor', async () => {
		await harness.run('status', { userId: '' });
		sinon.assert.notCalled(findUser);
		sinon.assert.notCalled(setStatus);
	});
	it('does nothing for an unknown actor', async () => {
		findUser.resolves(null);
		await harness.run('status');
		sinon.assert.calledOnce(findUser);
		sinon.assert.notCalled(setStatus);
		sinon.assert.notCalled(harness.broadcast);
	});
	it('reports disabled status editing and rethrows the permission error without success feedback', async () => {
		const error = new MeteorError('error-not-allowed');
		setStatus.rejects(error);
		await expect(harness.run('status')).to.be.rejectedWith(error);
		sinon.assert.calledOnce(setStatus);
		harness.expectFeedback('StatusMessage_Change_Disabled');
		sinon.assert.calledOnce(harness.broadcast);
	});
	it('rethrows unexpected errors without success feedback', async () => {
		const error = new Error('storage failed');
		setStatus.rejects(error);
		await expect(harness.run('status')).to.be.rejectedWith(error);
		sinon.assert.calledOnce(setStatus);
		sinon.assert.notCalled(harness.broadcast);
	});
});
