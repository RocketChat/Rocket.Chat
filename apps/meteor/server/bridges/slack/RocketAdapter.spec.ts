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
		expect(await convert('<https://example.com>')).toBe('https://example.com');
		expect(await convert('<HTTPS://example.com/path|https://example.com/…>')).toBe('HTTPS://example.com/path');
		expect(await convert('<https://example.com/path|example.com/…>')).toBe('https://example.com/path');
		expect(await convert('<https://example.com/path|…>')).toBe('[…](https://example.com/path)');
		expect(await convert('<https://example.com/a(b(c)d)>')).toBe(
			'[https://example.com/a(b(c)d)](https://example.com/a(b(c)d))',
		);
		expect(await convert('<https://example.com/a(b(c)d)|https://example.com/a(b(c)d)>')).toBe(
			'[https://example.com/a(b(c)d)](https://example.com/a(b(c)d))',
		);
		expect(await convert('<https://example.com/a)b>')).toBe(
			'[https://example.com/a\\)](https://example.com/a%29)',
		);
		expect(await convert('<https://example.com|a &gt; b>')).toBe('[a > b](https://example.com)');
		expect(await convert('<https://example.com|Docs]>')).toBe('[Docs\\]](https://example.com)');
		expect(await convert('<https://example.com|a](https://other.example)b>')).toBe('[a\\]\\(https://other.example\\)b](https://example.com)');
		expect(await convert('<https://example.com|*bold* and _italic_ `code`>')).toBe(
			'[\\*bold\\* and \\_italic\\_ \\`code\\`](https://example.com)',
		);
		expect(await convert('<https://example.com/search?q=a)|Search>')).toBe('[Search](https://example.com/search?q=a%29)');
		expect(await convert('<https://example.com/a(b(c)d)|Docs>')).toBe('[Docs](https://example.com/a(b%28c%29d))');
	});
});
