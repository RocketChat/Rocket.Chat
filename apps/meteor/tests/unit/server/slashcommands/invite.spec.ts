import { MeteorError, isMeteorError } from '@rocket.chat/core-services';
import { isBannedSubscription } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import sinon from 'sinon';

import { loadCommand } from './helpers';

describe('/invite', () => {
	const actor = { _id: 'actor', username: 'alice' };
	const bob = { _id: 'bob-id', username: 'bob' };
	const carol = { _id: 'carol-id', username: 'carol' };
	const external = { _id: 'external-id', username: '@remote:example.org' };
	let findRoom: sinon.SinonStub;
	let findUsers: sinon.SinonStub;
	let toArray: sinon.SinonStub;
	let findActor: sinon.SinonStub;
	let subscription: sinon.SinonStub;
	let addUsers: sinon.SinonStub;
	let ensureFederatedUsers: sinon.SinonStub;
	let shouldFederate: sinon.SinonStub;
	let sanitize: sinon.SinonStub;
	let broadcast: sinon.SinonStub;
	let harness: ReturnType<typeof loadCommand>;
	beforeEach(() => {
		findRoom = sinon.stub().resolves({ _id: 'current-room', t: 'c' });
		toArray = sinon.stub().resolves([bob]);
		findUsers = sinon.stub().returns({ toArray });
		findActor = sinon.stub().resolves(actor);
		subscription = sinon.stub().resolves(null);
		addUsers = sinon.stub().resolves();
		ensureFederatedUsers = sinon.stub().resolves();
		shouldFederate = sinon.stub().returns(true);
		sanitize = sinon.stub();
		sanitize.withArgs('').returns('');
		sanitize.withArgs('@bob').returns('bob');
		sanitize.withArgs('@carol').returns('carol');
		sanitize.withArgs(external.username).returns(external.username);
		broadcast = sinon.stub().resolves();
		harness = loadCommand('invite/server', {
			'@rocket.chat/core-services': {
				api: { broadcast },
				FederationMatrix: { ensureFederatedUsersExistLocally: ensureFederatedUsers },
				isMeteorError,
			},
			'@rocket.chat/core-typings': { isBannedSubscription },
			'@rocket.chat/federation-matrix': { validateFederatedUsername: (username: string) => username === external.username },
			'@rocket.chat/models': {
				Rooms: { findOneById: findRoom },
				Users: { findByUsernames: findUsers, findOneById: findActor },
				Subscriptions: { findOneByRoomIdAndUserId: subscription },
			},
			'../../meteor-methods/rooms/addUsersToRoom': { addUsersToRoomMethod: addUsers, sanitizeUsername: sanitize },
			'../../services/room/hooks/BeforeFederationActions': { FederationActions: { shouldPerformFederationAction: shouldFederate } },
		});
	});
	it('splits comma and whitespace separated usernames and invites each user with the actor', async () => {
		toArray.resolves([bob, carol]);
		await harness.run('invite', { params: ' @bob,\n @carol ' });
		sinon.assert.calledOnceWithExactly(findUsers, ['bob', 'carol']);
		sinon.assert.calledWithExactly(subscription, 'current-room', 'bob-id', { projection: { _id: 1, status: 1 } });
		sinon.assert.calledWithExactly(addUsers, 'actor', { rid: 'current-room', users: ['bob'] }, actor);
		sinon.assert.calledWithExactly(addUsers, 'actor', { rid: 'current-room', users: ['carol'] }, actor);
		sinon.assert.calledTwice(addUsers);
		sinon.assert.notCalled(broadcast);
	});
	it('does nothing when no usernames remain after sanitization', async () => {
		await harness.run('invite', { params: ' , \n' });
		sinon.assert.called(sanitize);
		sinon.assert.notCalled(findRoom);
		sinon.assert.notCalled(addUsers);
	});
	it('reports a missing room before looking up invitees', async () => {
		findRoom.resolves(null);
		await harness.run('invite', { params: '@bob', userId: 'other-actor', message: { _id: 'other-message', rid: 'other-room' } });
		harness.expectFeedback('error-invalid-room');
		sinon.assert.calledOnceWithExactly(broadcast, 'notify.ephemeralMessage', 'other-actor', 'other-room', {
			msg: 'translated:error-invalid-room',
		});
		sinon.assert.notCalled(findUsers);
		sinon.assert.notCalled(addUsers);
	});
	it('reports unknown invitees without changing membership', async () => {
		toArray.resolves([]);
		await harness.run('invite', { params: '@bob @carol' });
		harness.expectFeedback('User_doesnt_exist');
		expect(harness.translate.firstCall.args[1]).to.include({ username: 'bob @carol', lng: 'en' });
		sinon.assert.notCalled(addUsers);
	});
	it('skips existing members while inviting users without subscriptions', async () => {
		toArray.resolves([bob, carol]);
		subscription.withArgs('current-room', bob._id).resolves({ _id: 'subscription' });
		await harness.run('invite', { params: '@bob @carol' });
		harness.expectFeedback('Username_is_already_in_here');
		expect(harness.translate.firstCall.args[1]).to.include({ username: 'bob' });
		sinon.assert.calledOnceWithExactly(addUsers, 'actor', { rid: 'current-room', users: ['carol'] }, actor);
	});
	it('delegates banned subscriptions to the authoritative invitation method', async () => {
		subscription.resolves({ _id: 'subscription', status: 'BANNED' });
		await harness.run('invite', { params: '@bob' });
		sinon.assert.calledOnceWithExactly(addUsers, 'actor', { rid: 'current-room', users: ['bob'] }, actor);
		sinon.assert.notCalled(broadcast);
	});
	it('rejects an unknown inviter before adding anyone', async () => {
		findActor.resolves(null);
		await expect(harness.run('invite', { params: '@bob' })).to.be.rejectedWith('Inviter not found');
		sinon.assert.calledOnceWithExactly(findActor, 'actor');
		sinon.assert.notCalled(addUsers);
	});
	it('ensures federated users exist locally before querying and inviting them', async () => {
		toArray.resolves([external]);
		await harness.run('invite', { params: external.username });
		sinon.assert.calledOnceWithExactly(ensureFederatedUsers, [external.username]);
		sinon.assert.callOrder(ensureFederatedUsers, findUsers);
		sinon.assert.calledOnceWithExactly(addUsers, 'actor', { rid: 'current-room', users: [external.username] }, actor);
	});
	it('excludes external users from non-federated rooms while still inviting local users', async () => {
		shouldFederate.returns(false);
		await harness.run('invite', { params: `${external.username} @bob` });
		harness.expectFeedback('You_cannot_add_external_users_to_non_federated_room');
		sinon.assert.notCalled(ensureFederatedUsers);
		sinon.assert.calledOnceWithExactly(findUsers, ['bob']);
		sinon.assert.calledOnceWithExactly(addUsers, 'actor', { rid: 'current-room', users: ['bob'] }, actor);
	});
	it('stops when all invitees are external users in a non-federated room', async () => {
		shouldFederate.returns(false);
		await harness.run('invite', { params: external.username });
		harness.expectFeedback('You_cannot_add_external_users_to_non_federated_room');
		sinon.assert.notCalled(findUsers);
		sinon.assert.notCalled(addUsers);
	});
	it('propagates a federation provisioning failure without inviting anyone', async () => {
		const error = new Error('federation unavailable');
		ensureFederatedUsers.rejects(error);
		await expect(harness.run('invite', { params: external.username })).to.be.rejectedWith(error);
		sinon.assert.calledOnce(ensureFederatedUsers);
		sinon.assert.notCalled(findUsers);
		sinon.assert.notCalled(addUsers);
	});
	[
		{
			error: new MeteorError('error-only-compliant-users-can-be-added-to-abac-rooms', 'ABAC failure'),
			key: 'error-only-compliant-users-can-be-added-to-abac-rooms',
		},
		{ error: { error: 'error-federated-users-in-non-federated-rooms' }, key: 'You_cannot_add_external_users_to_non_federated_room' },
		{ error: { error: 'cant-invite-for-direct-room' }, key: 'Cannot_invite_users_to_direct_rooms' },
		{ error: { error: 'other-invitation-error' }, key: 'other-invitation-error' },
	].forEach(({ error, key }) => {
		it(`reports ${error.error} while allowing other invitees to proceed`, async () => {
			toArray.resolves([bob, carol]);
			addUsers.onFirstCall().rejects(error);
			harness.settings.get.withArgs('Language').returns('pt');
			await harness.run('invite', { params: '@bob @carol' });
			harness.expectFeedback(key);
			sinon.assert.calledOnce(broadcast);
			expect(harness.translate.firstCall.args[1]).to.deep.equal({ lng: 'pt' });
			sinon.assert.calledTwice(addUsers);
			sinon.assert.calledWithExactly(addUsers, 'actor', { rid: 'current-room', users: ['carol'] }, actor);
		});
	});
	it('delivers translated Meteor error feedback while continuing other invitations', async () => {
		toArray.resolves([bob, carol]);
		addUsers.onFirstCall().rejects(new MeteorError('error-not-allowed', 'Not allowed'));
		harness.settings.get.withArgs('Language').returns('pt');
		// The handler currently translates error.message, including Meteor's error-code suffix.
		// Protect delivery of the translation result without requiring that translation key.
		harness.translate.returns('localized invitation error');
		await harness.run('invite', { params: '@bob @carol' });
		sinon.assert.calledOnceWithExactly(harness.translate, sinon.match.string, { lng: 'pt' });
		sinon.assert.calledOnceWithExactly(broadcast, 'notify.ephemeralMessage', 'actor', 'current-room', {
			msg: 'localized invitation error',
		});
		sinon.assert.calledTwice(addUsers);
		sinon.assert.calledWithExactly(addUsers, 'actor', { rid: 'current-room', users: ['carol'] }, actor);
	});
});
