import { getTurnIceServer } from './getTurnIceServer';

describe('getTurnIceServer', () => {
	beforeEach(() => {
		jest.useFakeTimers({ now: 1_700_000_000_000 });
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('issues credentials that expire after the configured lifetime, signed with the shared secret', () => {
		const server = getTurnIceServer({ uris: ['turn:turn.example.com:3478'], secret: 'north', credentialTtl: 3600 }, 'user1');

		expect(server).toEqual({
			urls: ['turn:turn.example.com:3478'],
			username: '1700003600:user1',
			// printf '%s' '1700003600:user1' | openssl dgst -sha1 -hmac 'north' -binary | base64
			credential: 'E1us5CqdMW9Be/PF1OVW8CrlOwA=',
		});
	});
});
