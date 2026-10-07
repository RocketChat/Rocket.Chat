import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import sinon from 'sinon';

const proxyquire = require('proxyquire');

const findOneById = sinon.stub();
const canAccessConference = sinon.stub();
const isLiveKitFullyConfigured = sinon.stub();
const createLiveKitAccessToken = sinon.stub();
const settingsGet = sinon.stub();

const { getCallConfig } = proxyquire.noCallThru().load('./callConfig', {
	'@rocket.chat/core-services': { Authorization: { canAccessConference } },
	'@rocket.chat/logger': {
		Logger: class {
			error = sinon.stub();
		},
	},
	'@rocket.chat/models': { VideoConference: { findOneById } },
	'./config': { isLiveKitFullyConfigured, getLiveKitConfig: () => ({ url: 'wss://livekit.example.com' }) },
	'./token': { createLiveKitAccessToken },
	'../../../../server/settings': { settings: { get: settingsGet } },
});

const user = { _id: 'uid', name: 'Real Name', username: 'user.name' };

describe('getCallConfig', () => {
	beforeEach(() => {
		[findOneById, canAccessConference, isLiveKitFullyConfigured, createLiveKitAccessToken, settingsGet].forEach((stub) => stub.reset());
		findOneById.resolves({ _id: 'call', rid: 'rid', providerName: 'livekit' });
		canAccessConference.resolves(true);
		isLiveKitFullyConfigured.returns(true);
		createLiveKitAccessToken.resolves('token');
	});

	it('refuses a call that does not exist', async () => {
		findOneById.resolves(null);

		expect(await getCallConfig('call', user)).to.deep.equal({ error: 'error-videoconf-invalid-call' });
	});

	it('refuses a call that has ended, minting nothing', async () => {
		findOneById.resolves({ _id: 'call', rid: 'rid', providerName: 'livekit', endedAt: new Date() });

		expect(await getCallConfig('call', user)).to.deep.equal({ error: 'error-videoconf-invalid-call' });
		expect(createLiveKitAccessToken.called).to.be.false;
	});

	it('refuses someone who cannot access the conference', async () => {
		canAccessConference.resolves(false);

		expect(await getCallConfig('call', user)).to.deep.equal({ error: 'forbidden' });
		expect(createLiveKitAccessToken.called).to.be.false;
	});

	it('answers with the provider alone for a provider that needs no configuration, minting nothing', async () => {
		findOneById.resolves({ _id: 'call', rid: 'rid', providerName: 'jitsi' });

		expect(await getCallConfig('call', user)).to.deep.equal({ config: { providerName: 'jitsi' } });
		expect(createLiveKitAccessToken.called).to.be.false;
	});

	it('refuses a LiveKit call while LiveKit is not configured', async () => {
		isLiveKitFullyConfigured.returns(false);

		expect(await getCallConfig('call', user)).to.deep.equal({ error: 'error-videoconf-livekit-not-configured' });
	});

	it('reports a token that could not be minted', async () => {
		createLiveKitAccessToken.rejects(new Error('boom'));

		expect(await getCallConfig('call', user)).to.deep.equal({ error: 'error-videoconf-livekit-token-failed' });
	});

	it('hands a LiveKit call its server, a token for this user and the room', async () => {
		expect(await getCallConfig('call', user)).to.deep.equal({
			config: { providerName: 'livekit', livekit: { serverUrl: 'wss://livekit.example.com', token: 'token', roomName: 'mc-call' } },
		});
		expect(createLiveKitAccessToken.firstCall.args[0]).to.deep.include({ identity: 'uid' });
	});

	it('names the participant the way the workspace names people', async () => {
		settingsGet.withArgs('UI_Use_Real_Name').returns(false);
		await getCallConfig('call', user);
		expect(createLiveKitAccessToken.lastCall.args[0].name).to.equal('user.name');

		settingsGet.withArgs('UI_Use_Real_Name').returns(true);
		await getCallConfig('call', user);
		expect(createLiveKitAccessToken.lastCall.args[0].name).to.equal('Real Name');
	});
});
