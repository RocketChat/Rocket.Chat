import { expect } from 'chai';
import p from 'proxyquire';
import sinon from 'sinon';

const modelsMock = {
	LivechatRooms: {
		findOneById: sinon.stub(),
	},
	Messages: {
		findLivechatClosingMessage: sinon.stub(),
		findVisibleByRoomIdNotContainingTypesBeforeTs: sinon.stub(),
	},
	Users: {
		findOneById: sinon.stub(),
	},
};

const checkMock = sinon.stub();

const mockLogger = class {
	debug() {
		return null;
	}

	error() {
		return null;
	}

	warn() {
		return null;
	}

	info() {
		return null;
	}
};

const mockSettingValues: Record<string, any> = {
	Livechat_show_agent_info: true,
	Language: 'en',
	From_Email: 'test@rocket.chat',
};

const settingsMock = function (key: string) {
	return mockSettingValues[key] || null;
};

const getTimezoneMock = sinon.stub();

const mailerMock = sinon.stub();

const tStub = sinon.stub();

const { sendTranscript } = p.noCallThru().load('../../../../../../app/livechat/server/lib/sendTranscript', {
	'@rocket.chat/models': modelsMock,
	'@rocket.chat/logger': { Logger: mockLogger },
	'meteor/check': { check: checkMock },
	'../../../../lib/callbacks': {
		callbacks: {
			run: sinon.stub(),
		},
	},
	'../../../../server/lib/i18n': { i18n: { t: tStub } },
	'../../../mailer/server/api': { send: mailerMock },
	'../../../settings/server': { settings: { get: settingsMock } },
	'../../../utils/server/lib/getTimezone': { getTimezone: getTimezoneMock },
	// TODO: add tests for file handling on transcripts
	'../../../file-upload/server': { FileUpload: {} },
});

