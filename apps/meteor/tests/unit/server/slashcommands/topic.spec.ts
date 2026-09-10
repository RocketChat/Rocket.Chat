import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import sinon from 'sinon';

import { loadCommand } from './helpers';

describe('/topic', () => {
	let permission: sinon.SinonStub;
	let save: sinon.SinonStub;
	let harness: ReturnType<typeof loadCommand>;
	beforeEach(() => {
		permission = sinon.stub().resolves(true);
		save = sinon.stub().resolves();
		harness = loadCommand('topic/topic', {
			'../../lib/authorization/hasPermission': { hasPermissionAsync: permission },
			'../../meteor-methods/rooms/saveRoomSettings': { saveRoomSettings: save },
		});
	});
	['New topic', ''].forEach((params) => {
		it(`saves ${params ? 'a new' : 'an empty'} topic with the actor and current room`, async () => {
			await harness.run('topic', { params });
			sinon.assert.calledOnceWithExactly(permission, 'actor', 'edit-room', 'current-room');
			sinon.assert.calledOnceWithExactly(save, 'actor', 'current-room', 'roomTopic', params);
		});
	});
	it('does not save when the actor lacks edit-room permission', async () => {
		permission.resolves(false);
		await harness.run('topic', { params: 'Forbidden' });
		sinon.assert.calledOnceWithExactly(permission, 'actor', 'edit-room', 'current-room');
		sinon.assert.notCalled(save);
	});
	it('does not check permission or save without an actor', async () => {
		await harness.run('topic', { userId: '' });
		sinon.assert.notCalled(permission);
		sinon.assert.notCalled(save);
	});
	it('propagates persistence failures', async () => {
		const error = new Error('save failed');
		save.rejects(error);
		await expect(harness.run('topic', { params: 'New topic' })).to.be.rejectedWith(error);
		sinon.assert.calledOnce(save);
	});
});
