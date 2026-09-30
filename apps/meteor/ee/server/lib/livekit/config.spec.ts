import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';

const proxyquire = require('proxyquire');

let values: Record<string, unknown> = {};

const { getLiveKitConfig, isLiveKitFullyConfigured } = proxyquire
	.noCallThru()
	.noPreserveCache()
	.load('./config', {
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
});
