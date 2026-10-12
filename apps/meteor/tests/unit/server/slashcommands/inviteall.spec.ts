import { AbacContractError, AbacErrorCode } from '@rocket.chat/abac';
import { MeteorError, isMeteorError } from '@rocket.chat/core-services';
import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import sinon from 'sinon';

import { loadSlashCommand } from './helpers';

(['to', 'from'] as const).forEach((direction) => {
	describe(`/invite-all-${direction}`, () => {
		const command = `invite-all-${direction}`;
		const actor = { _id: 'actor', username: 'alice', language: 'pt' };
		let source: { _id: string; t: string };
		let target: { _id: string; t: string };
		let findRoomById: sinon.SinonStub;
		let findRoomByName: sinon.SinonStub;
		let findUser: sinon.SinonStub;
		let canAccess: sinon.SinonStub;
		let count: sinon.SinonStub;
		let subscriptions: sinon.SinonStub;
		let addUsers: sinon.SinonStub;
		let createPublic: sinon.SinonStub;
		let createPrivate: sinon.SinonStub;
		let filterAllowed: sinon.SinonStub;
		let assertCanAdd: sinon.SinonStub;
		let slashCommand: ReturnType<typeof loadSlashCommand>;
		const bob = { _id: 'bob-id', username: 'bob' };
		const carol = { _id: 'carol-id', username: 'carol' };

		beforeEach(() => {
			source = { _id: 'source', t: 'c' };
			target = { _id: 'target', t: 'c' };
			findRoomById = sinon.stub().resolves(direction === 'to' ? source : target);
			findRoomByName = sinon.stub().resolves(direction === 'to' ? target : source);
			findUser = sinon.stub().resolves(actor);
			canAccess = sinon.stub().resolves(true);
			count = sinon.stub().resolves(2);
			subscriptions = sinon.stub().returns({
				toArray: sinon.stub().resolves([{ u: bob }, { u: { _id: 'nameless', username: '' } }, { u: { _id: 'no-username' } }, { u: carol }]),
			});

			addUsers = sinon.stub().resolves();
			createPublic = sinon.stub().resolves({});
			createPrivate = sinon.stub().resolves({});
			filterAllowed = sinon.stub().callsFake(async (users) => users);
			assertCanAdd = sinon.stub().resolves();
			slashCommand = loadSlashCommand('inviteall/server', {
				'@rocket.chat/core-services': { isMeteorError },
				'../../lib/rooms/filterUsersAllowedInRoom': { filterUsersAllowedInRoomOrThrow: filterAllowed },
				'@rocket.chat/models': {
					Rooms: { findOneById: findRoomById, findOneByName: findRoomByName },
					Users: { findOneById: findUser },
					Subscriptions: { countByRoomIdWhenUsernameExists: count, findByRoomIdWhenUsernameExists: subscriptions },
				},
				'../../lib/authorization': { canAccessRoomAsync: canAccess },
				'../../meteor-methods/rooms/addUsersToRoom': { addUsersToRoomMethod: addUsers, assertCanAddUsersToRoom: assertCanAdd },
				'../../meteor-methods/rooms/createChannel': { createChannelMethod: createPublic },
				'../../meteor-methods/rooms/createPrivateGroup': { createPrivateGroupMethod: createPrivate },
			});

			slashCommand.settings.get.withArgs('API_User_Limit').returns(2);
			slashCommand.translationExists.returns(true);
		});

		const expectSkippedFeedback = (skipped: { _id: string; username: string }[]) => {
			sinon.assert.calledWithExactly(slashCommand.broadcast, 'notify.ephemeralMessage', 'actor', 'current-room', {
				msg: 'translated:ABAC_Members_Not_Added_Usernames',
				mentions: skipped.map(({ _id, username }) => ({ _id, username, type: 'user' })),
			});
			sinon.assert.calledWithMatch(slashCommand.translate, 'ABAC_Members_Not_Added_Usernames', {
				usernames: skipped.map(({ username }) => `@${username}`).join(', '),
			});
		};

		it('copies named subscribers from the source to the target at the configured limit', async () => {
			await slashCommand.runCommand(command, { params: ' #general ' });
			sinon.assert.calledOnceWithExactly(findRoomById, 'current-room');
			sinon.assert.calledOnceWithExactly(findRoomByName, 'general');
			sinon.assert.calledOnceWithExactly(canAccess, source, actor);
			sinon.assert.calledOnceWithExactly(count, 'source');
			sinon.assert.calledOnceWithExactly(subscriptions, 'source', { projection: { 'u._id': 1, 'u.username': 1 } });
			sinon.assert.calledOnceWithExactly(assertCanAdd, 'actor', target);
			sinon.assert.calledOnceWithExactly(filterAllowed, [bob, carol], target);
			sinon.assert.callOrder(assertCanAdd, filterAllowed, addUsers);
			sinon.assert.calledOnceWithExactly(addUsers, 'actor', { rid: 'target', users: ['bob', 'carol'] });
			slashCommand.expectTranslatedFeedback('Users_added');
			expect(slashCommand.translate.firstCall.args[1]).to.deep.equal({ lng: 'pt' });
			sinon.assert.calledOnce(slashCommand.broadcast);
			sinon.assert.notCalled(createPublic);
			sinon.assert.notCalled(createPrivate);
		});

		it('adds the members the target room allows and names the ones it skipped', async () => {
			filterAllowed.resolves([bob]);
			await slashCommand.runCommand(command, { params: '#general' });
			sinon.assert.calledOnceWithExactly(addUsers, 'actor', { rid: 'target', users: ['bob'] });
			slashCommand.expectTranslatedFeedback('Users_added');
			expectSkippedFeedback([carol]);
			sinon.assert.calledTwice(slashCommand.broadcast);
		});

		it('reports only the skipped members when the target room allows none', async () => {
			filterAllowed.resolves([]);
			await slashCommand.runCommand(command, { params: '#general' });
			sinon.assert.calledOnceWithExactly(addUsers, 'actor', { rid: 'target', users: [] });
			expectSkippedFeedback([bob, carol]);
			sinon.assert.neverCalledWith(slashCommand.translate, 'Users_added');
			sinon.assert.calledOnce(slashCommand.broadcast);
		});

		it('refuses an actor who may not add members to the target before any ABAC evaluation', async () => {
			assertCanAdd.rejects(new MeteorError('error-not-allowed'));
			await slashCommand.runCommand(command, { params: '#general' });
			sinon.assert.notCalled(filterAllowed);
			sinon.assert.notCalled(addUsers);
			slashCommand.expectTranslatedFeedback('error-not-allowed');
			sinon.assert.calledOnce(slashCommand.broadcast);
		});

		[AbacErrorCode.RoomLocked, AbacErrorCode.DecisionUnavailable].forEach((code) => {
			it(`reports ${code} without adding anyone or naming anyone as skipped`, async () => {
				filterAllowed.rejects(new AbacContractError(code));
				await slashCommand.runCommand(command, { params: '#general' });
				sinon.assert.notCalled(addUsers);
				slashCommand.expectTranslatedFeedback(code);
				sinon.assert.calledOnce(slashCommand.broadcast);
			});
		});

		it('does not report skipped members when adding fails', async () => {
			filterAllowed.resolves([bob]);
			addUsers.rejects(new MeteorError('error-not-allowed'));
			await slashCommand.runCommand(command, { params: '#general' });
			slashCommand.expectTranslatedFeedback('error-not-allowed');
			sinon.assert.calledOnce(slashCommand.broadcast);
		});

		it('shows a generic message and logs an error that has no translation', async () => {
			const error = new MeteorError('error-without-translation');
			addUsers.rejects(error);
			slashCommand.translationExists.withArgs('error-without-translation').returns(false);
			await slashCommand.runCommand(command, { params: '#general' });
			slashCommand.expectTranslatedFeedback('Error_something_went_wrong');
			sinon.assert.calledOnceWithExactly(slashCommand.logger.error, {
				msg: 'Failed to invite all users to room',
				err: error,
				rid: 'current-room',
				uid: 'actor',
			});
		});

		[{ params: ' ' }, { params: '#' }, { params: '#general', userId: '' }, { params: '#general', command: 'unrelated' }].forEach(
			(overrides) => {
				it(`ignores invalid invocation ${JSON.stringify(overrides)}`, async () => {
					await slashCommand.runCommand(command, overrides);
					sinon.assert.notCalled(findUser);
					sinon.assert.notCalled(addUsers);
					sinon.assert.notCalled(createPublic);
					sinon.assert.notCalled(createPrivate);
				});
			},
		);
		it('does nothing for an unknown actor', async () => {
			findUser.resolves(null);
			await slashCommand.runCommand(command, { params: '#general' });
			sinon.assert.calledOnce(findUser);
			sinon.assert.notCalled(findRoomById);
			sinon.assert.notCalled(addUsers);
		});

		it('reports a missing source without changing membership', async () => {
			(direction === 'to' ? findRoomById : findRoomByName).resolves(null);
			await slashCommand.runCommand(command, { params: '#missing' });
			slashCommand.expectTranslatedFeedback('Channel_doesnt_exist');
			expect(slashCommand.translate.firstCall.args[1]).to.include({ channelName: 'missing' });
			sinon.assert.notCalled(canAccess);
			sinon.assert.notCalled(addUsers);
		});

		it('denies access before reading source membership or creating a room', async () => {
			canAccess.resolves(false);
			await slashCommand.runCommand(command, { params: '#general' });
			sinon.assert.calledOnceWithExactly(canAccess, source, actor);
			slashCommand.expectTranslatedFeedback('Room_not_exist_or_not_permission');
			sinon.assert.notCalled(count);
			sinon.assert.notCalled(subscriptions);
			sinon.assert.notCalled(addUsers);
			sinon.assert.notCalled(createPublic);
			sinon.assert.notCalled(createPrivate);
		});

		it('does not bulk invite when the API user limit is disabled', async () => {
			slashCommand.settings.get.withArgs('API_User_Limit').returns(0);
			await slashCommand.runCommand(command, { params: '#general' });
			sinon.assert.calledOnce(canAccess);
			sinon.assert.notCalled(count);
			sinon.assert.notCalled(addUsers);
			sinon.assert.notCalled(slashCommand.broadcast);
		});

		it('rejects requests exceeding the user limit before reading or adding users', async () => {
			count.resolves(3);
			await slashCommand.runCommand(command, { params: '#general' });
			slashCommand.expectTranslatedFeedback('error-user-limit-exceeded');
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
				await slashCommand.runCommand(command, { params: '#general' });
				sinon.assert.calledOnce(addUsers);
				slashCommand.expectTranslatedFeedback(key);
				sinon.assert.calledOnce(slashCommand.broadcast);
			});
		});

		if (direction === 'to') {
			['c', 'p'].forEach((type) => {
				it(`creates a missing destination matching source type ${type}`, async () => {
					source.t = type;
					findRoomByName.resolves(null);
					await slashCommand.runCommand(command, { params: '#new-room' });
					if (type === 'c') {
						sinon.assert.calledOnceWithExactly(createPublic, 'actor', 'new-room', ['bob', 'carol']);
						sinon.assert.notCalled(createPrivate);
					} else {
						sinon.assert.calledOnceWithExactly(createPrivate, actor, 'new-room', ['bob', 'carol']);
						sinon.assert.notCalled(createPublic);
					}
					sinon.assert.notCalled(addUsers);
					sinon.assert.notCalled(filterAllowed);
					slashCommand.expectTranslatedFeedback('Channel_created');
					slashCommand.expectTranslatedFeedback('Users_added');
					sinon.assert.calledTwice(slashCommand.broadcast);
				});
			});

			it('names the members skipped when the destination is created', async () => {
				source.t = 'p';
				findRoomByName.resolves(null);
				createPrivate.resolves({ rid: 'new-room-id', skippedMembers: ['carol'] });
				await slashCommand.runCommand(command, { params: '#new-room' });
				slashCommand.expectTranslatedFeedback('Channel_created');
				slashCommand.expectTranslatedFeedback('Users_added');
				expectSkippedFeedback([carol]);
			});

			[
				{ type: 'c', code: AbacErrorCode.PublicRoomCreationBlocked },
				{ type: 'p', code: AbacErrorCode.AttributesRequired },
			].forEach(({ type, code }) => {
				it(`reports ${code} when creating a missing destination of type ${type} is refused`, async () => {
					source.t = type;
					findRoomByName.resolves(null);
					(type === 'c' ? createPublic : createPrivate).rejects(new AbacContractError(code));
					await slashCommand.runCommand(command, { params: '#new-room' });
					slashCommand.expectTranslatedFeedback(code);
					sinon.assert.calledOnce(slashCommand.broadcast);
					sinon.assert.notCalled(addUsers);
				});
			});

			it('does not announce success if destination creation fails', async () => {
				findRoomByName.resolves(null);
				createPublic.rejects(new MeteorError('error-not-allowed'));
				await slashCommand.runCommand(command, { params: '#new-room' });
				sinon.assert.calledOnce(createPublic);
				slashCommand.expectTranslatedFeedback('error-not-allowed');
				sinon.assert.calledOnce(slashCommand.broadcast);
				sinon.assert.notCalled(addUsers);
			});

			['de', undefined].forEach((language) => {
				it(`uses ${language || 'English'} when the actor has no language`, async () => {
					findUser.resolves({ _id: 'actor', username: 'alice' });
					slashCommand.settings.get.withArgs('Language').returns(language);
					await slashCommand.runCommand(command, { params: '#general' });
					expect(slashCommand.translate.firstCall.args[1]).to.deep.equal({ lng: language || 'en' });
				});
			});
		}
	});
});
