import { Meteor } from 'meteor/meteor';

import { showErrorBox, showSuccessBox } from '../lib/logger/showBox';
import './serverRunning';

jest.mock('meteor/meteor', () => ({ Meteor: { startup: jest.fn() } }), { virtual: true });

jest.mock('@rocket.chat/license', () => ({
	License: { getHashedWorkspaceUrl: () => 'hashed-workspace-url' },
}));

jest.mock('../../rocketchat.info', () => ({
	Info: { version: '8.9.0', commit: {} },
	supportedNodeVersions: '>=22.22.3 <23 || >=24.15.0 <25',
}));

jest.mock('../lib/logger/showBox', () => ({
	showErrorBox: jest.fn(),
	showSuccessBox: jest.fn(),
	showWarningBox: jest.fn(),
}));

jest.mock('../lib/utils/functions/getMongoInfo', () => ({
	getMongoInfo: async () => ({ mongoVersion: '8.0.12', mongoStorageEngine: 'wiredTiger' }),
}));

jest.mock('../settings', () => ({
	settings: { get: () => 'http://localhost:3000' },
}));

const startup = jest.mocked(Meteor.startup).mock.calls[0][0] as () => Promise<unknown>;

const originalVersions = process.versions;

const runStartupWithNodeVersion = async (node: string) => {
	Object.defineProperty(process, 'versions', { value: { ...originalVersions, node } });
	await startup();
	await jest.runAllTimersAsync();
};

describe('serverRunning Node.js version check', () => {
	let exitSpy: jest.SpyInstance;

	beforeEach(() => {
		jest.useFakeTimers();
		jest.clearAllMocks();
		exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
		delete process.env.BYPASS_NODEJS_VALIDATION;
	});

	afterEach(() => {
		Object.defineProperty(process, 'versions', { value: originalVersions });
		jest.restoreAllMocks();
		jest.useRealTimers();
	});

	// 22.23.2 is the version from https://github.com/RocketChat/Rocket.Chat/issues/42740
	it.each(['22.22.3', '22.23.2', '24.15.0', '24.20.1'])('starts on Node.js %s, which is inside the supported range', async (node) => {
		await runStartupWithNodeVersion(node);

		expect(showErrorBox).not.toHaveBeenCalled();
		expect(exitSpy).not.toHaveBeenCalled();
		expect(showSuccessBox).toHaveBeenCalledWith('SERVER RUNNING', expect.stringContaining(`NodeJS Version: ${node}`));
	});

	it.each(['22.22.2', '23.11.0', '24.14.1', '25.0.0'])(
		'refuses to start on Node.js %s, which is outside the supported range',
		async (node) => {
			await runStartupWithNodeVersion(node);

			expect(showErrorBox).toHaveBeenCalledWith('SERVER ERROR', expect.stringContaining('>=22.22.3 <23 || >=24.15.0 <25'));
			expect(exitSpy).toHaveBeenCalledWith(1);
		},
	);
});
