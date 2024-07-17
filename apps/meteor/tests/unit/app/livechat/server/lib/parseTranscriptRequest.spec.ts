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

	it('should return options when Livechat_enable_transcript setting is true', async () => {
		settingsGetMock.get.withArgs('Livechat_enable_transcript').returns(true);
		const options = await parseTranscriptRequest({} as any, {} as any);
		expect(options).to.be.deep.equal({});
	});

	it('should return options when send always is disabled', async () => {
		settingsGetMock.get.withArgs('Livechat_enable_transcript').returns(false);
		settingsGetMock.get.withArgs('Livechat_transcript_send_always').returns(false);
		const options = await parseTranscriptRequest({} as any, {} as any);
		expect(options).to.be.deep.equal({});
	});

	it('should return options when visitor is not provided and its not found on db', async () => {
		settingsGetMock.get.withArgs('Livechat_enable_transcript').returns(false);
		settingsGetMock.get.withArgs('Livechat_transcript_send_always').returns(true);
		modelsMock.LivechatVisitors.findOneById.returns(null);

		const options = await parseTranscriptRequest({ v: { _id: '123' } } as any, {} as any);
		expect(options).to.be.deep.equal({});
	});

	it('should return options when visitor is passed but no email is found', async () => {
		settingsGetMock.get.withArgs('Livechat_enable_transcript').returns(false);
		settingsGetMock.get.withArgs('Livechat_transcript_send_always').returns(true);
		modelsMock.LivechatVisitors.findOneById.returns({} as any);

		const options = await parseTranscriptRequest({ v: { _id: '123' } } as any, {} as any, { _id: '123' } as any);
		expect(options).to.be.deep.equal({});
	});

	it('should return options when visitor is fetched from db, but no email is found', async () => {
		settingsGetMock.get.withArgs('Livechat_enable_transcript').returns(false);
		settingsGetMock.get.withArgs('Livechat_transcript_send_always').returns(true);
		modelsMock.LivechatVisitors.findOneById.returns({} as any);

		const options = await parseTranscriptRequest({ v: { _id: '123' } } as any, {} as any);
		expect(options).to.be.deep.equal({});
	});

	it('should return options when no user is passed, room is not being served and rocketcat is not present', async () => {
		settingsGetMock.get.withArgs('Livechat_enable_transcript').returns(false);
		settingsGetMock.get.withArgs('Livechat_transcript_send_always').returns(true);
		modelsMock.Users.findOneById.returns(null);
		modelsMock.LivechatVisitors.findOneById.returns({ visitorEmails: [{ address: 'abc@rocket.chat' }] } as any);

		const options = await parseTranscriptRequest({ v: { _id: '123' } } as any, {} as any);
		expect(options).to.be.deep.equal({});
	});

	it('should return options with transcriptRequest data when user is passed', async () => {
		settingsGetMock.get.withArgs('Livechat_enable_transcript').returns(false);
		settingsGetMock.get.withArgs('Livechat_transcript_send_always').returns(true);
		modelsMock.LivechatVisitors.findOneById.returns({ visitorEmails: [{ address: 'abc@rocket.chat' }] } as any);

		const options = await parseTranscriptRequest({ v: { _id: '123' } } as any, {} as any, undefined, { _id: '123' } as any);

		expect(options).to.have.property('emailTranscript').that.is.an('object');
		expect(options.emailTranscript.requestData).to.have.property('email', 'abc@rocket.chat');
		expect(options.emailTranscript.requestData).to.have.property('subject', '');
		expect(options.emailTranscript.requestData.requestedBy).to.be.deep.equal({ _id: '123' });
	});

	it('should return options with transcriptData when no user is passed, but theres an agent serving the room', async () => {
		settingsGetMock.get.withArgs('Livechat_enable_transcript').returns(false);
		settingsGetMock.get.withArgs('Livechat_transcript_send_always').returns(true);
		modelsMock.Users.findOneById.returns({ _id: '123', username: 'kevsxxx', name: 'Kev' } as any);
		modelsMock.LivechatVisitors.findOneById.returns({ visitorEmails: [{ address: 'abc@rocket.chat' }] } as any);

		const options = await parseTranscriptRequest({ v: { _id: '123' } } as any, {} as any);

		expect(options).to.have.property('emailTranscript').that.is.an('object');
		expect(options.emailTranscript.requestData).to.have.property('email', 'abc@rocket.chat');
		expect(options.emailTranscript.requestData).to.have.property('subject', '');
		expect(options.emailTranscript.requestData.requestedBy).to.be.deep.equal({ _id: '123', username: 'kevsxxx', name: 'Kev' });
	});

	it('should return options with transcriptData when no user is passed, no agent is serving but rocket.cat is present', async () => {
		settingsGetMock.get.withArgs('Livechat_enable_transcript').returns(false);
		settingsGetMock.get.withArgs('Livechat_transcript_send_always').returns(true);
		modelsMock.Users.findOneById.returns({ _id: 'rocket.cat', username: 'rocket.cat', name: 'Rocket Cat' } as any);
		modelsMock.LivechatVisitors.findOneById.returns({ visitorEmails: [{ address: 'abc@rocket.chat' }] } as any);

		const options = await parseTranscriptRequest({ v: { _id: '123' } } as any, {} as any);

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
