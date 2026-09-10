import { MeteorError } from '@rocket.chat/core-services';
import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import sinon from 'sinon';

import { loadCommand } from './helpers';

(['to', 'from'] as const).forEach((direction) => {
	describe(`/invite-all-${direction}`, () => {
		const command = `invite-all-${direction}`;
		const actor = { _id: 'actor', username: 'alice', language: 'pt' };
		let source: { _id: string; t: string };
		let target: { _id: string; t: string };
		let byId: sinon.SinonStub;
		let byName: sinon.SinonStub;
		let findUser: sinon.SinonStub;
		let canAccess: sinon.SinonStub;
		let count: sinon.SinonStub;
		let subscriptions: sinon.SinonStub;
		let addUsers: sinon.SinonStub;
		let createPublic: sinon.SinonStub;
		let createPrivate: sinon.SinonStub;
		let harness: ReturnType<typeof loadCommand>;
		beforeEach(() => {
			source = { _id: 'source', t: 'c' };
			target = { _id: 'target', t: 'c' };
			byId = sinon.stub().resolves(direction === 'to' ? source : target);
			byName = sinon.stub().resolves(direction === 'to' ? target : source);
			findUser = sinon.stub().resolves(actor);
			canAccess = sinon.stub().resolves(true);
			count = sinon.stub().resolves(2);
			subscriptions = sinon.stub().returns({
				toArray: sinon.stub().resolves([{ u: { username: 'bob' } }, { u: { username: '' } }, { u: {} }, { u: { username: 'carol' } }]),
			});
			addUsers = sinon.stub().resolves();
			createPublic = sinon.stub().resolves();
			createPrivate = sinon.stub().resolves();
			harness = loadCommand('inviteall/server', {
				'@rocket.chat/models': {
					Rooms: { findOneById: byId, findOneByName: byName },
					Users: { findOneById: findUser },
					Subscriptions: { countByRoomIdWhenUsernameExists: count, findByRoomIdWhenUsernameExists: subscriptions },
				},
				'../../lib/authorization': { canAccessRoomAsync: canAccess },
				'../../meteor-methods/rooms/addUsersToRoom': { addUsersToRoomMethod: addUsers },
				'../../meteor-methods/rooms/createChannel': { createChannelMethod: createPublic },
				'../../meteor-methods/rooms/createPrivateGroup': { createPrivateGroupMethod: createPrivate },
			});
			harness.settings.get.withArgs('API_User_Limit').returns(2);
		});
		it('copies named subscribers from the source to the target at the configured limit', async () => {
			await harness.run(command, { params: ' #general ' });
			sinon.assert.calledOnceWithExactly(byId, 'current-room');
			sinon.assert.calledOnceWithExactly(byName, 'general');
			sinon.assert.calledOnceWithExactly(canAccess, source, actor);
			sinon.assert.calledOnceWithExactly(count, 'source');
			sinon.assert.calledOnceWithExactly(subscriptions, 'source', { projection: { 'u.username': 1 } });
			sinon.assert.calledOnceWithExactly(addUsers, 'actor', { rid: 'target', users: ['bob', 'carol'] });
			harness.expectFeedback('Users_added');
			expect(harness.translate.firstCall.args[1]).to.deep.equal({ lng: 'pt' });
			sinon.assert.notCalled(createPublic);
			sinon.assert.notCalled(createPrivate);
		});
		[{ params: ' ' }, { params: '#' }, { params: '#general', userId: '' }, { params: '#general', command: 'unrelated' }].forEach(
			(overrides) => {
				it(`ignores invalid invocation ${JSON.stringify(overrides)}`, async () => {
					await harness.run(command, overrides);
					sinon.assert.notCalled(findUser);
					sinon.assert.notCalled(addUsers);
					sinon.assert.notCalled(createPublic);
					sinon.assert.notCalled(createPrivate);
				});
			},
		);
		it('does nothing for an unknown actor', async () => {
			findUser.resolves(null);
			await harness.run(command, { params: '#general' });
			sinon.assert.calledOnce(findUser);
			sinon.assert.notCalled(byId);
			sinon.assert.notCalled(addUsers);
		});
		it('reports a missing source without changing membership', async () => {
			(direction === 'to' ? byId : byName).resolves(null);
			await harness.run(command, { params: '#missing' });
			harness.expectFeedback('Channel_doesnt_exist');
			expect(harness.translate.firstCall.args[1]).to.include({ channelName: 'missing' });
			sinon.assert.notCalled(canAccess);
			sinon.assert.notCalled(addUsers);
		});
		it('denies access before reading source membership or creating a room', async () => {
			canAccess.resolves(false);
			await harness.run(command, { params: '#general' });
			sinon.assert.calledOnceWithExactly(canAccess, source, actor);
			harness.expectFeedback('Room_not_exist_or_not_permission');
			sinon.assert.notCalled(count);
			sinon.assert.notCalled(subscriptions);
			sinon.assert.notCalled(addUsers);
			sinon.assert.notCalled(createPublic);
			sinon.assert.notCalled(createPrivate);
		});
		it('does not bulk invite when the API user limit is disabled', async () => {
			harness.settings.get.withArgs('API_User_Limit').returns(0);
			await harness.run(command, { params: '#general' });
			sinon.assert.calledOnce(canAccess);
			sinon.assert.notCalled(count);
			sinon.assert.notCalled(addUsers);
			sinon.assert.notCalled(harness.broadcast);
		});
		it('rejects requests exceeding the user limit before reading or adding users', async () => {
			count.resolves(3);
			await harness.run(command, { params: '#general' });
			harness.expectFeedback('error-user-limit-exceeded');
			sinon.assert.calledOnce(count);
			sinon.assert.notCalled(subscriptions);
			sinon.assert.notCalled(addUsers);
		});
		[
			{ error: 'cant-invite-for-direct-room', key: 'Cannot_invite_users_to_direct_rooms' },
			{ error: 'error-not-allowed', key: 'error-not-allowed' },
		].forEach(({ error, key }) => {
			it(`reports ${error} without success feedback`, async () => {
				addUsers.rejects(new MeteorError(error));
				await harness.run(command, { params: '#general' });
				sinon.assert.calledOnce(addUsers);
				harness.expectFeedback(key);
				sinon.assert.calledOnce(harness.broadcast);
			});
		});
		if (direction === 'to') {
			['c', 'p'].forEach((type) => {
				it(`creates a missing destination matching source type ${type}`, async () => {
					source.t = type;
					byName.resolves(null);
					await harness.run(command, { params: '#new-room' });
					if (type === 'c') {
						sinon.assert.calledOnceWithExactly(createPublic, 'actor', 'new-room', ['bob', 'carol']);
						sinon.assert.notCalled(createPrivate);
					} else {
						sinon.assert.calledOnceWithExactly(createPrivate, actor, 'new-room', ['bob', 'carol']);
						sinon.assert.notCalled(createPublic);
					}
					sinon.assert.notCalled(addUsers);
					harness.expectFeedback('Channel_created');
					harness.expectFeedback('Users_added');
				});
			});
			it('does not announce success if destination creation fails', async () => {
				byName.resolves(null);
				createPublic.rejects(new MeteorError('error-not-allowed'));
				await harness.run(command, { params: '#new-room' });
				sinon.assert.calledOnce(createPublic);
				harness.expectFeedback('error-not-allowed');
				sinon.assert.calledOnce(harness.broadcast);
				sinon.assert.notCalled(addUsers);
			});
			['de', undefined].forEach((language) => {
				it(`uses ${language || 'English'} when the actor has no language`, async () => {
					findUser.resolves({ _id: 'actor', username: 'alice' });
					harness.settings.get.withArgs('Language').returns(language);
					await harness.run(command, { params: '#general' });
					expect(harness.translate.firstCall.args[1]).to.deep.equal({ lng: language || 'en' });
				});
			});
		}
	});
});
