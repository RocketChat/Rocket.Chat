import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';

const proxyquire = require('proxyquire');

let values: Record<string, unknown> = {};
let modules: string[] = [];

const { getLiveKitConfig, isLiveKitFullyConfigured, isLiveKitLicensed } = proxyquire
	.noCallThru()
	.noPreserveCache()
	.load('./config', {
		'@rocket.chat/license': { License: { hasModule: (module: string) => modules.includes(module) } },
		'../../../../server/settings': { settings: { get: (key: string) => values[key] } },
	});

describe('LiveKit configuration', () => {
	beforeEach(() => {
		values = {
			VideoConf_LiveKit_Enabled: true,
			VideoConf_LiveKit_Url: 'wss://livekit.example.com',
			VideoConf_LiveKit_Api_Key: 'key',
			VideoConf_LiveKit_Api_Secret: 'secret',
		};
	});

	it('is fully configured when enabled with a server and credentials', () => {
		expect(isLiveKitFullyConfigured()).to.be.true;
	});

	it('ignores the whitespace around a pasted value', () => {
		values.VideoConf_LiveKit_Url = '  wss://livekit.example.com\n';

		expect(getLiveKitConfig().url).to.equal('wss://livekit.example.com');
	});

	['VideoConf_LiveKit_Url', 'VideoConf_LiveKit_Api_Key', 'VideoConf_LiveKit_Api_Secret'].forEach((key) => {
		it(`is not configured while ${key} holds only whitespace`, () => {
			values[key] = '   ';

			expect(isLiveKitFullyConfigured()).to.be.false;
		});
	});

	it('is not configured while disabled, even with a server and credentials', () => {
		values.VideoConf_LiveKit_Enabled = false;

		expect(isLiveKitFullyConfigured()).to.be.false;
	});

	it('uses the configured token lifetime', () => {
		values.VideoConf_LiveKit_Token_TTL = 2;

		expect(getLiveKitConfig().tokenTtlHours).to.equal(2);
	});

	[undefined, 0, -1].forEach((ttl) => {
		it(`falls back to a 6 hour token lifetime when it is ${ttl}`, () => {
			values.VideoConf_LiveKit_Token_TTL = ttl;

			expect(getLiveKitConfig().tokenTtlHours).to.equal(6);
		});
	});
});

describe('LiveKit licensing', () => {
	it('is licensed by the video-conference-native module', () => {
		modules = ['videoconference-enterprise', 'video-conference-native'];

		expect(isLiveKitLicensed()).to.be.true;
	});

	it('is not licensed by the rest of video conferencing alone', () => {
		modules = ['videoconference-enterprise'];

		expect(isLiveKitLicensed()).to.be.false;
	});
});
