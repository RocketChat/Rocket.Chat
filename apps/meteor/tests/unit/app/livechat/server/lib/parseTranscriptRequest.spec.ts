import { expect } from 'chai';
import p from 'proxyquire';
import sinon from 'sinon';

const modelsMock = {
	Users: {
		findOneById: sinon.stub(),
	},
	LivechatVisitors: {
		findOneById: sinon.stub(),
	},
};

const settingsGetMock = {
	get: sinon.stub(),
};

const { parseTranscriptRequest } = p.noCallThru().load('../../../../../../app/livechat/server/lib/parseTranscriptRequest', {
	'@rocket.chat/models': modelsMock,
	'../../../settings/server': { settings: settingsGetMock },
});

describe('parseTranscriptRequest', () => {
	beforeEach(() => {
		settingsGetMock.get.reset();
		modelsMock.Users.findOneById.reset();
		modelsMock.LivechatVisitors.findOneById.reset();
	});

	it('should return `options` param with no changes when Livechat_enable_transcript setting is true', async () => {
		settingsGetMock.get.withArgs('Livechat_enable_transcript').returns(true);
		const options = await parseTranscriptRequest({} as any, {} as any);
		expect(options).to.be.deep.equal({});
	});

	it('should return `options` param with no changes when send always is disabled', async () => {
		settingsGetMock.get.withArgs('Livechat_enable_transcript').returns(false);
		settingsGetMock.get.withArgs('Livechat_transcript_send_always').returns(false);
		const options = await parseTranscriptRequest({} as any, {} as any);
		expect(options).to.be.deep.equal({});
	});

	it('should return `options` param with no changes when visitor is not provided and its not found on db', async () => {
		settingsGetMock.get.withArgs('Livechat_enable_transcript').returns(false);
		settingsGetMock.get.withArgs('Livechat_transcript_send_always').returns(true);
		modelsMock.LivechatVisitors.findOneById.resolves(null);

		const options = await parseTranscriptRequest({ v: { _id: '123' } } as any, {} as any);
		expect(options).to.be.deep.equal({});
	});

	it('should return `options` param with no changes when visitor is passed but no email is found', async () => {
		settingsGetMock.get.withArgs('Livechat_enable_transcript').returns(false);
		settingsGetMock.get.withArgs('Livechat_transcript_send_always').returns(true);
		modelsMock.LivechatVisitors.findOneById.resolves({} as any);

		const options = await parseTranscriptRequest({ v: { _id: '123' } } as any, {} as any, { _id: '123' } as any);
		expect(options).to.be.deep.equal({});
	});

	it('should return `options` param with no changes when visitor is fetched from db, but no email is found', async () => {
		settingsGetMock.get.withArgs('Livechat_enable_transcript').returns(false);
		settingsGetMock.get.withArgs('Livechat_transcript_send_always').returns(true);
		modelsMock.LivechatVisitors.findOneById.resolves({} as any);

		const options = await parseTranscriptRequest({ v: { _id: '123' } } as any, {} as any);
		expect(options).to.be.deep.equal({});
	});

	it('should return `options` param with no changes when no user is passed, room is not being served and rocketcat is not present', async () => {
		settingsGetMock.get.withArgs('Livechat_enable_transcript').returns(false);
		settingsGetMock.get.withArgs('Livechat_transcript_send_always').returns(true);
		modelsMock.Users.findOneById.resolves(null);
		modelsMock.LivechatVisitors.findOneById.resolves({ visitorEmails: [{ address: 'abc@rocket.chat' }] } as any);

		const options = await parseTranscriptRequest({ v: { _id: '123' } } as any, {} as any);
		expect(options).to.be.deep.equal({});
	});

	it('should return `options` param with `transcriptRequest` key attached when user is passed', async () => {
		settingsGetMock.get.withArgs('Livechat_enable_transcript').returns(false);
		settingsGetMock.get.withArgs('Livechat_transcript_send_always').returns(true);
		modelsMock.LivechatVisitors.findOneById.resolves({ visitorEmails: [{ address: 'abc@rocket.chat' }] } as any);

		const options = await parseTranscriptRequest({ v: { _id: '123' } } as any, {} as any, undefined, { _id: '123' } as any);

		expect(modelsMock.LivechatVisitors.findOneById.getCall(0).firstArg).to.be.equal('123');
		expect(options).to.have.property('emailTranscript').that.is.an('object');
		expect(options.emailTranscript.requestData).to.have.property('email', 'abc@rocket.chat');
		expect(options.emailTranscript.requestData).to.have.property('subject', '');
		expect(options.emailTranscript.requestData.requestedBy).to.be.deep.equal({ _id: '123' });
	});

	it('should return `options` param with `transcriptRequest` key attached when no user is passed, but theres an agent serving the room', async () => {
		settingsGetMock.get.withArgs('Livechat_enable_transcript').returns(false);
		settingsGetMock.get.withArgs('Livechat_transcript_send_always').returns(true);
		modelsMock.Users.findOneById.resolves({ _id: '123', username: 'kevsxxx', name: 'Kev' } as any);
		modelsMock.LivechatVisitors.findOneById.resolves({ visitorEmails: [{ address: 'abc@rocket.chat' }] } as any);

		const options = await parseTranscriptRequest({ v: { _id: '123' }, servedBy: { _id: '123' } } as any, {} as any);

		expect(modelsMock.Users.findOneById.getCall(0).firstArg).to.be.equal('123');
		expect(options).to.have.property('emailTranscript').that.is.an('object');
		expect(options.emailTranscript.requestData).to.have.property('email', 'abc@rocket.chat');
		expect(options.emailTranscript.requestData).to.have.property('subject', '');
		expect(options.emailTranscript.requestData.requestedBy).to.be.deep.equal({ _id: '123', username: 'kevsxxx', name: 'Kev' });
	});

	it('should return `options` param with `transcriptRequest` key attached when no user is passed, no agent is serving but rocket.cat is present', async () => {
		settingsGetMock.get.withArgs('Livechat_enable_transcript').returns(false);
		settingsGetMock.get.withArgs('Livechat_transcript_send_always').returns(true);
		modelsMock.Users.findOneById.resolves({ _id: 'rocket.cat', username: 'rocket.cat', name: 'Rocket Cat' } as any);
		modelsMock.LivechatVisitors.findOneById.resolves({ visitorEmails: [{ address: 'abc@rocket.chat' }] } as any);

		const options = await parseTranscriptRequest({ v: { _id: '123' } } as any, {} as any);

		expect(modelsMock.Users.findOneById.getCall(0).firstArg).to.be.equal('rocket.cat');
		expect(options).to.have.property('emailTranscript').that.is.an('object');
		expect(options.emailTranscript.requestData).to.have.property('email', 'abc@rocket.chat');
		expect(options.emailTranscript.requestData).to.have.property('subject', '');
		expect(options.emailTranscript.requestData.requestedBy).to.be.deep.equal({
			_id: 'rocket.cat',
			username: 'rocket.cat',
			name: 'Rocket Cat',
		});
	});
});
