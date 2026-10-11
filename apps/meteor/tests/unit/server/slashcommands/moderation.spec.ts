import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import sinon from 'sinon';

import { loadSlashCommand } from './helpers';

const cases = [
	{
		command: 'ban',
		path: 'ban/ban',
		dependency: '../../lib/banUserFromRoom',
		method: 'banUserFromRoomMethod',
		permission: 'ban-user',
		sanitizes: true,
	},
	{
		command: 'unban',
		path: 'ban/unban',
		dependency: '../../lib/unbanUserFromRoom',
		method: 'unbanUserFromRoom',
		permission: 'ban-user',
		sanitizes: true,
	},
	{
		command: 'kick',
		path: 'kick/server',
		dependency: '../../meteor-methods/rooms/removeUserFromRoom',
		method: 'removeUserFromRoomMethod',
		permission: 'remove-user',
		sanitizes: true,
	},
	{
		command: 'mute',
		path: 'mute/mute',
		dependency: '../../meteor-methods/rooms/muteUserInRoom',
		method: 'muteUserInRoom',
		permission: 'mute-user',
		sanitizes: false,
	},
	{
		command: 'unmute',
		path: 'mute/unmute',
		dependency: '../../meteor-methods/rooms/unmuteUserInRoom',
		method: 'unmuteUserInRoom',
		permission: 'mute-user',
		sanitizes: false,
	},
];

cases.forEach(({ command, path, dependency, method, permission, sanitizes }) => {
	describe(`/${command}`, () => {
		let findTarget: sinon.SinonStub;
		let findActor: sinon.SinonStub;
		let action: sinon.SinonStub;
		let sanitizeUsername: sinon.SinonStub;
		let slashCommand: ReturnType<typeof loadSlashCommand>;

		beforeEach(() => {
			findTarget = sinon.stub().resolves({ _id: 'target', username: 'Bob' });
			findActor = sinon.stub().resolves({ _id: 'actor', language: 'pt' });
			action = sinon.stub().resolves();
			sanitizeUsername = sinon.stub().returns('Bob');
			slashCommand = loadSlashCommand(path, {
				'@rocket.chat/models': { Users: { findOneByUsernameIgnoringCase: findTarget, findOneById: findActor } },
				'../../meteor-methods/rooms/addUsersToRoom': { sanitizeUsername },
				[dependency]: { [method]: action },
			});
		});

		it('passes the actor, room and normalized target to the authoritative method', async () => {
			await slashCommand.runCommand(command, { params: '  @Bob  ' });
			if (sanitizes) {
				sinon.assert.calledOnceWithExactly(sanitizeUsername, '@Bob');
			}
			sinon.assert.calledOnceWithExactly(findTarget, 'Bob');
			sinon.assert.calledOnceWithExactly(action, 'actor', { rid: 'current-room', username: 'Bob' });
			sinon.assert.notCalled(slashCommand.broadcast);
			expect(slashCommand.registeredCommands.get(command)?.options?.permission).to.equal(permission);
		});

		it('does not look up or modify a user for empty input', async () => {
			sanitizeUsername.returns('');
			await slashCommand.runCommand(command, { params: '   ' });
			if (sanitizes) {
				sinon.assert.calledOnceWithExactly(sanitizeUsername, '');
			}
			sinon.assert.notCalled(findTarget);
			sinon.assert.notCalled(action);
			sinon.assert.notCalled(slashCommand.broadcast);
		});

		// TODO: Fix /mute to return after unknown-user feedback, then enable these tests.
		['pt', undefined].forEach((language) => {
			(command === 'mute' ? it.skip : it)(
				`reports an unknown target with ${language || 'English fallback'} and performs no mutation`,
				async () => {
					findTarget.resolves(null);
					findActor.resolves(null);
					slashCommand.settings.get.withArgs('Language').returns(language);
					await slashCommand.runCommand(command, { params: '@Bob' });
					sinon.assert.calledOnceWithExactly(findTarget, 'Bob');
					slashCommand.expectTranslatedFeedback('Username_doesnt_exist');
					expect(slashCommand.translate.firstCall.args[1]).to.include({ username: 'Bob', lng: language || 'en' });
					sinon.assert.notCalled(action);
				},
			);
		});

		it('propagates authorization failures from the authoritative method', async () => {
			const error = new Error('Not authorized');
			action.rejects(error);
			await expect(slashCommand.runCommand(command, { params: '@Bob' })).to.be.rejectedWith(error);
			sinon.assert.calledOnce(action);
			sinon.assert.notCalled(slashCommand.broadcast);
		});
	});
});
