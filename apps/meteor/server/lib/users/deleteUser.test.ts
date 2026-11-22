import { beforeEach, describe, it } from 'node:test';

import { ClientSafeError } from '@rocket.chat/core-services';
import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import sinon from 'sinon';

import { loadWithMocks } from '../../../tests/mocks/utils/loadWithMocks';

const settingsGet = sinon.stub();
const triggerEvent = sinon.stub();
const broadcast = sinon.stub();
const callbacksRun = sinon.stub();
const getUserSingleOwnedRooms = sinon.stub();
const getSubscribedRoomsForUserWithDetails = sinon.stub();
const shouldRemoveOrChangeOwner = sinon.stub();
const relinquishRoomOwnerships = sinon.stub();
const updateGroupDMsName = sinon.stub();
const notifyOnRoomChangedById = sinon.stub();
const notifyOnIntegrationChangedByUserId = sinon.stub();
const notifyOnLivechatDepartmentAgentChanged = sinon.stub();
const notifyOnUserChange = sinon.stub();
const getStore = sinon.stub();

const { deleteUser } = loadWithMocks('./deleteUser', {
	'@rocket.chat/apps': { Apps: { self: { triggerEvent } }, AppEvents: { IPostUserDeleted: 'IPostUserDeleted' } },
	'@rocket.chat/core-services': { api: { broadcast }, ClientSafeError },
	'./getUserSingleOwnedRooms': { getUserSingleOwnedRooms },
	'../../settings': { settings: { get: settingsGet } },
	'../callbacks': { callbacks: { run: callbacksRun } },
	'../i18n': { i18n: { t: (key: string) => `t:${key}` } },
	'../media/file-upload': { FileUpload: { getStore } },
	'../notifyListener': {
		notifyOnRoomChangedById,
		notifyOnIntegrationChangedByUserId,
		notifyOnLivechatDepartmentAgentChanged,
		notifyOnUserChange,
	},
	'../rooms/getRoomsWithSingleOwner': { getSubscribedRoomsForUserWithDetails, shouldRemoveOrChangeOwner },
	'../rooms/relinquishRoomOwnerships': { relinquishRoomOwnerships },
	'../rooms/updateGroupDMsName': { updateGroupDMsName },
});

