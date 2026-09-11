import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import sinon from 'sinon';

import { loadSlashCommand } from './helpers';

describe('/topic', () => {
	let hasPermission: sinon.SinonStub;
	let saveRoomSettings: sinon.SinonStub;
	let slashCommand: ReturnType<typeof loadSlashCommand>;

	beforeEach(() => {
		hasPermission = sinon.stub().resolves(true);
		saveRoomSettings = sinon.stub().resolves();
		slashCommand = loadSlashCommand('topic/topic', {
			'../../lib/authorization/hasPermission': { hasPermissionAsync: hasPermission },
			'../../meteor-methods/rooms/saveRoomSettings': { saveRoomSettings },
		});
	});

	['New topic', ''].forEach((params) => {
		it(`saves ${params ? 'a new' : 'an empty'} topic with the actor and current room`, async () => {
			await slashCommand.runCommand('topic', { params });
			sinon.assert.calledOnceWithExactly(hasPermission, 'actor', 'edit-room', 'current-room');
			sinon.assert.calledOnceWithExactly(saveRoomSettings, 'actor', 'current-room', 'roomTopic', params);
		});
	});

	it('does not save when the actor lacks edit-room permission', async () => {
		hasPermission.resolves(false);
		await slashCommand.runCommand('topic', { params: 'Forbidden' });
		sinon.assert.calledOnceWithExactly(hasPermission, 'actor', 'edit-room', 'current-room');
		sinon.assert.notCalled(saveRoomSettings);
	});

	it('does not check permission or save without an actor', async () => {
		await slashCommand.runCommand('topic', { userId: '' });
		sinon.assert.notCalled(hasPermission);
		sinon.assert.notCalled(saveRoomSettings);
	});

	it('propagates persistence failures', async () => {
		const error = new Error('save failed');
		saveRoomSettings.rejects(error);
		await expect(slashCommand.runCommand('topic', { params: 'New topic' })).to.be.rejectedWith(error);
		sinon.assert.calledOnce(saveRoomSettings);
	});
});
