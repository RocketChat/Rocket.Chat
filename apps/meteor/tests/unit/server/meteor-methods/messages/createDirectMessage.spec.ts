import { MeteorError } from '@rocket.chat/core-services';
import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import p from 'proxyquire';
import sinon from 'sinon';

const sandbox = sinon.createSandbox();

const createRoomMock = sandbox.stub();
const hasPermissionMock = sandbox.stub();
const validateFederatedUsernameMock = sandbox.stub();
const settingsGetMock = sandbox.stub();

const modelsMock = {
	Users: {
		findOneById: sandbox.stub(),
		findOneByUsernameIgnoringCase: sandbox.stub(),
	},
	Rooms: {
		findOneDirectRoomContainingAllUserIDs: sandbox.stub(),
	},
};

const { createDirectMessage } = p.noCallThru().load('../../../../../server/meteor-methods/messages/createDirectMessage', {
	'meteor/meteor': {
		Meteor: {
			userId: sandbox.stub(),
			Error: MeteorError,
			methods: sandbox.stub(),
		},
	},
	'meteor/check': {
		check: sandbox.stub(),
		Match: { Optional: sandbox.stub() },
	},
	'@rocket.chat/models': modelsMock,
	'@rocket.chat/federation-matrix': { validateFederatedUsername: validateFederatedUsernameMock },
	'../../lib/RateLimiter': { RateLimiterClass: { limitMethod: sandbox.stub() } },
	'../../lib/authorization/hasPermission': { hasPermissionAsync: hasPermissionMock },
	'../../lib/callbacks': { callbacks: { run: sandbox.stub() } },
	'../../lib/rooms/createRoom': { createRoom: createRoomMock },
	'../../settings': { settings: { get: settingsGetMock } },
});

const me = { _id: 'me', username: 'me' };
const other = { _id: 'other', username: 'Other' };

describe('createDirectMessage', () => {
	beforeEach(() => {
		sandbox.reset();
		modelsMock.Users.findOneById.resolves(me);
		hasPermissionMock.resolves(true);
		validateFederatedUsernameMock.returns(false);
		settingsGetMock.withArgs('DirectMesssage_maxUsers').returns(8);
		createRoomMock.resolves({ _id: 'rid', inserted: true });
	});

	it('should reject an oversized member list before resolving any username', async () => {
		const targets = Array.from({ length: 9 }, (_, i) => `user${i}`);

		await expect(createDirectMessage(targets, me._id)).to.be.rejectedWith('You cannot add more than 8 users');
		expect(modelsMock.Users.findOneByUsernameIgnoringCase.called).to.be.false;
	});

	it('should reject a username that does not exist', async () => {
		modelsMock.Users.findOneByUsernameIgnoringCase.resolves(null);

		await expect(createDirectMessage(['ghost'], me._id)).to.be.rejectedWith('Invalid user');
		expect(createRoomMock.called).to.be.false;
	});

	it('should reject when only some of the usernames exist', async () => {
		modelsMock.Users.findOneByUsernameIgnoringCase.withArgs('Other').resolves(other);
		modelsMock.Users.findOneByUsernameIgnoringCase.withArgs('ghost').resolves(null);

		await expect(createDirectMessage(['Other', 'ghost'], me._id)).to.be.rejectedWith('Invalid user');
		expect(createRoomMock.called).to.be.false;
	});

	it('should resolve members ignoring the username case', async () => {
		modelsMock.Users.findOneByUsernameIgnoringCase.resolves(other);

		await createDirectMessage(['OTHER'], me._id);

		expect(createRoomMock.firstCall.args[3]).to.deep.equal([me, other]);
	});

	it('should return the existing room to a user who may only view direct messages', async () => {
		modelsMock.Users.findOneByUsernameIgnoringCase.resolves(other);
		hasPermissionMock.withArgs(me._id, 'create-d').resolves(false);
		hasPermissionMock.withArgs(me._id, 'view-d-room').resolves(true);
		modelsMock.Rooms.findOneDirectRoomContainingAllUserIDs.resolves({ _id: 'existing' });

		const room = await createDirectMessage([other.username], me._id);

		expect(room).to.include({ rid: 'existing', t: 'd' });
		expect(modelsMock.Rooms.findOneDirectRoomContainingAllUserIDs.firstCall.args[0]).to.deep.equal(['me', 'other'].sort());
	});

	it('should keep an unresolved federated username as a member', async () => {
		modelsMock.Users.findOneByUsernameIgnoringCase.resolves(null);
		validateFederatedUsernameMock.returns(true);

		await createDirectMessage(['@remote:server.com'], me._id);

		expect(createRoomMock.firstCall.args[3]).to.deep.equal([me, '@remote:server.com']);
	});
});
