import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const loader = proxyquire.noCallThru();
const hasPermissionAsync = sinon.stub();
const canAccessRoomAsync = sinon.stub();
const invites = {
	findInvitesForManagement: sinon.stub(),
	findOneByUserRoomMaxUsesAndExpiration: sinon.stub(),
	findOneByInviteToken: sinon.stub(),
	insertOne: sinon.stub(),
	removeById: sinon.stub(),
};
const rooms = { findByIds: sinon.stub(), findOneById: sinon.stub() };
const subscriptions = { findOneByRoomIdAndUserId: sinon.stub() };
const settings = { get: sinon.stub() };
const allowMemberAction = sinon.stub();
const broadcast = sinon.stub();
const dependencies = {
	'@rocket.chat/models': { Invites: invites, Rooms: rooms, Subscriptions: subscriptions },
	'@rocket.chat/core-services': { api: { broadcast } },
	'meteor/meteor': { Meteor: { Error } },
	'../../authorization/hasPermission': { hasPermissionAsync },
	'../../authorization/canAccessRoom': { canAccessRoomAsync },
	'../../../settings': { settings },
	'../../utils/getURL': { getURL: (path: string) => `https://chat.example/${path}` },
	'../roomCoordinator': { roomCoordinator: { getRoomDirectives: () => ({ allowMemberAction }) } },
};
const root = '../../../../../../server/lib/rooms/invites';
const { listInvites } = loader.load(`${root}/listInvites`, dependencies);
const { removeInvite } = loader.load(`${root}/removeInvite`, dependencies);
const { findOrCreateInvite } = loader.load(`${root}/findOrCreateInvite`, dependencies);
const { validateInviteToken } = loader.load(`${root}/validateInviteToken`, dependencies);

const invite = {
	_id: 'record-id',
	inviteToken: 'secret-token',
	rid: 'private-room',
	userId: 'creator',
	createdAt: new Date('2026-01-01'),
	_updatedAt: new Date('2026-01-01'),
	expires: null,
	days: 0,
	maxUses: 5,
	uses: 1,
	url: 'https://chat.example/invite/secret-token',
};

