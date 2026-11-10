import { after, before, beforeEach, describe, it } from 'node:test';

import { ClientSafeError, LocalBroker, ServiceClass, api } from '@rocket.chat/core-services';
import type { IAuthorization, IMessageService, IRoomService, ITeamService } from '@rocket.chat/core-services';
import { TeamType } from '@rocket.chat/core-typings';
import type { IRoomsModel, ISubscriptionsModel, IUsersModel } from '@rocket.chat/model-typings';
import { registerModel } from '@rocket.chat/models';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const sandbox = sinon.createSandbox();

const settingsGet = sandbox.stub();
const hasPermission = sandbox.stub();
const allowRoomSettingChange = sandbox.stub();
const getTeamInfo = sandbox.stub();
const updateTeam = sandbox.stub();
const saveSystemMessage = sandbox.stub();
const notifyParentRoom = sandbox.stub();

class AuthorizationDouble extends ServiceClass implements Pick<IAuthorization, 'hasPermission'> {
	protected name = 'authorization';

	async hasPermission(...args: Parameters<IAuthorization['hasPermission']>) {
		return hasPermission(...args);
	}
}

class TeamDouble extends ServiceClass implements Pick<ITeamService, 'getInfoById' | 'update'> {
	protected name = 'team';

	async getInfoById(...args: Parameters<ITeamService['getInfoById']>) {
		return getTeamInfo(...args);
	}

	async update(...args: Parameters<ITeamService['update']>) {
		return updateTeam(...args);
	}
}

class MessageDouble extends ServiceClass implements Pick<IMessageService, 'saveSystemMessage'> {
	protected name = 'message';

	async saveSystemMessage(...args: Parameters<IMessageService['saveSystemMessage']>) {
		return saveSystemMessage(...args);
	}
}

class RoomDouble extends ServiceClass implements Pick<IRoomService, 'beforeTopicChange'> {
	protected name = 'room';

	async beforeTopicChange() {
		return undefined;
	}
}

const services = [new AuthorizationDouble(), new TeamDouble(), new MessageDouble(), new RoomDouble()];

const savers = {
	saveRoomName: sandbox.stub(),
	saveRoomCustomFields: sandbox.stub(),
	saveRoomType: sandbox.stub(),
	setRoomAvatar: sandbox.stub(),
};

const roomWrites = {
	setTopicById: sandbox.stub(),
	setAnnouncementById: sandbox.stub(),
	setDescriptionById: sandbox.stub(),
	setReadOnlyById: sandbox.stub(),
	setAllowReactingWhenReadOnlyById: sandbox.stub(),
	setSystemMessagesById: sandbox.stub(),
	saveEncryptedById: sandbox.stub(),
	setJoinCodeById: sandbox.stub(),
	saveDefaultById: sandbox.stub(),
	saveFeaturedById: sandbox.stub(),
	saveRetentionEnabledById: sandbox.stub(),
	saveRetentionMaxAgeById: sandbox.stub(),
	saveRetentionExcludePinnedById: sandbox.stub(),
	saveRetentionFilesOnlyById: sandbox.stub(),
	saveRetentionIgnoreThreadsById: sandbox.stub(),
	saveRetentionOverrideGlobalById: sandbox.stub(),
	saveFavoriteById: sandbox.stub(),
};

const findRoom = sandbox.stub();
const findRoomsByIds = sandbox.stub();
const findUser = sandbox.stub();
const disableAutoTranslate = sandbox.stub();

const { isABACManagedRoom } = proxyquire.noCallThru().load('../../lib/authorization/isABACManagedRoom', {
	'../../settings': { settings: { get: settingsGet } },
});

const { saveRoomSettings } = proxyquire.noCallThru().load('./saveRoomSettings', {
	'../../lib/authorization/isABACManagedRoom': { isABACManagedRoom },
	'../../lib/messaging/discussions/updateAndNotifyParentRoomWithParentMessage': {
		updateAndNotifyParentRoomWithParentMessage: notifyParentRoom,
	},
	'../../lib/rooms/roomCoordinator': { roomCoordinator: { getRoomDirectives: () => ({ allowRoomSettingChange }) } },
	'../../lib/rooms/setRoomAvatar': { setRoomAvatar: savers.setRoomAvatar },
	'../../lib/rooms/settings/saveRoomCustomFields': { saveRoomCustomFields: savers.saveRoomCustomFields },
	'../../lib/rooms/settings/saveRoomName': { saveRoomName: savers.saveRoomName },
	'../../lib/rooms/settings/saveRoomType': { saveRoomType: savers.saveRoomType },
	'../../settings': { settings: { get: settingsGet } },
});