describe('deleteUser', () => {
	let Users: Record<string, sinon.SinonStub>;
	let Messages: Record<string, sinon.SinonStub>;
	let ReadReceipts: Record<string, sinon.SinonStub>;
	let ReadReceiptsArchive: Record<string, sinon.SinonStub>;
	let ModerationReports: Record<string, sinon.SinonStub>;
	let Rooms: Record<string, sinon.SinonStub>;
	let Subscriptions: Record<string, sinon.SinonStub>;
	let LivechatDepartmentAgents: Record<string, sinon.SinonStub>;
	let LivechatUnitMonitors: Record<string, sinon.SinonStub>;
	let LivechatVisitors: Record<string, sinon.SinonStub>;
	let Integrations: Record<string, sinon.SinonStub>;
	let uploadsStore: Record<string, sinon.SinonStub>;
	let avatarsStore: Record<string, sinon.SinonStub>;

	const user = { _id: 'uid', username: 'jane', roles: ['user'], avatarOrigin: 'local' };
	const rocketCat = { _id: 'rocket.cat', username: 'rocket.cat' };
	const subscribedRooms = [{ rid: 'r1' }, { rid: 'r2' }];

	beforeEach(() => {
		Users = {
			findOneById: sinon.stub().resolves(user),
			removeById: sinon.stub(),
		};
		Messages = { findFilesByUserId: sinon.stub().returns([]), removeByUserId: sinon.stub(), unlinkUserId: sinon.stub() };
		ReadReceipts = { removeByUserId: sinon.stub() };
		ReadReceiptsArchive = { removeByUserId: sinon.stub() };
		ModerationReports = { hideMessageReportsByUserId: sinon.stub() };
		Rooms = { updateGroupDMsRemovingUsernamesByUsername: sinon.stub(), removeDirectRoomContainingUsername: sinon.stub() };
		Subscriptions = { removeByUserId: sinon.stub() };
		LivechatDepartmentAgents = {
			findByAgentId: sinon.stub().returns({
				toArray: async () => [
					{ _id: 'da1', departmentId: 'd1' },
					{ _id: 'da2', departmentId: 'd2' },
				],
			}),
			removeByAgentId: sinon.stub().resolves({ deletedCount: 2 }),
		};
		LivechatUnitMonitors = { removeByMonitorId: sinon.stub() };
		LivechatVisitors = { removeContactManagerByUsername: sinon.stub() };
		Integrations = { disableByUserId: sinon.stub() };
		Users.findOneById.withArgs('rocket.cat').resolves(rocketCat);
		Users.findOneById.withArgs('admin').resolves({ _id: 'admin' });
		mockModel('Users', Users);
		mockModel('Messages', Messages);
		mockModel('ReadReceipts', ReadReceipts);
		mockModel('ReadReceiptsArchive', ReadReceiptsArchive);
		mockModel('ModerationReports', ModerationReports);
		mockModel('Rooms', Rooms);
		mockModel('Subscriptions', Subscriptions);
		mockModel('LivechatDepartmentAgents', LivechatDepartmentAgents);
		mockModel('LivechatUnitMonitors', LivechatUnitMonitors);
		mockModel('LivechatVisitors', LivechatVisitors);
		mockModel('Integrations', Integrations);

		uploadsStore = { deleteById: sinon.stub() };
		avatarsStore = { deleteByName: sinon.stub() };
		[
			settingsGet,
			triggerEvent,
			broadcast,
			callbacksRun,
			getUserSingleOwnedRooms,
			getSubscribedRoomsForUserWithDetails,
			shouldRemoveOrChangeOwner,
			relinquishRoomOwnerships,
			updateGroupDMsName,
			notifyOnRoomChangedById,
			notifyOnIntegrationChangedByUserId,
			notifyOnLivechatDepartmentAgentChanged,
			notifyOnUserChange,
			getStore,
		].forEach((stub) => stub.reset());
		getStore.withArgs('Uploads').returns(uploadsStore);
		getStore.withArgs('Avatars').returns(avatarsStore);
		getSubscribedRoomsForUserWithDetails.resolves(subscribedRooms);
		shouldRemoveOrChangeOwner.returns(false);
		relinquishRoomOwnerships.resolves(['r1']);
		settingsGet.withArgs('Message_ErasureType').returns('Keep');
	});

	it('refuses to delete rocket.cat before reading anything', async () => {
		await expect(deleteUser('rocket.cat')).to.be.rejectedWith('Deleting the rocket.cat user is not allowed [error-action-not-allowed]');
		expect(Users.findOneById.called).to.be.false;
	});

	it('returns no deleted rooms and removes nothing when the user does not exist', async () => {
		Users.findOneById.resolves(null);

		expect(await deleteUser('uid')).to.deep.equal({ deletedRooms: [] });
		expect(Users.findOneById.calledOnceWith('uid', { projection: { services: 0 } })).to.be.true;
		expect(Users.removeById.called).to.be.false;
		expect(callbacksRun.called).to.be.false;
	});

	it('refuses to delete a federated user', async () => {
		Users.findOneById.resolves({ ...user, federated: true });

		await expect(deleteUser('uid')).to.be.rejectedWith('[error-not-allowed]');
		expect(Users.removeById.called).to.be.false;
	});

	it('throws user-last-owner with the single-owned rooms when ownership is not relinquished', async () => {
		shouldRemoveOrChangeOwner.returns(true);
		getUserSingleOwnedRooms.resolves({ shouldBeRemoved: ['r1'], shouldChangeOwner: [] });

		const error = await deleteUser('uid').catch((e: ClientSafeError) => e);

		expect(error).to.be.instanceOf(ClientSafeError);
		expect(error.error).to.equal('user-last-owner');
		expect(error.details).to.deep.equal({ shouldBeRemoved: ['r1'], shouldChangeOwner: [] });
		expect(shouldRemoveOrChangeOwner.calledOnceWith(subscribedRooms)).to.be.true;
		expect(getUserSingleOwnedRooms.calledOnceWith(subscribedRooms)).to.be.true;
		expect(relinquishRoomOwnerships.called).to.be.false;
		expect(Users.removeById.called).to.be.false;
	});

	it('relinquishes ownership when confirmed and returns the deleted rooms', async () => {
		shouldRemoveOrChangeOwner.returns(true);

		expect(await deleteUser('uid', true)).to.deep.equal({ deletedRooms: ['r1'] });
		expect(getUserSingleOwnedRooms.called).to.be.false;
		expect(relinquishRoomOwnerships.calledOnceWith('uid', subscribedRooms, true)).to.be.true;
	});

	it('only removes the user document when the user has no username', async () => {
		Users.findOneById.resolves({ _id: 'uid', roles: ['livechat-agent'] });

		expect(await deleteUser('uid')).to.deep.equal({ deletedRooms: [] });
		expect(relinquishRoomOwnerships.called).to.be.false;
		expect(Subscriptions.removeByUserId.called).to.be.false;
		expect(Integrations.disableByUserId.called).to.be.false;
		expect(Users.removeById.calledOnceWith('uid')).to.be.true;
		expect(updateGroupDMsName.calledOnceWith({ _id: 'uid', roles: ['livechat-agent'] })).to.be.true;
		expect(notifyOnUserChange.calledOnceWith({ clientAction: 'removed', id: 'uid' })).to.be.true;
		expect(callbacksRun.calledOnceWith('afterDeleteUser', { _id: 'uid', roles: ['livechat-agent'] })).to.be.true;
	});

	describe('with Message_ErasureType "Delete"', () => {
		beforeEach(() => {
			settingsGet.withArgs('Message_ErasureType').returns('Delete');
		});

		it('deletes every file once, including a main file missing from the files list, then the messages, receipts and reports in order', async () => {
			Messages.findFilesByUserId.returns([
				{ file: { _id: 'f1' }, files: [{ _id: 'f1' }, { _id: 'f2' }, { _id: '' }] },
				{ file: { _id: 'f3' } },
				{ files: [{ _id: 'f4' }] },
				{},
			]);

			await deleteUser('uid', false, 'admin');

			expect(Messages.findFilesByUserId.calledOnceWith('uid')).to.be.true;
			expect(uploadsStore.deleteById.args).to.deep.equal([['f1'], ['f2'], ['f3'], ['f4']]);
			expect(Messages.removeByUserId.calledOnceWith('uid')).to.be.true;
			expect(ReadReceipts.removeByUserId.calledOnceWith('uid')).to.be.true;
			expect(ReadReceiptsArchive.removeByUserId.calledOnceWith('uid')).to.be.true;
			expect(ModerationReports.hideMessageReportsByUserId.calledOnceWith('uid', 'admin', 'user account deleted', 'DELETE_USER')).to.be.true;
			sinon.assert.callOrder(
				uploadsStore.deleteById,
				Messages.removeByUserId,
				ReadReceipts.removeByUserId,
				ReadReceiptsArchive.removeByUserId,
				ModerationReports.hideMessageReportsByUserId,
				Rooms.updateGroupDMsRemovingUsernamesByUsername,
			);
		});

		it('hides reports as deleted by the user itself when no deleter is given', async () => {
			await deleteUser('uid');

			expect(ModerationReports.hideMessageReportsByUserId.calledOnceWith('uid', 'uid', 'user account deleted', 'DELETE_USER')).to.be.true;
		});

		it('hides reports with the own-account reason when the user deletes itself', async () => {
			await deleteUser('uid', false, 'uid');

			expect(ModerationReports.hideMessageReportsByUserId.calledOnceWith('uid', 'uid', 'user deleted own account', 'DELETE_USER')).to.be
				.true;
		});

		it('broadcasts user.deleted with the erasure type and does not unlink messages', async () => {
			await deleteUser('uid');

			expect(Messages.unlinkUserId.called).to.be.false;
			expect(broadcast.calledOnceWith('user.deleted', user, { messageErasureType: 'Delete' })).to.be.true;
		});
	});

	describe('with Message_ErasureType "Unlink"', () => {
		beforeEach(() => {
			settingsGet.withArgs('Message_ErasureType').returns('Unlink');
		});

		it('reassigns messages to rocket.cat and broadcasts the replacement user', async () => {
			await deleteUser('uid');

			expect(Messages.unlinkUserId.calledOnceWith('uid', 'rocket.cat', 'rocket.cat', 't:Removed_User')).to.be.true;
			expect(Messages.removeByUserId.called).to.be.false;
			expect(
				broadcast.calledOnceWith('user.deleted', user, {
					messageErasureType: 'Unlink',
					replaceByUser: { _id: 'rocket.cat', username: 'rocket.cat', alias: 't:Removed_User' },
				}),
			).to.be.true;
		});

		it('skips unlinking but still deletes the user and broadcasts the replacement when rocket.cat has no username', async () => {
			Users.findOneById.withArgs('rocket.cat').resolves({ _id: 'rocket.cat' });

			await deleteUser('uid');

			expect(Messages.unlinkUserId.called).to.be.false;
			expect(
				broadcast.calledOnceWith('user.deleted', user, {
					messageErasureType: 'Unlink',
					replaceByUser: { _id: 'rocket.cat', username: undefined, alias: 't:Removed_User' },
				}),
			).to.be.true;
			expect(Subscriptions.removeByUserId.calledOnceWith('uid')).to.be.true;
			expect(Users.removeById.calledOnceWith('uid')).to.be.true;
		});
	});

	it('keeps messages and does not broadcast with Message_ErasureType "Keep"', async () => {
		await deleteUser('uid');

		expect(Messages.removeByUserId.called).to.be.false;
		expect(Messages.unlinkUserId.called).to.be.false;
		expect(broadcast.called).to.be.false;
	});

	it('removes direct rooms, subscriptions, contact manager and integrations, notifying the affected rooms', async () => {
		await deleteUser('uid');

		expect(Rooms.updateGroupDMsRemovingUsernamesByUsername.calledOnceWith('jane', 'uid')).to.be.true;
		expect(Rooms.removeDirectRoomContainingUsername.calledOnceWith('jane')).to.be.true;
		expect(notifyOnRoomChangedById.calledOnceWith(['r1', 'r2'])).to.be.true;
		expect(Subscriptions.removeByUserId.calledOnceWith('uid')).to.be.true;
		expect(LivechatVisitors.removeContactManagerByUsername.calledOnceWith('jane')).to.be.true;
		expect(Integrations.disableByUserId.calledOnceWith('uid')).to.be.true;
		expect(notifyOnIntegrationChangedByUserId.calledOnceWith('uid')).to.be.true;
		expect(LivechatDepartmentAgents.removeByAgentId.called).to.be.false;
		expect(LivechatUnitMonitors.removeByMonitorId.called).to.be.false;
		expect(avatarsStore.deleteByName.called).to.be.false;
		sinon.assert.callOrder(
			relinquishRoomOwnerships,
			Rooms.updateGroupDMsRemovingUsernamesByUsername,
			Rooms.removeDirectRoomContainingUsername,
			Subscriptions.removeByUserId,
			LivechatVisitors.removeContactManagerByUsername,
			Integrations.disableByUserId,
			Users.removeById,
			updateGroupDMsName,
			callbacksRun,
		);
	});

	it('removes a livechat agent from its departments and notifies each removal', async () => {
		Users.findOneById.resolves({ ...user, roles: ['livechat-agent'] });

		await deleteUser('uid');

		expect(LivechatDepartmentAgents.findByAgentId.calledOnceWith('uid')).to.be.true;
		expect(LivechatDepartmentAgents.removeByAgentId.calledOnceWith('uid')).to.be.true;
		expect(notifyOnLivechatDepartmentAgentChanged.args).to.deep.equal([
			[{ _id: 'da1', agentId: 'uid', departmentId: 'd1' }, 'removed'],
			[{ _id: 'da2', agentId: 'uid', departmentId: 'd2' }, 'removed'],
		]);
	});

	it('does not notify department changes when no agent link was removed', async () => {
		Users.findOneById.resolves({ ...user, roles: ['livechat-agent'] });
		LivechatDepartmentAgents.removeByAgentId.resolves({ deletedCount: 0 });

		await deleteUser('uid');

		expect(notifyOnLivechatDepartmentAgentChanged.called).to.be.false;
	});

	it('removes a livechat monitor from its units', async () => {
		Users.findOneById.resolves({ ...user, roles: ['livechat-monitor'] });

		await deleteUser('uid');

		expect(LivechatUnitMonitors.removeByMonitorId.calledOnceWith('uid')).to.be.true;
	});

	['upload', 'url', 'rest'].forEach((avatarOrigin) => {
		it(`deletes the stored avatar when its origin is "${avatarOrigin}"`, async () => {
			Users.findOneById.resolves({ ...user, avatarOrigin });

			await deleteUser('uid');

			expect(avatarsStore.deleteByName.calledOnceWith('jane')).to.be.true;
		});
	});

	it('triggers IPostUserDeleted with the deleter when one is given', async () => {
		await deleteUser('uid', false, 'admin');

		expect(triggerEvent.calledOnceWith('IPostUserDeleted', { user, performedBy: { _id: 'admin' } })).to.be.true;
	});

	it('does not trigger IPostUserDeleted without a deleter', async () => {
		await deleteUser('uid');

		expect(triggerEvent.called).to.be.false;
	});
});