describe('Invite authorization and token protection', () => {
	beforeEach(() => {
		sinon.reset();
		hasPermissionAsync.callsFake(async (_userId: string, permission: string) => permission === 'create-invite-links');
		canAccessRoomAsync.resolves(true);
		allowMemberAction.resolves(true);
		subscriptions.findOneByRoomIdAndUserId.resolves({ _id: 'subscription' });
		rooms.findOneById.resolves({ _id: invite.rid, t: 'p' });
		rooms.findByIds.returns({ toArray: async () => [{ _id: invite.rid, name: 'Private room' }] });
		invites.findInvitesForManagement.returns({ toArray: async () => [invite] });
		invites.findOneByUserRoomMaxUsesAndExpiration.resolves(null);
		invites.removeById.resolves({ deletedCount: 1 });
	});

	it('does not let an invite creator list private-room metadata', async () => {
		await expect(listInvites('creator')).to.be.rejectedWith('not_authorized');
		expect(invites.findInvitesForManagement.called).to.equal(false);
		expect(rooms.findByIds.called).to.equal(false);
	});

	it('does not let an invite creator delete an invite by its record ID', async () => {
		await expect(removeInvite('creator', { _id: invite._id })).to.be.rejectedWith('not_authorized');
		expect(invites.removeById.called).to.equal(false);
	});

	it('lets a global manager list metadata without joining the room or receiving credentials', async () => {
		hasPermissionAsync.callsFake(async (_userId: string, permission: string) => permission === 'manage-invite-links');
		const result = await listInvites('manager');

		expect(result).to.deep.equal([
			{
				_id: invite._id,
				_updatedAt: invite._updatedAt,
				rid: invite.rid,
				userId: invite.userId,
				createdAt: invite.createdAt,
				expires: null,
				days: 0,
				maxUses: 5,
				uses: 1,
				roomName: 'Private room',
			},
		]);
		expect(JSON.stringify(result)).not.to.contain(invite.inviteToken);
		expect(subscriptions.findOneByRoomIdAndUserId.called).to.equal(false);
	});

	it('lets a global manager revoke an invite without joining its room', async () => {
		hasPermissionAsync.callsFake(async (_userId: string, permission: string) => permission === 'manage-invite-links');
		expect(await removeInvite('manager', { _id: invite._id })).to.equal(true);
		expect(subscriptions.findOneByRoomIdAndUserId.called).to.equal(false);
	});

	it('does not give a global manager invite-creation permission', async () => {
		hasPermissionAsync.callsFake(async (_userId: string, permission: string) => permission === 'manage-invite-links');
		await expect(findOrCreateInvite('manager', { rid: invite.rid, days: 0, maxUses: 5 })).to.be.rejectedWith('not_authorized');
		expect(invites.insertOne.called).to.equal(false);
	});

	it('requires room membership even when create-invite-links is granted globally', async () => {
		subscriptions.findOneByRoomIdAndUserId.resolves(null);
		await expect(findOrCreateInvite('creator', { rid: invite.rid, days: 0, maxUses: 5 })).to.be.rejectedWith('error-invalid-room');
		expect(invites.findOneByUserRoomMaxUsesAndExpiration.called).to.equal(false);
	});

	it('does not return an existing token when room access has been revoked', async () => {
		canAccessRoomAsync.resolves(false);
		invites.findOneByUserRoomMaxUsesAndExpiration.resolves(invite);
		await expect(findOrCreateInvite('creator', { rid: invite.rid, days: 0, maxUses: 5 })).to.be.rejectedWith('not_authorized');
		expect(invites.findOneByUserRoomMaxUsesAndExpiration.called).to.equal(false);
	});

	it('does not allow a banned member to create an invite', async () => {
		subscriptions.findOneByRoomIdAndUserId.resolves({ _id: 'subscription', status: 'BANNED' });
		await expect(findOrCreateInvite('creator', { rid: invite.rid, days: 0, maxUses: 5 })).to.be.rejectedWith('error-user-is-banned');
		expect(invites.insertOne.called).to.equal(false);
	});

	it('returns a separate UUID token to an authorized room member', async () => {
		const result = await findOrCreateInvite('creator', { rid: invite.rid, days: 0, maxUses: 5 });
		expect(result.inviteToken).to.match(/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i);
		expect(result.inviteToken).not.to.equal(result._id);
		expect(result.url).to.equal(`https://chat.example/invite/${result.inviteToken}`);
		expect(hasPermissionAsync.calledWith('creator', 'create-invite-links', invite.rid)).to.equal(true);
	});

	it('keeps a migrated URL token valid until its recorded expiry', async () => {
		invites.findOneByInviteToken
			.withArgs('old-id')
			.resolves({ ...invite, inviteToken: 'old-id', legacy: true, expires: new Date(Date.now() + 1000) });
		const result = await validateInviteToken('old-id');
		expect(result.inviteData._id).to.equal(invite._id);
	});

	it('rejects a migrated URL token at expiry', async () => {
		invites.findOneByInviteToken.resolves({ ...invite, legacy: true, expires: new Date(Date.now() - 1000) });
		await expect(validateInviteToken('old-id')).to.be.rejectedWith('error-invite-expired');
	});

	it('does not accept a record ID as a fallback token', async () => {
		invites.findOneByInviteToken.resolves(null);
		await expect(validateInviteToken(invite._id)).to.be.rejectedWith('error-invalid-token');
	});

	it('retains usage and ABAC restrictions for migrated tokens', async () => {
		invites.findOneByInviteToken.resolves({ ...invite, legacy: true, uses: 5 });
		await expect(validateInviteToken('old-id')).to.be.rejectedWith('error-invite-expired');

		invites.findOneByInviteToken.resolves({ ...invite, legacy: true });
		settings.get.withArgs('ABAC_Enabled').returns(true);
		rooms.findOneById.resolves({ _id: invite.rid, t: 'p', abacAttributes: [{ key: 'department', values: ['private'] }] });
		await expect(validateInviteToken('old-id')).to.be.rejectedWith('error-invalid-room');
	});
});
