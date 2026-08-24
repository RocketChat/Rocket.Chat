import { MeteorError } from '@rocket.chat/core-services';
import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import p from 'proxyquire';
import sinon from 'sinon';

const checkMock = sinon.stub();
const meteorUserIdMock = sinon.stub();
const meteorMethodsMock = sinon.stub();
const canAccessRoomIdMock = sinon.stub();
const normalizeMessagesForUserMock = sinon.stub();
const settingsGetMock = sinon.stub();

// the method pushes into the array it gets back, so each call needs a fresh one
const emptyCursor = () => ({ toArray: async () => [] });

const modelsMock = {
	Messages: {
		findOneById: sinon.stub(),
		findVisibleByRoomIdBeforeTimestamp: sinon.stub().callsFake(emptyCursor),
		findVisibleByRoomIdAfterTimestamp: sinon.stub().callsFake(emptyCursor),
	},
};

p.noCallThru().load('../../../../../server/meteor-methods/messages/loadSurroundingMessages', {
	'meteor/meteor': {
		Meteor: {
			userId: meteorUserIdMock,
			Error: MeteorError,
			methods: meteorMethodsMock,
		},
	},
	'meteor/check': {
		check: checkMock,
	},
	'@rocket.chat/models': modelsMock,
	'../../lib/authorization/canAccessRoom': {
		canAccessRoomIdAsync: canAccessRoomIdMock,
	},
	'../../lib/utils/lib/normalizeMessagesForUser': {
		normalizeMessagesForUser: normalizeMessagesForUserMock,
	},
	'../../settings': {
		settings: { get: settingsGetMock },
	},
});

const loadSurroundingMessagesMethod = meteorMethodsMock.firstCall.args[0].loadSurroundingMessages;

const mainMessage = { _id: 'msg123', rid: 'room123', ts: new Date('2024-01-01T00:00:00Z') };

describe('loadSurroundingMessages', () => {
	beforeEach(() => {
		checkMock.resetHistory();
		meteorUserIdMock.reset();
		canAccessRoomIdMock.reset();
		normalizeMessagesForUserMock.reset();
		settingsGetMock.reset();
		modelsMock.Messages.findOneById.reset();
	});

	it('should throw for an anonymous user when anonymous read is disabled', async () => {
		meteorUserIdMock.returns(null);
		settingsGetMock.withArgs('Accounts_AllowAnonymousRead').returns(false);

		await expect(loadSurroundingMessagesMethod({ _id: 'msg123', rid: 'room123' })).to.be.rejectedWith('Invalid user');
	});

	it('should load the surrounding messages for an anonymous user when anonymous read is enabled', async () => {
		meteorUserIdMock.returns(null);
		settingsGetMock.withArgs('Accounts_AllowAnonymousRead').returns(true);
		modelsMock.Messages.findOneById.resolves(mainMessage);
		canAccessRoomIdMock.resolves(true);

		const result = await loadSurroundingMessagesMethod({ _id: 'msg123', rid: 'room123' });

		expect(result).to.not.be.false;
		expect(result.messages).to.deep.equal([mainMessage]);
		expect(canAccessRoomIdMock.calledOnceWith('room123', undefined)).to.be.true;
		expect(normalizeMessagesForUserMock.called).to.be.false;
	});

	it('should not load the surrounding messages when the room is out of reach', async () => {
		meteorUserIdMock.returns(null);
		settingsGetMock.withArgs('Accounts_AllowAnonymousRead').returns(true);
		modelsMock.Messages.findOneById.resolves(mainMessage);
		canAccessRoomIdMock.resolves(false);

		expect(await loadSurroundingMessagesMethod({ _id: 'msg123', rid: 'room123' })).to.be.false;
	});

	it('should normalize the messages for a logged in user', async () => {
		meteorUserIdMock.returns('user123');
		modelsMock.Messages.findOneById.resolves(mainMessage);
		canAccessRoomIdMock.resolves(true);
		normalizeMessagesForUserMock.resolves([mainMessage]);

		await loadSurroundingMessagesMethod({ _id: 'msg123', rid: 'room123' });

		expect(settingsGetMock.called).to.be.false;
		expect(normalizeMessagesForUserMock.calledOnceWith([mainMessage], 'user123')).to.be.true;
	});
});
