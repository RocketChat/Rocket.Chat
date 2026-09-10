import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import sinon from 'sinon';

import { loadCommand } from './helpers';

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
		let harness: ReturnType<typeof loadCommand>;

		beforeEach(() => {
			findTarget = sinon.stub().resolves({ _id: 'target', username: 'Bob' });
			findActor = sinon.stub().resolves({ _id: 'actor', language: 'pt' });
			action = sinon.stub().resolves();
			sanitizeUsername = sinon.stub().returns('Bob');
			harness = loadCommand(path, {
				'@rocket.chat/models': { Users: { findOneByUsernameIgnoringCase: findTarget, findOneById: findActor } },
				'../../meteor-methods/rooms/addUsersToRoom': { sanitizeUsername },
				[dependency]: { [method]: action },
			});
		});

		it('passes the actor, room and normalized target to the authoritative method', async () => {
			await harness.run(command, { params: '  @Bob  ' });
			if (sanitizes) sinon.assert.calledOnceWithExactly(sanitizeUsername, '@Bob');
			sinon.assert.calledOnceWithExactly(findTarget, 'Bob');
			sinon.assert.calledOnceWithExactly(action, 'actor', { rid: 'current-room', username: 'Bob' });
			sinon.assert.notCalled(harness.broadcast);
			expect(harness.commands.get(command)?.options?.permission).to.equal(permission);
		});

		it('does not look up or modify a user for empty input', async () => {
			sanitizeUsername.returns('');
			await harness.run(command, { params: '   ' });
			if (sanitizes) sinon.assert.calledOnceWithExactly(sanitizeUsername, '');
			sinon.assert.notCalled(findTarget);
			sinon.assert.notCalled(action);
			sinon.assert.notCalled(harness.broadcast);
		});

		if (command !== 'mute') {
			['pt', undefined].forEach((language) => {
				it(`reports an unknown target with ${language || 'English fallback'} and performs no mutation`, async () => {
					findTarget.resolves(null);
					findActor.resolves(null);
					harness.settings.get.withArgs('Language').returns(language);
					await harness.run(command, { params: '@Bob' });
					sinon.assert.calledOnceWithExactly(findTarget, 'Bob');
					harness.expectFeedback('Username_doesnt_exist');
					expect(harness.translate.firstCall.args[1]).to.include({ username: 'Bob', lng: language || 'en' });
					sinon.assert.notCalled(action);
				});
			});
		}

		it('propagates authorization failures from the authoritative method', async () => {
			const error = new Error('Not authorized');
			action.rejects(error);
			await expect(harness.run(command, { params: '@Bob' })).to.be.rejectedWith(error);
			sinon.assert.calledOnce(action);
			sinon.assert.notCalled(harness.broadcast);
		});
	});
});
