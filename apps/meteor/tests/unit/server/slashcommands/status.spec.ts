import { MeteorError } from '@rocket.chat/core-services';
import { UserStatus } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import sinon from 'sinon';

import { loadSlashCommand } from './helpers';

describe('/status and presence slash commands', () => {
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

	describe('/status', () => {
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

		it('supports setting status to online via /status online', async () => {
			await slashCommand.runCommand('status', { params: 'online' });
			sinon.assert.calledOnceWithExactly(setStatus, { _id: 'actor', language: 'pt' }, UserStatus.ONLINE, '');
		});

		it('supports setting status to online with message via /status online Available', async () => {
			await slashCommand.runCommand('status', { params: 'online Available' });
			sinon.assert.calledOnceWithExactly(setStatus, { _id: 'actor', language: 'pt' }, UserStatus.ONLINE, 'Available');
		});

		it('supports setting status to away with message via /status away In a meeting', async () => {
			await slashCommand.runCommand('status', { params: 'away In a meeting' });
			sinon.assert.calledOnceWithExactly(setStatus, { _id: 'actor', language: 'pt' }, UserStatus.AWAY, 'In a meeting');
		});

		it('supports setting status to busy via /status busy', async () => {
			await slashCommand.runCommand('status', { params: 'busy' });
			sinon.assert.calledOnceWithExactly(setStatus, { _id: 'actor', language: 'pt' }, UserStatus.BUSY, '');
		});

		it('supports setting status to busy via /status dnd Focus time', async () => {
			await slashCommand.runCommand('status', { params: 'dnd Focus time' });
			sinon.assert.calledOnceWithExactly(setStatus, { _id: 'actor', language: 'pt' }, UserStatus.BUSY, 'Focus time');
		});

		it('supports setting status to offline via /status offline', async () => {
			await slashCommand.runCommand('status', { params: 'offline' });
			sinon.assert.calledOnceWithExactly(setStatus, { _id: 'actor', language: 'pt' }, UserStatus.OFFLINE, '');
		});

		it('supports setting status to offline via /status invisible', async () => {
			await slashCommand.runCommand('status', { params: 'invisible' });
			sinon.assert.calledOnceWithExactly(setStatus, { _id: 'actor', language: 'pt' }, UserStatus.OFFLINE, '');
		});
	});

	describe('/away', () => {
		it('sets status to away', async () => {
			await slashCommand.runCommand('away');
			sinon.assert.calledOnceWithExactly(setStatus, { _id: 'actor', language: 'pt' }, UserStatus.AWAY, '');
			slashCommand.expectTranslatedFeedback('StatusMessage_Changed_Successfully');
		});

		it('sets status to away with custom text', async () => {
			await slashCommand.runCommand('away', { params: 'be right back' });
			sinon.assert.calledOnceWithExactly(setStatus, { _id: 'actor', language: 'pt' }, UserStatus.AWAY, 'be right back');
		});
	});

	describe('/busy and /dnd', () => {
		it('sets status to busy via /busy', async () => {
			await slashCommand.runCommand('busy', { params: 'working' });
			sinon.assert.calledOnceWithExactly(setStatus, { _id: 'actor', language: 'pt' }, UserStatus.BUSY, 'working');
		});

		it('sets status to busy via /dnd', async () => {
			await slashCommand.runCommand('dnd', { params: 'do not disturb' });
			sinon.assert.calledOnceWithExactly(setStatus, { _id: 'actor', language: 'pt' }, UserStatus.BUSY, 'do not disturb');
		});
	});

	describe('/online', () => {
		it('sets status to online', async () => {
			await slashCommand.runCommand('online');
			sinon.assert.calledOnceWithExactly(setStatus, { _id: 'actor', language: 'pt' }, UserStatus.ONLINE, '');
		});

		it('sets status to online with custom text', async () => {
			await slashCommand.runCommand('online', { params: 'ready' });
			sinon.assert.calledOnceWithExactly(setStatus, { _id: 'actor', language: 'pt' }, UserStatus.ONLINE, 'ready');
		});
	});

	describe('/offline', () => {
		it('sets status to offline', async () => {
			await slashCommand.runCommand('offline');
			sinon.assert.calledOnceWithExactly(setStatus, { _id: 'actor', language: 'pt' }, UserStatus.OFFLINE, '');
		});

		it('reports error when invisible status is disabled', async () => {
			const error = new MeteorError('error-status-not-allowed');
			setStatus.rejects(error);
			await expect(slashCommand.runCommand('offline')).to.be.rejectedWith(error);
			sinon.assert.calledOnce(setStatus);
			slashCommand.expectTranslatedFeedback('error-status-not-allowed');
		});
	});
});