describe('Send transcript', () => {
	beforeEach(() => {
		checkMock.reset();
		modelsMock.LivechatRooms.findOneById.reset();
		modelsMock.Messages.findLivechatClosingMessage.reset();
		modelsMock.Messages.findVisibleByRoomIdNotContainingTypesBeforeTs.reset();
		modelsMock.Users.findOneById.reset();
		mailerMock.reset();
		tStub.reset();
	});
	it('should throw error when rid or email are invalid params', async () => {
		checkMock.throws(new Error('Invalid params'));
		await expect(sendTranscript({})).to.be.rejectedWith(Error);
	});
	it('should throw error when visitor not found', async () => {
		await expect(sendTranscript({ rid: 'rid', email: 'email', logger: mockLogger })).to.be.rejectedWith(Error);
	});
	it('should attempt to send an email when params are valid using default subject', async () => {
		modelsMock.LivechatRooms.findOneById.resolves({ t: 'l', v: { token: 'token' } });
		modelsMock.Messages.findVisibleByRoomIdNotContainingTypesBeforeTs.resolves([]);
		tStub.returns('Conversation Transcript');

		await sendTranscript({
			rid: 'rid',
			token: 'token',
			email: 'email',
			user: { _id: 'x', name: 'x', utcOffset: '-6', username: 'x' },
		});

		expect(getTimezoneMock.calledWith({ _id: 'x', name: 'x', utcOffset: '-6', username: 'x' })).to.be.true;
		expect(modelsMock.Messages.findLivechatClosingMessage.calledWith('rid', { projection: { ts: 1 } })).to.be.true;
		expect(modelsMock.Messages.findVisibleByRoomIdNotContainingTypesBeforeTs.called).to.be.true;
		expect(
			mailerMock.calledWith({
				to: 'email',
				from: 'test@rocket.chat',
				subject: 'Conversation Transcript',
				replyTo: 'test@rocket.chat',
				html: '<div> <hr></div>',
			}),
		).to.be.true;
	});
	it('should use provided subject', async () => {
		modelsMock.LivechatRooms.findOneById.resolves({ t: 'l', v: { token: 'token' } });
		modelsMock.Messages.findVisibleByRoomIdNotContainingTypesBeforeTs.resolves([]);

		await sendTranscript({
			rid: 'rid',
			token: 'token',
			email: 'email',
			subject: 'A custom subject',
			user: { _id: 'x', name: 'x', utcOffset: '-6', username: 'x' },
		});

		expect(getTimezoneMock.calledWith({ _id: 'x', name: 'x', utcOffset: '-6', username: 'x' })).to.be.true;
		expect(modelsMock.Messages.findLivechatClosingMessage.calledWith('rid', { projection: { ts: 1 } })).to.be.true;
		expect(modelsMock.Messages.findVisibleByRoomIdNotContainingTypesBeforeTs.called).to.be.true;
		expect(
			mailerMock.calledWith({
				to: 'email',
				from: 'test@rocket.chat',
				subject: 'A custom subject',
				replyTo: 'test@rocket.chat',
				html: '<div> <hr></div>',
			}),
		).to.be.true;
	});
	it('should use subject from setting (when configured) when no subject provided', async () => {
		modelsMock.LivechatRooms.findOneById.resolves({ t: 'l', v: { token: 'token' } });
		modelsMock.Messages.findVisibleByRoomIdNotContainingTypesBeforeTs.resolves([]);
		mockSettingValues.Livechat_transcript_email_subject = 'A custom subject obtained from setting.get';

		await sendTranscript({
			rid: 'rid',
			token: 'token',
			email: 'email',
			user: { _id: 'x', name: 'x', utcOffset: '-6', username: 'x' },
		});

		expect(getTimezoneMock.calledWith({ _id: 'x', name: 'x', utcOffset: '-6', username: 'x' })).to.be.true;
		expect(modelsMock.Messages.findLivechatClosingMessage.calledWith('rid', { projection: { ts: 1 } })).to.be.true;
		expect(modelsMock.Messages.findVisibleByRoomIdNotContainingTypesBeforeTs.called).to.be.true;
		expect(
			mailerMock.calledWith({
				to: 'email',
				from: 'test@rocket.chat',
				subject: 'A custom subject obtained from setting.get',
				replyTo: 'test@rocket.chat',
				html: '<div> <hr></div>',
			}),
		).to.be.true;
	});
	it('should fail if room provided is invalid', async () => {
		modelsMock.LivechatRooms.findOneById.resolves(null);

		await expect(sendTranscript({ rid: 'rid', email: 'email', logger: mockLogger })).to.be.rejectedWith(Error);
	});

	it('should fail if room provided is of different type', async () => {
		modelsMock.LivechatRooms.findOneById.resolves({ t: 'c' });

		await expect(sendTranscript({ rid: 'rid', email: 'email' })).to.be.rejectedWith(Error);
	});

	it('should fail if room is of valid type, but doesnt doesnt have `v` property', async () => {
		modelsMock.LivechatRooms.findOneById.resolves({ t: 'l' });

		await expect(sendTranscript({ rid: 'rid', email: 'email' })).to.be.rejectedWith(Error);
	});

	it('should fail if room is of valid type, has `v` prop, but it doesnt contain `token`', async () => {
		modelsMock.LivechatRooms.findOneById.resolves({ t: 'l', v: { otherProp: 'xxx' } });

		await expect(sendTranscript({ rid: 'rid', email: 'email' })).to.be.rejectedWith(Error);
	});

	it('should fail if room is of valid type, has `v.token`, but its different from the one on param (room from another visitor)', async () => {
		modelsMock.LivechatRooms.findOneById.resolves({ t: 'l', v: { token: 'xxx' } });

		await expect(sendTranscript({ rid: 'rid', email: 'email', token: 'xveasdf' })).to.be.rejectedWith(Error);
	});

	it('should throw an error when token is not the one on room.v', async () => {
		modelsMock.LivechatRooms.findOneById.resolves({ t: 'l', v: { token: 'xxx' } });

		await expect(sendTranscript({ rid: 'rid', email: 'email', token: 'xveasdf' })).to.be.rejectedWith(Error);
	});
	it('should work when token matches room.v', async () => {
		modelsMock.LivechatRooms.findOneById.resolves({ t: 'l', v: { token: 'token-123' } });
		modelsMock.Messages.findVisibleByRoomIdNotContainingTypesBeforeTs.resolves([]);
		delete mockSettingValues.Livechat_transcript_email_subject;
		tStub.returns('Conversation Transcript');

		await sendTranscript({
			rid: 'rid',
			token: 'token-123',
			email: 'email',
			user: { _id: 'x', name: 'x', utcOffset: '-6', username: 'x' },
		});

		expect(getTimezoneMock.calledWith({ _id: 'x', name: 'x', utcOffset: '-6', username: 'x' })).to.be.true;
		expect(modelsMock.Messages.findLivechatClosingMessage.calledWith('rid', { projection: { ts: 1 } })).to.be.true;
		expect(modelsMock.Messages.findVisibleByRoomIdNotContainingTypesBeforeTs.called).to.be.true;
		expect(
			mailerMock.calledWith({
				to: 'email',
				from: 'test@rocket.chat',
				subject: 'Conversation Transcript',
				replyTo: 'test@rocket.chat',
				html: '<div> <hr></div>',
			}),
		).to.be.true;
	});
});
