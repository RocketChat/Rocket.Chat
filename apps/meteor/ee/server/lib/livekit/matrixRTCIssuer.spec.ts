import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import sinon from 'sinon';

const proxyquire = require('proxyquire');

const isLiveKitFullyConfigured = sinon.stub();
const createLiveKitAccessToken = sinon.stub();
const settingsGet = sinon.stub();

const { matrixRTCLiveKitIssuer } = proxyquire.noCallThru().load('./matrixRTCIssuer', {
	'@rocket.chat/federation-matrix': { MATRIXRTC_TOKEN_SERVICE_PATH: '/matrixrtc/livekit-jwt' },
	'./config': { isLiveKitFullyConfigured, getLiveKitConfig: () => ({ url: 'wss://livekit.example.com' }) },
	'./token': { createLiveKitAccessToken },
	'../../../../server/settings': { settings: { get: settingsGet } },
});

describe('MatrixRTC LiveKit issuer', () => {
	beforeEach(() => {
		[isLiveKitFullyConfigured, createLiveKitAccessToken, settingsGet].forEach((stub) => stub.reset());
		isLiveKitFullyConfigured.returns(true);
		createLiveKitAccessToken.resolves('token');
		settingsGet.withArgs('Site_Url').returns('https://chat.example.com/');
	});

	it("announces this server's SFU and the token service next to the workspace", () => {
		expect(matrixRTCLiveKitIssuer.getOwnTransport()).to.deep.equal({
			url: 'wss://livekit.example.com',
			serviceUrl: 'https://chat.example.com/matrixrtc/livekit-jwt',
		});
	});

	it('announces no SFU while LiveKit is not configured', () => {
		isLiveKitFullyConfigured.returns(false);

		expect(matrixRTCLiveKitIssuer.getOwnTransport()).to.be.undefined;
	});

	it('lets a member of another homeserver watch, and nothing else, without hiding them', async () => {
		expect(await matrixRTCLiveKitIssuer.mintToken({ roomName: 'room', identity: 'identity', canPublish: false })).to.equal('token');

		const { identity, name, grant } = createLiveKitAccessToken.firstCall.args[0];
		expect(identity).to.equal('identity');
		expect(name).to.be.undefined;
		expect(grant).to.deep.equal({
			roomJoin: true,
			room: 'room',
			canSubscribe: true,
			canPublish: false,
			canPublishData: false,
			canUpdateOwnMetadata: false,
		});
	});

	it('lets a member who publishes send data too', async () => {
		await matrixRTCLiveKitIssuer.mintToken({ roomName: 'room', identity: 'identity', name: 'Alice', canPublish: true });

		expect(createLiveKitAccessToken.firstCall.args[0]).to.deep.include({ name: 'Alice' });
		expect(createLiveKitAccessToken.firstCall.args[0].grant).to.deep.equal({
			roomJoin: true,
			room: 'room',
			canSubscribe: true,
			canPublish: true,
			canPublishData: true,
		});
	});

	it('never lets a token create rooms', async () => {
		await matrixRTCLiveKitIssuer.mintToken({ roomName: 'room', identity: 'identity', canPublish: false });

		expect(createLiveKitAccessToken.firstCall.args[0].grant).to.not.have.property('roomCreate');
	});
});
