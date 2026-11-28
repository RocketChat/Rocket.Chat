import { getIceServer } from './getIceServer';

describe('getIceServer', () => {
	beforeEach(() => {
		jest.useFakeTimers({ now: 1_700_000_000_000 });
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('issues shared secret credentials that expire after the configured lifetime', () => {
		const server = getIceServer(
			{ urls: ['turn:turn.example.com:3478'], auth: { type: 'shared-secret', secret: 'north', ttl: 3600 } },
			'user1',
		);

		expect(server).toEqual({
			urls: ['turn:turn.example.com:3478'],
			username: '1700003600:user1',
			// printf '%s' '1700003600:user1' | openssl dgst -sha1 -hmac 'north' -binary | base64
			credential: 'E1us5CqdMW9Be/PF1OVW8CrlOwA=',
		});
	});

	it('issues shared secret credentials valid for a day when no lifetime is configured', () => {
		const server = getIceServer({ urls: 'turn:turn.example.com:3478', auth: { type: 'shared-secret', secret: 'north' } }, 'user1');

		expect(server.username).toBe('1700086400:user1');
	});

	it('passes static credentials through', () => {
		const server = getIceServer({ urls: 'turn:turn.example.com:3478', auth: { type: 'static', username: 'u', credential: 'p' } }, 'user1');

		expect(server).toEqual({ urls: 'turn:turn.example.com:3478', username: 'u', credential: 'p' });
	});

	it('sends servers without authentication as they are', () => {
		expect(getIceServer({ urls: 'stun:stun.example.com:3478' }, 'user1')).toEqual({ urls: 'stun:stun.example.com:3478' });
	});
});
