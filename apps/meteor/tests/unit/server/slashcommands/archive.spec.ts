import { isRegisterUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import sinon from 'sinon';

import { loadCommand } from './helpers';
import { RoomMemberActions } from '../../../../definition/IRoomTypeConfig';

(['archive', 'unarchive'] as const).forEach((command) => {
	describe(`/${command}`, () => {
		const actor = { _id: 'actor', username: 'alice', name: 'Alice' };
		let room: { _id: string; name?: string; t: string; archived: boolean };
		let findRoom: sinon.SinonStub;
		let findCurrentRoom: sinon.SinonStub;
		let findUser: sinon.SinonStub;
		let allowMemberAction: sinon.SinonStub;
		let hasPermission: sinon.SinonStub;
		let changeRoom: sinon.SinonStub;
		let harness: ReturnType<typeof loadCommand>;

		beforeEach(() => {
			room = { _id: 'target-room', name: 'general', t: 'c', archived: command === 'unarchive' };
			findRoom = sinon.stub().resolves(room);
			findCurrentRoom = sinon.stub().resolves(room);
			findUser = sinon.stub().resolves(actor);
			allowMemberAction = sinon.stub().resolves(true);
			hasPermission = sinon.stub().resolves(true);
			changeRoom = sinon.stub().resolves();
			harness = loadCommand(`${command === 'archive' ? 'archiveroom' : 'unarchiveroom'}/server`, {
				'@rocket.chat/core-typings': { isRegisterUser },
				'@rocket.chat/models': { Rooms: { findOneById: findCurrentRoom, findOneByName: findRoom }, Users: { findOneById: findUser } },
				'../../lib/rooms/roomCoordinator': { roomCoordinator: { getRoomDirectives: () => ({ allowMemberAction }) } },
				'../../lib/authorization/hasPermission': { hasPermissionAsync: hasPermission },
				[`../../lib/rooms/${command}Room`]: { [`${command}Room`]: changeRoom },
			});
		});

		it('changes the named room after checking its member action and scoped permission', async () => {
			await harness.run(command, { params: '  #general  ' });
			sinon.assert.calledOnceWithExactly(findRoom, 'general');
			sinon.assert.calledOnceWithExactly(allowMemberAction, room, RoomMemberActions.ARCHIVE, 'actor');
			sinon.assert.calledOnceWithExactly(hasPermission, 'actor', `${command}-room`, 'target-room');
			sinon.assert.calledOnceWithExactly(changeRoom, 'target-room', actor);
			harness.expectFeedback(command === 'archive' ? 'Channel_Archived' : 'Channel_Unarchived');
		});

		it('uses the current room when no channel is provided', async () => {
			await harness.run(command, { params: '  ' });
			sinon.assert.calledOnceWithExactly(findCurrentRoom, 'current-room');
			sinon.assert.notCalled(findRoom);
			sinon.assert.calledOnceWithExactly(changeRoom, 'target-room', actor);
			expect(harness.translate.firstCall.args[1]).to.include({ channelName: 'general' });
		});

		it('does not change rooms without an authenticated user', async () => {
			const result = harness.run(command, { userId: '' });
			if (command === 'unarchive') await expect(result).to.be.rejectedWith('Invalid user');
			else await result;
			sinon.assert.calledOnce(findCurrentRoom);
			sinon.assert.notCalled(findUser);
			sinon.assert.notCalled(changeRoom);
		});

		[null, { _id: 'actor', name: 'Alice' }, { _id: 'actor', username: 'alice' }].forEach((user) => {
			it(`rejects an invalid actor ${JSON.stringify(user)}`, async () => {
				findUser.resolves(user);
				await expect(harness.run(command)).to.be.rejectedWith('Invalid user');
				sinon.assert.calledOnce(findUser);
				sinon.assert.notCalled(hasPermission);
				sinon.assert.notCalled(changeRoom);
			});
		});

		it('reports a missing named room without changing it', async () => {
			findRoom.resolves(null);
			harness.settings.get.withArgs('Language').returns('pt');
			await harness.run(command, { params: '#missing' });
			harness.expectFeedback('Channel_doesnt_exist');
			expect(harness.translate.firstCall.args[1]).to.include({ channelName: 'missing', lng: 'pt' });
			sinon.assert.notCalled(changeRoom);
		});

		it('handles a missing current room', async () => {
			findCurrentRoom.resolves(null);
			await harness.run(command);
			harness.expectFeedback('Channel_doesnt_exist');
			sinon.assert.notCalled(changeRoom);
		});

		it('rejects a room type that disallows the member action', async () => {
			allowMemberAction.resolves(false);
			await expect(harness.run(command)).to.be.rejectedWith(`can not be ${command}d`);
			sinon.assert.calledOnce(allowMemberAction);
			sinon.assert.notCalled(hasPermission);
			sinon.assert.notCalled(changeRoom);
			sinon.assert.notCalled(harness.broadcast);
		});

		it('rejects a denied room permission without changing the room or announcing success', async () => {
			hasPermission.resolves(false);
			await expect(harness.run(command)).to.be.rejectedWith('Not authorized');
			sinon.assert.calledOnceWithExactly(hasPermission, 'actor', `${command}-room`, 'target-room');
			sinon.assert.notCalled(changeRoom);
			sinon.assert.notCalled(harness.broadcast);
		});

		it('reports an already completed operation without repeating the mutation', async () => {
			room.archived = command === 'archive';
			await harness.run(command);
			harness.expectFeedback(command === 'archive' ? 'Duplicate_archived_channel_name' : 'Channel_already_Unarchived');
			sinon.assert.calledOnce(hasPermission);
			sinon.assert.notCalled(changeRoom);
		});

		it('propagates a failed room mutation without announcing success', async () => {
			const error = new Error('storage failed');
			changeRoom.rejects(error);
			await expect(harness.run(command)).to.be.rejectedWith(error);
			sinon.assert.calledOnce(changeRoom);
			sinon.assert.notCalled(harness.broadcast);
		});
	});
});
