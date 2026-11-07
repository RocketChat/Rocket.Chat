import RocketAdapter from './RocketAdapter';

jest.mock('@rocket.chat/models', () => ({ Messages: {}, Rooms: {}, Users: {} }), { virtual: true });
jest.mock('@rocket.chat/random', () => ({ Random: {} }), { virtual: true });
jest.mock('meteor/accounts-base', () => ({ Accounts: {} }), { virtual: true });
jest.mock('../../lib/callbacks', () => ({ callbacks: {} }), { virtual: true });
jest.mock('../../lib/messages/sendMessage', () => ({ sendMessage: jest.fn() }), { virtual: true });
jest.mock('../../lib/rooms/createRoom', () => ({ createRoom: jest.fn() }), { virtual: true });
jest.mock('../../lib/users/setUserAvatar', () => ({ setUserAvatar: jest.fn() }), { virtual: true });
jest.mock('../../lib/utils/getURL', () => ({ getWorkspaceURL: jest.fn() }), { virtual: true });
jest.mock('../../settings', () => ({ settings: {} }), { virtual: true });
jest.mock('./logger', () => ({ rocketLogger: { debug: jest.fn(), info: jest.fn(), error: jest.fn(), warn: jest.fn() } }), {
	virtual: true,
});

const convert = (text: string): Promise<string> => RocketAdapter.prototype.convertSlackMsgTxtToRocketTxtFormat.call({}, text);

describe('SlackBridge link conversion', () => {
	it('should convert Slack <url|label> links to a bare URL or a markdown link', async () => {
		expect(await convert('<https://x.com/user/status/123|x.com/user/status/123>')).toBe('https://x.com/user/status/123');
		expect(await convert('<https://example.com|some text>')).toBe('[some text](https://example.com)');
	});
});