const userId = 'user-id';
const rid = 'room-id';
const user = { _id: userId, username: 'user', name: 'User' };
const abacAttributes = [{ key: 'department', values: ['sales'] }];

const grant = (permission: string, scope?: string) =>
	(scope ? hasPermission.withArgs(userId, permission, scope) : hasPermission.withArgs(userId, permission)).resolves(true);

const givenRoom = (room: Record<string, unknown> = {}) => findRoom.withArgs(rid).resolves({ _id: rid, t: 'c', ...room });

const expectNothingSaved = () => {
	for (const stub of [...Object.values(savers), ...Object.values(roomWrites), saveSystemMessage, findRoomsByIds]) {
		expect(stub.called).to.be.false;
	}
};

const expectRefused = async (settings: Record<string, unknown>, error = 'error-action-not-allowed', id = userId) => {
	const refusal = await saveRoomSettings(id, rid, settings).catch((e: ClientSafeError) => e);

	expect(refusal).to.be.instanceOf(ClientSafeError);
	expect(refusal).to.have.property('error', error);
	expectNothingSaved();
};

describe('saveRoomSettings', () => {
	before(() => {
		api.setBroker(new LocalBroker());
		services.forEach((service) => api.registerService(service));
		registerModel('IRoomsModel', { findOneById: findRoom, findByIds: findRoomsByIds, ...roomWrites } as unknown as IRoomsModel);
		registerModel('IUsersModel', { findOneById: findUser } as unknown as IUsersModel);
		registerModel('ISubscriptionsModel', { disableAutoTranslateByRoomId: disableAutoTranslate } as unknown as ISubscriptionsModel);
	});

	after(async () => {
		await Promise.all(services.map((service) => api.destroyService(service)));
	});

	beforeEach(() => {
		sandbox.reset();
		hasPermission.resolves(false);
		grant('edit-room', rid);
		allowRoomSettingChange.resolves(true);
		findUser.withArgs(userId).resolves(user);
		savers.saveRoomName.resolves(true);
		savers.saveRoomType.resolves(true);
		Object.values(roomWrites).forEach((write) => write.resolves({ modifiedCount: 1 }));
		disableAutoTranslate.resolves({ modifiedCount: 0 });
		findRoomsByIds.returns([]);
		givenRoom();
	});

	describe('before any setting is saved', () => {
		it('should refuse an anonymous caller', async () => {
			await expectRefused({ roomTopic: 'new' }, 'error-unauthenticated', '');
		});

		it('should refuse a setting that does not exist', async () => {
			await expectRefused({ roomTopic: 'new', ownerId: 'someone-else' }, 'error-invalid-settings');
		});

		it('should refuse a room that does not exist', async () => {
			findRoom.withArgs(rid).resolves(null);

			await expectRefused({ roomTopic: 'new' }, 'error-invalid-room');
		});

		it('should refuse a user who cannot edit the room', async () => {
			hasPermission.withArgs(userId, 'edit-room', rid).resolves(false);

			await expectRefused({ roomTopic: 'new' });
		});

		it('should refuse a user who no longer exists', async () => {
			findUser.withArgs(userId).resolves(null);

			await expectRefused({ roomTopic: 'new' }, 'error-invalid-user');
		});

		it('should save nothing when one setting of the request is refused', async () => {
			await expectRefused({ roomTopic: 'new', featured: true });
		});
	});

	describe('saving', () => {
		it('should accept one setting by name, post a system message and tell clients the room changed', async () => {
			expect(await saveRoomSettings(userId, rid, 'roomTopic', 'new')).to.deep.equal({ result: true, rid });

			expect(roomWrites.setTopicById.calledOnceWith(rid, 'new')).to.be.true;
			expect(saveSystemMessage.calledOnceWith('room_changed_topic', rid, 'new', user)).to.be.true;
			expect(findRoomsByIds.calledOnceWith([rid])).to.be.true;
		});

		const textSettings = [
			{ setting: 'roomTopic', field: 'topic', saver: roomWrites.setTopicById },
			{ setting: 'roomAnnouncement', field: 'announcement', saver: roomWrites.setAnnouncementById },
			{ setting: 'roomDescription', field: 'description', saver: roomWrites.setDescriptionById },
		];

		for (const { setting, field, saver } of textSettings) {
			it(`should not post a system message when ${setting} did not change`, async () => {
				givenRoom({ [field]: 'same' });

				await saveRoomSettings(userId, rid, { [setting]: 'same' });

				expect(saver.called).to.be.false;
			});

			it(`should treat an empty ${setting} on a room without one as no change`, async () => {
				await saveRoomSettings(userId, rid, { [setting]: '' });

				expect(saver.called).to.be.false;
			});

			it(`should let the user clear ${setting}`, async () => {
				givenRoom({ [field]: 'old' });

				await saveRoomSettings(userId, rid, { [setting]: '' });

				expect(saver.calledOnceWith(rid, '')).to.be.true;
			});
		}

		it('should not post a system message when read-only settings did not change', async () => {
			givenRoom({ ro: true, reactWhenReadOnly: true });

			await saveRoomSettings(userId, rid, { readOnly: true, reactWhenReadOnly: true });

			expect(roomWrites.setReadOnlyById.called).to.be.false;
			expect(roomWrites.setAllowReactingWhenReadOnlyById.called).to.be.false;
			expect(saveSystemMessage.called).to.be.false;
		});

		it('should save changed read-only settings', async () => {
			await saveRoomSettings(userId, rid, { readOnly: true, reactWhenReadOnly: true });

			expect(roomWrites.setReadOnlyById.calledOnceWith(rid, true)).to.be.true;
			expect(roomWrites.setAllowReactingWhenReadOnlyById.calledOnceWith(rid, true)).to.be.true;
			expect(saveSystemMessage.calledWith('room-set-read-only', rid, '', user)).to.be.true;
			expect(saveSystemMessage.calledWith('room-allowed-reacting', rid, '', user)).to.be.true;
		});

		it('should save custom fields, the join code as text and the favorite defaults', async () => {
			const roomCustomFields = { costCenter: 'A1' };

			await saveRoomSettings(userId, rid, { roomCustomFields, joinCode: 1234, favorite: { favorite: true, defaultValue: false } });

			expect(savers.saveRoomCustomFields.calledOnceWith(rid, roomCustomFields)).to.be.true;
			expect(roomWrites.setJoinCodeById.calledOnceWith(rid, '1234')).to.be.true;
			expect(roomWrites.saveFavoriteById.calledOnceWith(rid, true, false)).to.be.true;
		});
	});

	describe('system messages', () => {
		it('should not save the same list again', async () => {
			givenRoom({ sysMes: ['uj', 'ul'] });

			await saveRoomSettings(userId, rid, { systemMessages: ['uj', 'ul'] });

			expect(roomWrites.setSystemMessagesById.called).to.be.false;
		});

		it('should not touch a parent room when the room is not a discussion', async () => {
			await saveRoomSettings(userId, rid, { systemMessages: ['uj'] });

			expect(roomWrites.setSystemMessagesById.calledOnceWith(rid, ['uj'])).to.be.true;
			expect(notifyParentRoom.called).to.be.false;
		});

		it('should update the parent room of a discussion with the new list', async () => {
			givenRoom({ prid: 'parent-id' });

			await saveRoomSettings(userId, rid, { systemMessages: ['uj'] });

			expect(notifyParentRoom.calledOnceWith(sinon.match({ _id: rid, prid: 'parent-id', sysMes: ['uj'] }))).to.be.true;
		});

		it('should keep the saved list when the parent room of a discussion cannot be updated', async () => {
			givenRoom({ prid: 'parent-id' });
			notifyParentRoom.rejects(new Error('parent room is gone'));

			expect(await saveRoomSettings(userId, rid, { systemMessages: ['uj'] })).to.deep.equal({ result: true, rid });
		});
	});

	describe('room administration settings', () => {
		for (const [setting, saver] of [
			['default', roomWrites.saveDefaultById],
			['featured', roomWrites.saveFeaturedById],
		] as const) {
			it(`should refuse ${setting} without access to room administration`, async () => {
				await expectRefused({ [setting]: true });
			});

			it(`should save ${setting} with access to room administration`, async () => {
				grant('view-room-administration');

				await saveRoomSettings(userId, rid, { [setting]: true });

				expect(saver.calledOnceWith(rid, true)).to.be.true;
			});
		}
	});

	describe('avatar', () => {
		it('should refuse a new avatar without the avatar permission', async () => {
			await expectRefused({ roomAvatar: 'data:image/png;base64,AA==' });
		});

		it('should save a new avatar with the avatar permission for this room', async () => {
			grant('edit-room-avatar', rid);

			await saveRoomSettings(userId, rid, { roomAvatar: 'data:image/png;base64,AA==' });

			expect(savers.setRoomAvatar.calledOnceWith(rid, 'data:image/png;base64,AA==', user)).to.be.true;
		});
	});

	describe('broadcast rooms', () => {
		beforeEach(() => {
			givenRoom({ broadcast: true, ro: true });
		});

		it('should refuse setting read-only', async () => {
			await expectRefused({ readOnly: true });
		});

		it('should refuse setting react when read-only', async () => {
			await expectRefused({ reactWhenReadOnly: true });
		});

		it('should let an editor turn read-only off', async () => {
			await saveRoomSettings(userId, rid, { readOnly: false });

			expect(roomWrites.setReadOnlyById.calledOnceWith(rid, false)).to.be.true;
		});
	});

	describe('encryption', () => {
		it('should let a member of a direct message toggle encryption without room edit access, and nothing else', async () => {
			givenRoom({ t: 'd' });
			hasPermission.withArgs(userId, 'edit-room', rid).resolves(false);

			await saveRoomSettings(userId, rid, { encrypted: true, roomTopic: 'new' });

			expect(roomWrites.saveEncryptedById.calledOnceWith(rid, true)).to.be.true;
			expect(saveSystemMessage.calledOnceWith('room_e2e_enabled', rid, 'user', user)).to.be.true;
			expect(roomWrites.setTopicById.called).to.be.false;
		});

		it('should refuse encryption without room edit access outside direct messages', async () => {
			givenRoom({ t: 'p' });
			hasPermission.withArgs(userId, 'edit-room', rid).resolves(false);
			grant('toggle-room-e2e-encryption', rid);

			await expectRefused({ encrypted: true });
		});

		it('should refuse a change in rooms that do not support encryption', async () => {
			grant('toggle-room-e2e-encryption', rid);
			allowRoomSettingChange.resolves(false);

			await expectRefused({ encrypted: true });
		});

		it('should refuse a change in a group without the encryption permission', async () => {
			givenRoom({ t: 'p' });

			await expectRefused({ encrypted: true });
		});

		it('should save a change in a group with the encryption permission for this room', async () => {
			givenRoom({ t: 'p' });
			grant('toggle-room-e2e-encryption', rid);

			await saveRoomSettings(userId, rid, { encrypted: true });

			expect(roomWrites.saveEncryptedById.calledOnceWith(rid, true)).to.be.true;
			expect(saveSystemMessage.calledOnceWith('room_e2e_enabled', rid, 'user', user)).to.be.true;
		});

		it('should not ask for the permission when the value did not change', async () => {
			givenRoom({ t: 'p', encrypted: true });

			await saveRoomSettings(userId, rid, { encrypted: true });

			expect(roomWrites.saveEncryptedById.calledOnceWith(rid, true)).to.be.true;
			expect(saveSystemMessage.called).to.be.false;
		});
	});

	describe('retention policy', () => {
		const retention = { enabled: true, maxAge: 30, excludePinned: true, filesOnly: true, ignoreThreads: true };

		const retentionSettings = [
			{ setting: 'retentionEnabled', field: 'enabled', newValue: false, saver: roomWrites.saveRetentionEnabledById },
			{ setting: 'retentionMaxAge', field: 'maxAge', newValue: 90, saver: roomWrites.saveRetentionMaxAgeById },
			{ setting: 'retentionExcludePinned', field: 'excludePinned', newValue: false, saver: roomWrites.saveRetentionExcludePinnedById },
			{ setting: 'retentionFilesOnly', field: 'filesOnly', newValue: false, saver: roomWrites.saveRetentionFilesOnlyById },
			{ setting: 'retentionIgnoreThreads', field: 'ignoreThreads', newValue: false, saver: roomWrites.saveRetentionIgnoreThreadsById },
		] as const;

		for (const { setting, field, newValue, saver } of retentionSettings) {
			it(`should refuse a new ${setting} without the retention permission`, async () => {
				givenRoom({ retention });

				await expectRefused({ [setting]: newValue });
			});

			it(`should refuse ${setting} without the retention permission on a room with no policy`, async () => {
				await expectRefused({ [setting]: newValue });
			});

			it(`should accept the current ${setting} without the retention permission`, async () => {
				givenRoom({ retention });

				await saveRoomSettings(userId, rid, { [setting]: retention[field] });

				expect(saver.calledOnceWith(rid, retention[field])).to.be.true;
			});

			it(`should save a new ${setting} with the retention permission for this room`, async () => {
				givenRoom({ retention });
				grant('edit-room-retention-policy', rid);

				await saveRoomSettings(userId, rid, { [setting]: newValue });

				expect(saver.calledOnceWith(rid, newValue)).to.be.true;
			});
		}

		it('should ignore the room policy values when the room stops overriding the global policy', async () => {
			givenRoom({ retention });
			grant('edit-room-retention-policy', rid);

			await saveRoomSettings(userId, rid, {
				retentionMaxAge: 90,
				retentionExcludePinned: false,
				retentionFilesOnly: false,
				retentionIgnoreThreads: false,
				retentionOverrideGlobal: false,
			});

			expect(roomWrites.saveRetentionOverrideGlobalById.calledOnceWith(rid, false)).to.be.true;
			expect(roomWrites.saveRetentionMaxAgeById.called).to.be.false;
			expect(roomWrites.saveRetentionExcludePinnedById.called).to.be.false;
			expect(roomWrites.saveRetentionFilesOnlyById.called).to.be.false;
			expect(roomWrites.saveRetentionIgnoreThreadsById.called).to.be.false;
		});

		it('should keep the room policy values when the room overrides the global policy', async () => {
			givenRoom({ retention });
			grant('edit-room-retention-policy', rid);

			await saveRoomSettings(userId, rid, { retentionMaxAge: 90, retentionOverrideGlobal: true });

			expect(roomWrites.saveRetentionMaxAgeById.calledOnceWith(rid, 90)).to.be.true;
		});

		it('should let a user without the retention permission change the global override', async () => {
			await saveRoomSettings(userId, rid, { retentionOverrideGlobal: true });

			expect(roomWrites.saveRetentionOverrideGlobalById.calledOnceWith(rid, true)).to.be.true;
		});
	});

	describe('room type', () => {
		it('should do nothing when the type did not change', async () => {
			await saveRoomSettings(userId, rid, { roomType: 'c' });

			expect(savers.saveRoomType.called).to.be.false;
		});

		it('should save the new type with the permission to create it', async () => {
			grant('create-p');

			await saveRoomSettings(userId, rid, { roomType: 'p' });

			expect(savers.saveRoomType.calledOnceWith(rid, 'p', user)).to.be.true;
			expect(updateTeam.called).to.be.false;
		});

		describe('in a team', () => {
			beforeEach(() => {
				getTeamInfo.withArgs('team-id').resolves({ roomId: 'team-room-id', type: TeamType.PUBLIC });
			});

			it('should check the channel permission on the team room, not on the channel', async () => {
				givenRoom({ t: 'p', teamId: 'team-id' });
				grant('create-team-channel', rid);

				await expectRefused({ roomType: 'c' });
			});

			it('should save a team channel with the team permission alone', async () => {
				givenRoom({ t: 'p', teamId: 'team-id' });
				grant('create-team-channel', 'team-room-id');

				await saveRoomSettings(userId, rid, { roomType: 'c' });

				expect(savers.saveRoomType.calledOnceWith(rid, 'c', user)).to.be.true;
				expect(updateTeam.called).to.be.false;
			});

			it('should save a team group with the team permission alone', async () => {
				givenRoom({ teamId: 'team-id' });
				grant('create-team-group', 'team-room-id');

				await saveRoomSettings(userId, rid, { roomType: 'p' });

				expect(savers.saveRoomType.calledOnceWith(rid, 'p', user)).to.be.true;
			});

			for (const { from, to, teamType } of [
				{ from: 'c', to: 'p', teamType: TeamType.PRIVATE },
				{ from: 'p', to: 'c', teamType: TeamType.PUBLIC },
			]) {
				it(`should change the team type with its main room to ${to}`, async () => {
					givenRoom({ t: from, teamId: 'team-id', teamMain: true });
					grant('create-c');
					grant('create-p');

					await saveRoomSettings(userId, rid, { roomType: to });

					expect(updateTeam.calledOnceWith(userId, 'team-id', { type: teamType, updateRoom: false })).to.be.true;
				});
			}

			it('should keep the team type when the main room could not change', async () => {
				givenRoom({ teamId: 'team-id', teamMain: true });
				grant('create-p');
				savers.saveRoomType.resolves(false);

				await saveRoomSettings(userId, rid, { roomType: 'p' });

				expect(updateTeam.called).to.be.false;
			});
		});
	});

	describe('room name', () => {
		for (const { t, teamType } of [
			{ t: 'c', teamType: TeamType.PUBLIC },
			{ t: 'p', teamType: TeamType.PRIVATE },
		]) {
			it(`should rename the team with its main room of type ${t}`, async () => {
				givenRoom({ t, teamId: 'team-id', teamMain: true });

				await saveRoomSettings(userId, rid, { roomName: 'new-name' });

				expect(updateTeam.calledOnceWith(userId, 'team-id', { type: teamType, name: 'new-name', updateRoom: false })).to.be.true;
			});
		}

		it('should not rename the team with one of its channels', async () => {
			givenRoom({ teamId: 'team-id' });

			await saveRoomSettings(userId, rid, { roomName: 'new-name' });

			expect(savers.saveRoomName.calledOnceWith(rid, 'new-name', user)).to.be.true;
			expect(updateTeam.called).to.be.false;
		});

		it('should keep the team name when the main room could not be renamed', async () => {
			givenRoom({ teamId: 'team-id', teamMain: true });
			savers.saveRoomName.resolves(false);

			await saveRoomSettings(userId, rid, { roomName: 'taken-name' });

			expect(updateTeam.called).to.be.false;
		});
	});

	describe('ABAC managed rooms', () => {
		beforeEach(() => {
			settingsGet.withArgs('ABAC_Enabled').returns(true);
			givenRoom({ t: 'p', abacAttributes });
		});

		for (const { setting, field, saver } of [
			{ setting: 'roomTopic', field: 'topic', saver: roomWrites.setTopicById },
			{ setting: 'roomAnnouncement', field: 'announcement', saver: roomWrites.setAnnouncementById },
			{ setting: 'roomDescription', field: 'description', saver: roomWrites.setDescriptionById },
		]) {
			it(`should refuse a new ${setting}`, async () => {
				givenRoom({ t: 'p', abacAttributes, [field]: 'current' });

				await expectRefused({ [setting]: 'new' });
			});

			it(`should refuse clearing ${setting}`, async () => {
				givenRoom({ t: 'p', abacAttributes, [field]: 'current' });

				await expectRefused({ [setting]: '' });
			});

			it(`should refuse adding ${setting} to a room without one`, async () => {
				await expectRefused({ [setting]: 'new' });
			});

			it(`should accept the current ${setting}`, async () => {
				givenRoom({ t: 'p', abacAttributes, [field]: 'current' });

				expect(await saveRoomSettings(userId, rid, { [setting]: 'current' })).to.deep.equal({ result: true, rid });

				expect(saver.called).to.be.false;
			});

			it(`should accept an empty ${setting} on a room without one`, async () => {
				expect(await saveRoomSettings(userId, rid, { [setting]: '' })).to.deep.equal({ result: true, rid });
			});
		}
	});
});
