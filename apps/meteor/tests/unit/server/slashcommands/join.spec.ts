import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import sinon from 'sinon';

import { loadSlashCommand } from './helpers';

describe('/join', () => {
	const room = { _id: 'target-room', name: 'general', t: 'c' };
	const user = { _id: 'actor', username: 'alice' };
	let findRoom: sinon.SinonStub;
	let findSubscription: sinon.SinonStub;
	let findUser: sinon.SinonStub;
	let join: sinon.SinonStub;
	let slashCommand: ReturnType<typeof loadSlashCommand>;

	beforeEach(() => {
		findRoom = sinon.stub().resolves(room);
		findSubscription = sinon.stub().resolves(null);
		findUser = sinon.stub().resolves(user);
		join = sinon.stub().resolves();
		slashCommand = loadSlashCommand('join/server', {
			'@rocket.chat/core-services': { Room: { join } },
			'@rocket.chat/models': {
				Rooms: { findOneByNameAndType: findRoom },
				Subscriptions: { findOneByRoomIdAndUserId: findSubscription },
				Users: { findOneById: findUser },
			},
		});
	});

	it('joins the named public room with the authenticated user', async () => {
		await slashCommand.runCommand('join', { params: ' #general ' });
		sinon.assert.calledOnceWithExactly(findRoom, 'general', 'c');
		sinon.assert.calledOnceWithExactly(findSubscription, 'target-room', 'actor', { projection: { _id: 1 } });
		sinon.assert.calledOnceWithExactly(join, { room, user });
	});

	[{ params: ' ' }, { params: '#general', userId: '' }].forEach((overrides) => {
		it(`does not look up or join a room with ${JSON.stringify(overrides)}`, async () => {
			await slashCommand.runCommand('join', overrides);
			sinon.assert.notCalled(findRoom);
			sinon.assert.notCalled(join);
		});
	});

	it('reports an unknown public channel', async () => {
		findRoom.resolves(null);
		await slashCommand.runCommand('join', { params: '#missing' });
		sinon.assert.calledOnceWithExactly(slashCommand.broadcast, 'notify.ephemeralMessage', 'actor', 'current-room', {
			msg: 'translated:Channel_doesnt_exist',
		});

		expect(slashCommand.translate.firstCall.args[1]).to.include({ channelName: 'missing', lng: 'en' });
		sinon.assert.notCalled(findSubscription);
		sinon.assert.notCalled(join);
	});

	it('rejects existing membership without joining again', async () => {
		findSubscription.resolves({ _id: 'subscription' });
		await expect(slashCommand.runCommand('join', { params: '#general' })).to.be.rejectedWith('You are already in the channel');
		sinon.assert.calledOnce(findSubscription);
		sinon.assert.notCalled(join);
	});

	it('rejects an unknown actor', async () => {
		findUser.resolves(null);
		await expect(slashCommand.runCommand('join', { params: '#general' })).to.be.rejectedWith('Invalid user');
		sinon.assert.calledOnceWithExactly(findUser, 'actor');
		sinon.assert.notCalled(join);
	});

	it('propagates a join service failure', async () => {
		const error = new Error('join failed');
		join.rejects(error);
		await expect(slashCommand.runCommand('join', { params: '#general' })).to.be.rejectedWith(error);
		sinon.assert.calledOnce(join);
	});
});
