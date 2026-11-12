import { after, before, describe, it, mock } from 'node:test';

import { expect } from 'chai';

const settingsValues: Record<string, string> = {
	Site_Url: 'https://open.rocket.chat/chat/',
	CDN_PREFIX: 'https://cdn.rocket.chat',
};

let getWorkspaceURL: typeof import('./getURL').getWorkspaceURL;

before(async () => {
	const moduleMocks = [mock.module('../../settings', { exports: { settings: { get: (key: string) => settingsValues[key] } } })];
	({ getWorkspaceURL } = await import('./getURL'));
	moduleMocks.forEach((moduleMock) => moduleMock.restore());
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
