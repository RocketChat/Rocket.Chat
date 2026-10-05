import { MeteorError } from '@rocket.chat/core-services';
import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import sinon from 'sinon';

import { loadSlashCommand } from './helpers';

describe('/leave and /part', () => {
	const user = { _id: 'actor', username: 'alice', language: 'pt' };
	let findUser: sinon.SinonStub;
	let leave: sinon.SinonStub;
	let slashCommand: ReturnType<typeof loadSlashCommand>;

	beforeEach(() => {
		findUser = sinon.stub().resolves(user);
		leave = sinon.stub().resolves();
		slashCommand = loadSlashCommand('leave/leave', {
			'@rocket.chat/models': { Users: { findOneById: findUser } },
			'../../meteor-methods/rooms/leaveRoom': { leaveRoomMethod: leave },
		});
	});

	['leave', 'part'].forEach((command) => {
		it(`/${command} leaves the current room as the authenticated user`, async () => {
			await slashCommand.runCommand(command);
			sinon.assert.calledOnceWithExactly(findUser, 'actor');
			sinon.assert.calledOnceWithExactly(leave, user, 'current-room');
			sinon.assert.notCalled(slashCommand.broadcast);
			expect(slashCommand.registeredCommands.get(command)?.options?.permission).to.deep.equal(['leave-c', 'leave-p']);
		});
	});

	it('does nothing for an unknown actor', async () => {
		findUser.resolves(null);
		await slashCommand.runCommand('leave');
		sinon.assert.calledOnce(findUser);
		sinon.assert.notCalled(leave);
	});

	it('propagates an unexpected leave failure without attempting translated feedback', async () => {
		const error = new Error('storage failure');
		leave.rejects(error);
		await expect(slashCommand.runCommand('leave')).to.be.rejectedWith(error);
		sinon.assert.calledOnce(leave);
		sinon.assert.notCalled(slashCommand.broadcast);
	});

	[
		{ user, language: 'de', expected: 'pt' },
		{ user: { _id: 'actor' }, language: 'de', expected: 'de' },
		{ user: null, language: undefined, expected: 'en' },
	].forEach(({ user: feedbackUser, language, expected }) => {
		it(`preserves a domain error and notifies the actor using ${expected}`, async () => {
			findUser.onSecondCall().resolves(feedbackUser);
			slashCommand.settings.get.withArgs('Language').returns(language);
			slashCommand.translate.returns('localized leave error');
			leave.rejects(new MeteorError('error-not-allowed', 'Cannot leave room'));
			await expect(slashCommand.runCommand('leave'))
				.to.be.rejectedWith(MeteorError, 'Cannot leave room')
				.and.eventually.have.property('error', 'error-not-allowed');
			sinon.assert.calledOnce(leave);
			sinon.assert.calledOnceWithExactly(slashCommand.broadcast, 'notify.ephemeralMessage', 'actor', 'current-room', {
				msg: 'localized leave error',
			});

			sinon.assert.calledOnce(slashCommand.translate);
			expect(slashCommand.translate.firstCall.args[1]).to.deep.equal({ lng: expected });
		});
	});
});
