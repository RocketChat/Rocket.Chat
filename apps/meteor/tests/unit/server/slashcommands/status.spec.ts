import { MeteorError } from '@rocket.chat/core-services';
import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import sinon from 'sinon';

import { loadSlashCommand } from './helpers';

describe('/status', () => {
	let findUser: sinon.SinonStub;
	let setStatus: sinon.SinonStub;
	let slashCommand: ReturnType<typeof loadSlashCommand>;

	beforeEach(() => {
		findUser = sinon.stub().resolves({ _id: 'actor', language: 'pt' });
		setStatus = sinon.stub().resolves();
		slashCommand = loadSlashCommand('status/status', {
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
			slashCommand.settings.get.withArgs('Language').returns(language);
			await slashCommand.runCommand('status', { params: 'On vacation' });
			sinon.assert.calledOnceWithExactly(setStatus, user, undefined, 'On vacation');
			slashCommand.expectTranslatedFeedback('StatusMessage_Changed_Successfully');
			expect(slashCommand.translate.firstCall.args[1]).to.deep.equal({ lng: expected });
		});
	});

	it('allows clearing the status text', async () => {
		await slashCommand.runCommand('status');
		sinon.assert.calledOnceWithExactly(setStatus, { _id: 'actor', language: 'pt' }, undefined, '');
	});

	it('does nothing without an actor', async () => {
		await slashCommand.runCommand('status', { userId: '' });
		sinon.assert.notCalled(findUser);
		sinon.assert.notCalled(setStatus);
	});

	it('does nothing for an unknown actor', async () => {
		findUser.resolves(null);
		await slashCommand.runCommand('status');
		sinon.assert.calledOnce(findUser);
		sinon.assert.notCalled(setStatus);
		sinon.assert.notCalled(slashCommand.broadcast);
	});

	it('reports disabled status editing and rethrows the permission error without success feedback', async () => {
		const error = new MeteorError('error-not-allowed');
		setStatus.rejects(error);
		await expect(slashCommand.runCommand('status')).to.be.rejectedWith(error);
		sinon.assert.calledOnce(setStatus);
		slashCommand.expectTranslatedFeedback('StatusMessage_Change_Disabled');
		sinon.assert.calledOnce(slashCommand.broadcast);
	});

	it('rethrows unexpected errors without success feedback', async () => {
		const error = new Error('storage failed');
		setStatus.rejects(error);
		await expect(slashCommand.runCommand('status')).to.be.rejectedWith(error);
		sinon.assert.calledOnce(setStatus);
		sinon.assert.notCalled(slashCommand.broadcast);
	});
});
