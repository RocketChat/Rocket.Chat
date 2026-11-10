import { getDdpTransport } from './websocket';

jest.mock('./ddpServer', () => ({}));

describe('getDdpTransport', () => {
	it.each([
		['/websocket', '', 'raw'],
		['/websocket/', '', 'raw'],
		['/sockjs/websocket', '', 'raw'],
		['/sockjs/123/abcdef/websocket', '', 'sockjs'],
		['/chat/websocket', '/chat', 'raw'],
		['/chat/sockjs/123/abcdef/websocket', '/chat', 'sockjs'],
	])('serves %s under prefix "%s" as %s', (pathname, prefix, transport) => {
		expect(getDdpTransport(pathname, prefix)).toBe(transport);
	});

	it.each([
		['/', ''],
		['/websocketx', ''],
		['/sockjs/info', ''],
		['/sockjs/123/abcdef/xhr', ''],
		['/sockjs/1/2/3/websocket', ''],
		['/websocket', '/chat'],
		['/chatwebsocket', '/chat'],
		['/_hmr/websocket', ''],
	])('leaves %s under prefix "%s" alone', (pathname, prefix) => {
		expect(getDdpTransport(pathname, prefix)).toBeUndefined();
	});
});
