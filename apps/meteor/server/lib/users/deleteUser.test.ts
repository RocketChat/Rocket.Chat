import { describe, it, before, beforeEach } from 'node:test';

import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const { services: _services, ...userWithoutServices } = {
	_id: 'user-id',
	username: 'jane',
	name: 'Jane Doe',
	emails: [{ address: 'jane@example.com', verified: true }],
	roles: ['user'],
	createdAt: new Date('2026-01-01T00:00:00Z'),
	customFields: { team: 'support' },
	services: { password: { bcrypt: 'hash' }, resume: { loginTokens: [{ hashedToken: 'token' }] } },
};
const storedUser = { ...userWithoutServices, services: _services };
const admin = { _id: 'admin-id', username: 'admin', roles: ['admin'] };

const usersFindOneById = sinon.stub();
const triggerEvent = sinon.stub();

const { deleteUser } = proxyquire.noCallThru().load('./deleteUser', {
	'@rocket.chat/apps': { Apps: { self: { triggerEvent } }, AppEvents: { IPostUserDeleted: 'IPostUserDeleted' } },
	'@rocket.chat/core-services': { api: { broadcast: sinon.stub() }, ClientSafeError: Error },
	'./getUserSingleOwnedRooms': { getUserSingleOwnedRooms: sinon.stub() },
	'../../settings': { settings: { get: sinon.stub().returns('Keep') } },
	'../callbacks': { callbacks: { run: sinon.stub() } },
	'../i18n': { i18n: { t: sinon.stub() } },
	'../media/file-upload': { FileUpload: { getStore: sinon.stub() } },
	'../notifyListener': {
		notifyOnRoomChangedById: sinon.stub(),
		notifyOnIntegrationChangedByUserId: sinon.stub(),
		notifyOnLivechatDepartmentAgentChanged: sinon.stub(),
		notifyOnUserChange: sinon.stub(),
	},
	'../rooms/getRoomsWithSingleOwner': {
		getSubscribedRoomsForUserWithDetails: sinon.stub().resolves([]),
		shouldRemoveOrChangeOwner: sinon.stub().returns(false),
	},
	'../rooms/relinquishRoomOwnerships': { relinquishRoomOwnerships: sinon.stub().resolves([]) },
	'../rooms/updateGroupDMsName': { updateGroupDMsName: sinon.stub() },
});

describe('deleteUser', () => {
	before(() => {
		mockModel('Users', { findOneById: usersFindOneById, removeById: sinon.stub() });
		mockModel('Rooms', { updateGroupDMsRemovingUsernamesByUsername: sinon.stub(), removeDirectRoomContainingUsername: sinon.stub() });
		mockModel('Subscriptions', { removeByUserId: sinon.stub() });
		mockModel('LivechatVisitors', { removeContactManagerByUsername: sinon.stub() });
		mockModel('Integrations', { disableByUserId: sinon.stub() });
	});

	beforeEach(() => {
		usersFindOneById.reset();
		triggerEvent.reset();
		// Applies the projection the way MongoDB would
		usersFindOneById.callsFake(async (id: string, options?: { projection?: Record<string, 0 | 1> }) => {
			const doc = { [storedUser._id]: storedUser, [admin._id]: admin }[id];
			const projection = options?.projection;
			if (!doc || !projection) {
				return doc;
			}
			const isExclusion = Object.values(projection).every((value) => value === 0);
			return Object.fromEntries(
				Object.entries(doc).filter(([key]) => (isExclusion ? projection[key] !== 0 : key === '_id' || projection[key] === 1)),
			);
		});
	});

	it('should send the full user, without services, to the IPostUserDeleted event when an admin deletes the user', async () => {
		await deleteUser('user-id', false, 'admin-id');

		expect(triggerEvent.calledOnce).to.be.true;
		const [event, payload] = triggerEvent.firstCall.args;
		expect(event).to.equal('IPostUserDeleted');
		expect(payload.user).to.deep.equal(userWithoutServices);
		expect(payload.performedBy).to.deep.equal(admin);
	});
});
