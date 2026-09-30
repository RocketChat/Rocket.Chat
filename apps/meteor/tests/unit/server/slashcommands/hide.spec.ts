import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import sinon from 'sinon';

import { loadSlashCommand } from './helpers';

describe('/hide', () => {
	const actor = { _id: 'actor', username: 'alice', language: 'pt' };
	let findUser: sinon.SinonStub;
	let findRoomByName: sinon.SinonStub;
	let findDirect: sinon.SinonStub;
	let subscription: sinon.SinonStub;
	let hide: sinon.SinonStub;
	let slashCommand: ReturnType<typeof loadSlashCommand>;

	beforeEach(() => {
		findUser = sinon.stub().resolves(actor);
		findRoomByName = sinon.stub().resolves({ _id: 'channel' });
		findDirect = sinon.stub().resolves({ _id: 'direct' });
		subscription = sinon.stub().resolves({ _id: 'subscription' });
		hide = sinon.stub().resolves();
		slashCommand = loadSlashCommand('hide/hide', {
			'@rocket.chat/models': {
				Users: { findOneById: findUser },
				Rooms: { findOneByName: findRoomByName, findOne: findDirect },
				Subscriptions: { findOneByRoomIdAndUserId: subscription },
			},
			'../../meteor-methods/rooms/hideRoom': { hideRoomMethod: hide },
		});
	});

	it('hides the current room without a room lookup when no parameter is provided', async () => {
		await slashCommand.runCommand('hide', { params: '  ' });
		sinon.assert.calledOnceWithExactly(hide, 'actor', 'current-room');
		sinon.assert.notCalled(findRoomByName);
		sinon.assert.notCalled(findDirect);
	});

	it('hides a named channel after verifying membership', async () => {
		await slashCommand.runCommand('hide', { params: ' #general ignored ' });
		sinon.assert.calledOnceWithExactly(findRoomByName, 'general');
		sinon.assert.calledOnceWithExactly(subscription, 'channel', 'actor', { projection: { _id: 1 } });
		sinon.assert.calledOnceWithExactly(hide, 'actor', 'channel');
	});

	it('hides a direct conversation with the named user', async () => {
		await slashCommand.runCommand('hide', { params: '@bob' });
		sinon.assert.calledOnceWithExactly(findDirect, { t: 'd', usernames: { $all: ['alice', 'bob'] } });
		sinon.assert.calledOnceWithExactly(subscription, 'direct', 'actor', { projection: { _id: 1 } });
		sinon.assert.calledOnceWithExactly(hide, 'actor', 'direct');
		sinon.assert.notCalled(findRoomByName);
	});

	it('does nothing without an authenticated actor', async () => {
		await slashCommand.runCommand('hide', { userId: '' });
		sinon.assert.notCalled(findUser);
		sinon.assert.notCalled(hide);
	});

	it('does nothing for an unknown actor', async () => {
		findUser.resolves(null);
		await slashCommand.runCommand('hide');
		sinon.assert.calledOnce(findUser);
		sinon.assert.notCalled(hide);
	});

	[
		{ user: actor, language: 'de', expected: 'pt' },
		{ user: { _id: 'actor', username: 'alice' }, language: 'de', expected: 'de' },
		{ user: { _id: 'actor', username: 'alice' }, language: undefined, expected: 'en' },
	].forEach(({ user, language, expected }) => {
		it(`reports missing membership in ${expected} without hiding the channel`, async () => {
			findUser.resolves(user);
			slashCommand.settings.get.withArgs('Language').returns(language);
			subscription.resolves(null);
			await slashCommand.runCommand('hide', { params: '#general' });
			sinon.assert.calledOnce(subscription);
			slashCommand.expectTranslatedFeedback('error-logged-user-not-in-room');
			expect(slashCommand.translate.firstCall.args[1]).to.include({ roomName: '#general', lng: expected });
			sinon.assert.notCalled(hide);
		});
	});

	it('reports a missing channel without hiding another room', async () => {
		findRoomByName.resolves(null);
		subscription.resolves(null);
		await slashCommand.runCommand('hide', { params: '#missing' });
		sinon.assert.calledOnceWithExactly(findRoomByName, 'missing');
		slashCommand.expectTranslatedFeedback('Channel_doesnt_exist');
		sinon.assert.notCalled(hide);
	});

	it('reports a named-channel hide failure to the actor in the originating room', async () => {
		hide.rejects(new Error('storage failed'));
		slashCommand.translate.returns('localized hide error');
		await slashCommand.runCommand('hide', { params: '#general' });
		sinon.assert.calledOnceWithExactly(hide, 'actor', 'channel');
		sinon.assert.calledOnceWithExactly(slashCommand.broadcast, 'notify.ephemeralMessage', 'actor', 'current-room', {
			msg: 'localized hide error',
		});

		sinon.assert.calledOnce(slashCommand.translate);
		expect(slashCommand.translate.firstCall.args[1]).to.deep.equal({ lng: 'pt' });
	});
});
