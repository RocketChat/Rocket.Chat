import { after, before, describe, it } from 'node:test';

import { expect } from 'chai';
import proxyquire from 'proxyquire';

const settingsValues: Record<string, string> = {
	Site_Url: 'https://open.rocket.chat/chat/',
	CDN_PREFIX: 'https://cdn.rocket.chat',
};

const { getWorkspaceURL } = proxyquire.noCallThru().load('./getURL', {
	'../../settings': { settings: { get: (key: string) => settingsValues[key] } },
});

const runtimeGlobal = globalThis as typeof globalThis & { __meteor_runtime_config__?: { ROOT_URL_PATH_PREFIX?: string } };

describe('getWorkspaceURL', () => {
	let previousRuntimeConfig: typeof runtimeGlobal.__meteor_runtime_config__;

	before(() => {
		previousRuntimeConfig = runtimeGlobal.__meteor_runtime_config__;
		runtimeGlobal.__meteor_runtime_config__ = { ROOT_URL_PATH_PREFIX: '/chat' };
	});

	after(() => {
		runtimeGlobal.__meteor_runtime_config__ = previousRuntimeConfig;
	});

	it('should return the site URL without a trailing slash', () => {
		expect(getWorkspaceURL()).to.equal('https://open.rocket.chat/chat');
	});

	it('should build an absolute URL under the site URL, ignoring the CDN', () => {
		expect(getWorkspaceURL('reset-password/abc')).to.equal('https://open.rocket.chat/chat/reset-password/abc');
	});
});
