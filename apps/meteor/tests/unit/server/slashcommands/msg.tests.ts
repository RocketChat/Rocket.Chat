import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const broadcastStub = sinon.stub();
const findOneByUsernameIgnoringCaseStub = sinon.stub();
const findOneByIdStub = sinon.stub();
const createDirectMessageStub = sinon.stub();
const executeSendMessageStub = sinon.stub();
const commands: Record<string, any> = {};

const slashCommandsStub = {
	slashCommands: {
		add: sinon.stub().callsFake((cmd: any) => {
			commands[cmd.command] = cmd;
		}),
	},
};

proxyquire.noCallThru().load('../../../../server/slashcommands/msg/server', {
	'@rocket.chat/core-services': {
		api: { broadcast: broadcastStub },
	},
	'@rocket.chat/models': {
		Users: {
			findOneByUsernameIgnoringCase: findOneByUsernameIgnoringCaseStub,
			findOneById: findOneByIdStub,
		},
	},
	'@rocket.chat/random': {
		Random: { id: sinon.stub().returns('random-id') },
	},
	'../../../app/settings/server': {
		settings: { get: sinon.stub().returns('en') },
	},
	'../../../app/utils/server/slashCommand': slashCommandsStub,
	'../../lib/i18n': {
		i18n: { t: sinon.stub().callsFake((key: string) => key) },
	},
	'../../meteor-methods/messages/createDirectMessage': {
		createDirectMessage: createDirectMessageStub,
	},
	'../../meteor-methods/messages/sendMessage': {
		executeSendMessage: executeSendMessageStub,
	},
});

describe('/msg slash command', () => {
	const userId = 'sender-user-id';
	const message = { rid: 'room-id', _id: 'message-id' } as any;

	beforeEach(() => {
		broadcastStub.reset();
		findOneByUsernameIgnoringCaseStub.reset();
		findOneByIdStub.reset();
		createDirectMessageStub.reset();
		executeSendMessageStub.reset();

		findOneByUsernameIgnoringCaseStub.withArgs('alice').resolves({ _id: 'alice-id', username: 'alice' });
		createDirectMessageStub.withArgs(['alice'], userId).resolves({ rid: 'direct-room-id' });
	});

	it('should execute single-line message with space separator', async () => {
		const msgCmd = commands.msg;
		await msgCmd.callback({ command: 'msg', params: ' @alice hello world', message, userId });

		expect(executeSendMessageStub.calledOnce).to.be.true;
		expect(executeSendMessageStub.firstCall.args[0]).to.equal(userId);
		expect(executeSendMessageStub.firstCall.args[1]).to.deep.equal({
			_id: 'random-id',
			rid: 'direct-room-id',
			msg: 'hello world',
		});
	});

	it('should execute plain case from bug report: /msg @alice + Shift+Enter (LF) + free text with no quotes', async () => {
		const msgCmd = commands.msg;
		await msgCmd.callback({
			command: 'msg',
			params: ' @alice\nfree text with no quotes',
			message,
			userId,
		});

		expect(executeSendMessageStub.calledOnce).to.be.true;
		expect(executeSendMessageStub.firstCall.args[1]).to.deep.equal({
			_id: 'random-id',
			rid: 'direct-room-id',
			msg: 'free text with no quotes',
		});
	});

	it('should execute /msg @alice with CRLF line break + free text', async () => {
		const msgCmd = commands.msg;
		await msgCmd.callback({
			command: 'msg',
			params: ' @alice\r\nfree text with CRLF',
			message,
			userId,
		});

		expect(executeSendMessageStub.calledOnce).to.be.true;
		expect(executeSendMessageStub.firstCall.args[1]).to.deep.equal({
			_id: 'random-id',
			rid: 'direct-room-id',
			msg: 'free text with CRLF',
		});
	});

	it('should preserve intentional blank line after line break in /msg', async () => {
		const msgCmd = commands.msg;
		await msgCmd.callback({
			command: 'msg',
			params: ' @alice\n\nmessage after blank line',
			message,
			userId,
		});

		expect(executeSendMessageStub.calledOnce).to.be.true;
		expect(executeSendMessageStub.firstCall.args[1]).to.deep.equal({
			_id: 'random-id',
			rid: 'direct-room-id',
			msg: '\nmessage after blank line',
		});
	});

	it('should handle space before Shift+Enter without prepending newline to message', async () => {
		const msgCmd = commands.msg;
		await msgCmd.callback({
			command: 'msg',
			params: ' @alice \nfree text without leading newline',
			message,
			userId,
		});

		expect(executeSendMessageStub.calledOnce).to.be.true;
		expect(executeSendMessageStub.firstCall.args[1]).to.deep.equal({
			_id: 'random-id',
			rid: 'direct-room-id',
			msg: 'free text without leading newline',
		});
	});

	it('should reject /msg with missing message (only @username)', async () => {
		const msgCmd = commands.msg;
		await msgCmd.callback({
			command: 'msg',
			params: ' @alice',
			message,
			userId,
		});

		expect(executeSendMessageStub.called).to.be.false;
		expect(
			broadcastStub.calledOnceWith('notify.ephemeralMessage', userId, message.rid, {
				msg: 'Username_and_message_must_not_be_empty',
			}),
		).to.be.true;
	});

	it('should reject /msg with only whitespace or newlines after @username', async () => {
		const msgCmd = commands.msg;
		await msgCmd.callback({
			command: 'msg',
			params: ' @alice \n\n   ',
			message,
			userId,
		});

		expect(executeSendMessageStub.called).to.be.false;
		expect(
			broadcastStub.calledOnceWith('notify.ephemeralMessage', userId, message.rid, {
				msg: 'Username_and_message_must_not_be_empty',
			}),
		).to.be.true;
	});
});
