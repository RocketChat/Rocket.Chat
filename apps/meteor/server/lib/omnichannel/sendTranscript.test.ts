import { beforeEach, describe, it } from 'node:test';

import { ClientSafeError } from '@rocket.chat/core-services';
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
	Uploads: {
		findOneByIdAndRoomId: sinon.stub(),
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

const getBufferMock = sinon.stub();

const tStub = sinon.stub();

const { sendTranscript } = p.noCallThru().load('./sendTranscript', {
	// mocked so the spec doesn't depend on whichever broker a previously-run spec installed
	'@rocket.chat/core-services': {
		Message: { saveSystemMessage: sinon.stub().resolves() },
		Omnichannel: { isWithinMACLimit: sinon.stub().resolves(true) },
		ClientSafeError,
	},
	'@rocket.chat/models': modelsMock,
	'@rocket.chat/logger': { Logger: mockLogger },
	'meteor/check': { check: checkMock },
	'../callbacks': {
		callbacks: {
			run: sinon.stub(),
		},
	},
	'../i18n': { i18n: { t: tStub } },
	'../notifications/email/api': { send: mailerMock },
	'../../settings': { settings: { get: settingsMock } },
	'../utils/lib/getTimezone': { getTimezone: getTimezoneMock },
	'../media/file-upload': { FileUpload: { getBuffer: getBufferMock } },
});

describe('Send transcript', () => {
	beforeEach(() => {
		checkMock.reset();
		modelsMock.LivechatRooms.findOneById.reset();
		modelsMock.Messages.findLivechatClosingMessage.reset();
		modelsMock.Messages.findVisibleByRoomIdNotContainingTypesBeforeTs.reset();
		modelsMock.Users.findOneById.reset();
		modelsMock.Uploads.findOneByIdAndRoomId.reset();
		getBufferMock.reset();
		mailerMock.reset();
		tStub.reset();
	});
	describe('file attachments', () => {
		const params = { rid: 'room-id', token: 'visitor-token', email: 'visitor@example.com' };
		const room = {
			_id: params.rid,
			t: 'l',
			v: { _id: 'visitor-id', token: params.token },
			servedBy: { _id: 'agent-id' },
		};
		const createMessage = (fileId: unknown, authorId = room.v._id) => ({
			_id: 'message-id',
			rid: room._id,
			u: { _id: authorId, username: authorId },
			msg: '',
			ts: new Date('2026-01-01T12:00:00Z'),
			files: [{ _id: fileId, name: 'image.png' }],
			attachments: [{ type: 'file', title: 'image.png', image_url: '/file-upload/image.png', image_type: 'image/png' }],
		});
		const uploads: { _id: string; rid?: string; userId?: string; visitorToken?: string }[] = [];

		beforeEach(() => {
			uploads.length = 0;
			modelsMock.LivechatRooms.findOneById.resolves(room);
			modelsMock.Users.findOneById.resolves({ _id: 'rocket.cat', username: 'rocket.cat' });
			modelsMock.Uploads.findOneByIdAndRoomId.callsFake(
				async (fileId, rid) => uploads.find((upload) => upload._id === fileId && upload.rid === rid) ?? null,
			);
			getBufferMock.resolves(Buffer.from('file contents'));
			tStub.callsFake((key) => key);
			getTimezoneMock.returns('UTC');
		});

		for (const fileId of [{ $gt: '' }, { $ne: null }, { $regex: '.*' }, null, 42]) {
			it(`should skip stored non-string file ID ${JSON.stringify(fileId)} without querying uploads`, async () => {
				modelsMock.Messages.findVisibleByRoomIdNotContainingTypesBeforeTs.returns([createMessage(fileId)]);

				await sendTranscript(params);

				expect(modelsMock.Uploads.findOneByIdAndRoomId.called).to.be.false;
				expect(getBufferMock.called).to.be.false;
				expect(mailerMock.calledOnce).to.be.true;
				expect(mailerMock.firstCall.args[0].html).to.include('This_attachment_is_not_supported');
				expect(mailerMock.firstCall.args[0].html).not.to.include('base64,');
			});
		}

		for (const rid of ['private-room-id', undefined]) {
			it(`should not read or email an upload with room ID ${rid}`, async () => {
				uploads.push({ _id: 'private-file-id', rid });
				modelsMock.Messages.findVisibleByRoomIdNotContainingTypesBeforeTs.returns([createMessage('private-file-id')]);

				await sendTranscript(params);

				expect(getBufferMock.called).to.be.false;
				expect(mailerMock.calledOnce).to.be.true;
				expect(mailerMock.firstCall.args[0].html).to.include('This_attachment_is_not_supported');
				expect(mailerMock.firstCall.args[0].html).not.to.include('base64,');
			});
		}

		it('should include visitor and agent images from the room before and after an agent transfer', async () => {
			const visitorUpload = { _id: 'visitor-file-id', rid: room._id, visitorToken: params.token };
			const agentUpload = { _id: 'agent-file-id', rid: room._id, userId: 'agent-id' };
			uploads.push(visitorUpload, agentUpload);
			modelsMock.Messages.findVisibleByRoomIdNotContainingTypesBeforeTs.returns([
				createMessage(visitorUpload._id),
				createMessage(agentUpload._id, agentUpload.userId),
			]);
			getBufferMock.withArgs(visitorUpload).resolves(Buffer.from('visitor image'));
			getBufferMock.withArgs(agentUpload).resolves(Buffer.from('agent image'));

			await sendTranscript(params);
			modelsMock.LivechatRooms.findOneById.resolves({ ...room, servedBy: { _id: 'new-agent-id' } });
			await sendTranscript(params);

			expect(getBufferMock.callCount).to.equal(4);
			expect(mailerMock.calledTwice).to.be.true;
			for (const call of mailerMock.getCalls()) {
				expect(call.args[0].html).to.include(`data:image/png;base64,${Buffer.from('visitor image').toString('base64')}`);
				expect(call.args[0].html).to.include(`data:image/png;base64,${Buffer.from('agent image').toString('base64')}`);
				expect(call.args[0].html).not.to.include('This_attachment_is_not_supported');
			}
		});
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
		modelsMock.Messages.findVisibleByRoomIdNotContainingTypesBeforeTs.returns([]);
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
		modelsMock.Messages.findVisibleByRoomIdNotContainingTypesBeforeTs.returns([]);

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
		modelsMock.Messages.findVisibleByRoomIdNotContainingTypesBeforeTs.returns([]);
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
		modelsMock.Messages.findVisibleByRoomIdNotContainingTypesBeforeTs.returns([]);
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
