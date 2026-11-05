import crypto from 'crypto';
import { EventEmitter } from 'events';
import https, { Agent } from 'https';
import type { TLSSocket } from 'tls';

import type { EwsTransportConfig } from './EwsTransport';
import { AllowlistedAgent, captureCertificate, EwsTransport } from './EwsTransport';

jest.mock('@rocket.chat/ntlm', () => ({
	createType1Message: () => 'NTLM negotiate',
	decodeType2Message: () => ({}),
	createType3Message: () => 'NTLM authenticate',
	computeChannelBindingHash: () => Buffer.from('binding'),
}));

const SOCKET_REACHED = new Error('socket reached');

const transportFor = (over?: Partial<EwsTransportConfig>) =>
	new EwsTransport({ url: 'https://owa.corp.example/EWS/Exchange.asmx', username: 'svc', password: 'pw', authMethod: 'basic', ...over });

const fakeSocket = (certificate: () => Buffer | undefined) =>
	Object.assign(new EventEmitter(), {
		getProtocol: () => 'TLSv1.3',
		getPeerCertificate: () => ({ raw: certificate() }),
	}) as unknown as TLSSocket;

describe('the EWS air-gap allowlist', () => {
	let openSocket: jest.SpyInstance;

	beforeEach(() => {
		openSocket = jest.spyOn(Agent.prototype, 'createConnection').mockImplementation(() => {
			throw SOCKET_REACHED;
		});
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('connects to the configured endpoint', async () => {
		await expect(transportFor().post('<soap/>')).rejects.toBe(SOCKET_REACHED);

		expect(openSocket).toHaveBeenCalled();
	});

	it('connects to an IPv6 literal endpoint', async () => {
		await expect(transportFor({ url: 'https://[2001:db8::1]/EWS/Exchange.asmx' }).post('<soap/>')).rejects.toBe(SOCKET_REACHED);

		expect(openSocket).toHaveBeenCalled();
	});

	it('refuses any other host before a socket is opened', () => {
		const agent = new AllowlistedAgent('owa.corp.example', {});

		expect(() => agent.createConnection({ host: 'login.microsoftonline.com' })).toThrow(
			expect.objectContaining({ code: 'host-not-allowed' }),
		);
		expect(openSocket).not.toHaveBeenCalled();
	});
});

describe('capturing the peer certificate for channel binding', () => {
	const RAW = Buffer.from('a certificate');

	it('waits for the handshake when the socket is fresh', () => {
		let certificate: Buffer | undefined;
		let stored: Buffer | undefined;
		const socket = fakeSocket(() => certificate);

		captureCertificate(socket, (raw) => {
			stored = raw;
		});

		expect(stored).toBeUndefined();

		certificate = RAW;
		socket.emit('secureConnect');

		expect(stored).toBe(RAW);
	});

	it('reads a reused socket at once, leaving no listener behind', () => {
		let stored: Buffer | undefined;
		const socket = fakeSocket(() => RAW);

		captureCertificate(socket, (raw) => {
			stored = raw;
		});

		expect(stored).toBe(RAW);
		expect(socket.listenerCount('secureConnect')).toBe(0);
	});
});

describe('NTLM under FIPS', () => {
	const refuseSocket = () =>
		jest.spyOn(Agent.prototype, 'createConnection').mockImplementation(() => {
			throw SOCKET_REACHED;
		});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('refuses NTLM while the workspace runs in FIPS mode', async () => {
		jest.spyOn(crypto, 'getFips').mockReturnValue(1);
		const openSocket = refuseSocket();

		await expect(transportFor({ authMethod: 'ntlm' }).post('<soap/>')).rejects.toMatchObject({ code: 'ntlm-unavailable' });

		expect(openSocket).not.toHaveBeenCalled();
	});

	it('leaves Basic alone under FIPS', async () => {
		jest.spyOn(crypto, 'getFips').mockReturnValue(1);
		refuseSocket();

		await expect(transportFor().post('<soap/>')).rejects.toBe(SOCKET_REACHED);
	});

	it('allows NTLM when FIPS is off', async () => {
		jest.spyOn(crypto, 'getFips').mockReturnValue(0);
		refuseSocket();

		await expect(transportFor({ authMethod: 'ntlm' }).post('<soap/>')).rejects.toBe(SOCKET_REACHED);
	});
});

describe('NTLM once per connection', () => {
	const fakeExchange = ({ keepsAuthentication = true } = {}) => {
		const authenticated = new WeakSet<TLSSocket>();
		const requests: string[] = [];
		const connect = () =>
			Object.assign(
				fakeSocket(() => Buffer.from('certificate')),
				{ destroyed: false },
			);
		let connection = connect();

		const answer = (authorization: string | undefined, body: string, socket: TLSSocket) => {
			if (authorization === 'NTLM negotiate') {
				requests.push('negotiate');
				return { statusCode: 401, headers: { 'www-authenticate': 'NTLM challenge' } };
			}

			if (authorization === 'NTLM authenticate') {
				requests.push(`authenticate ${body}`);
				if (keepsAuthentication) {
					authenticated.add(socket);
				}
				return { statusCode: 200, headers: {} };
			}

			requests.push(body);
			return authenticated.has(socket) ? { statusCode: 200, headers: {} } : { statusCode: 401, headers: { 'www-authenticate': 'NTLM' } };
		};

		jest.spyOn(https, 'request').mockImplementation(((
			_url: URL,
			options: { headers: Record<string, string> },
			callback: (res: EventEmitter) => void,
		) => {
			const req = Object.assign(new EventEmitter(), {
				destroy: jest.fn(),
				end: (body: string) => {
					const socket = connection;
					const { statusCode, headers } = answer(options.headers.Authorization, body, socket);
					const res = Object.assign(new EventEmitter(), { statusCode, headers });

					setImmediate(() => {
						req.emit('socket', socket);
						callback(res);
						res.emit('data', Buffer.from(statusCode === 200 ? `answer to ${body}` : ''));
						res.emit('end');
					});
				},
			});

			return req;
		}) as unknown as typeof https.request);

		return {
			requests,
			closeConnection: () => {
				connection.destroyed = true;
				connection = connect();
			},
			replaceConnectionUnnoticed: () => {
				connection = connect();
			},
		};
	};

  let exchange: any;
  let transport: any;

  beforeEach(() => {
		exchange = fakeExchange();
		transport = transportFor({ authMethod: 'ntlm' });
  })

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('authenticates once and sends the following requests over that connection without a handshake', async () => {
		await expect(transport.post('a')).resolves.toBe('answer to a');
		await expect(transport.post('b')).resolves.toBe('answer to b');

		expect(exchange.requests).toEqual(['negotiate', 'authenticate a', 'b']);
	});

	it('authenticates again once Exchange closed the connection', async () => {
		await transport.post('a');
		exchange.closeConnection();
		await expect(transport.post('b')).resolves.toBe('answer to b');

		expect(exchange.requests).toEqual(['negotiate', 'authenticate a', 'negotiate', 'authenticate b']);
	});

	it('authenticates again when a request lands on a connection that was never authenticated', async () => {
		await transport.post('a');
		exchange.replaceConnectionUnnoticed();
		await expect(transport.post('b')).resolves.toBe('answer to b');
		await transport.post('c');

		expect(exchange.requests).toEqual(['negotiate', 'authenticate a', 'b', 'negotiate', 'authenticate b', 'c']);
	});

	it('authenticates every request when Exchange does not keep the connection authenticated', async () => {
		exchange = fakeExchange({ keepsAuthentication: false });

		await transport.post('a');
		await expect(transport.post('b')).resolves.toBe('answer to b');
		await transport.post('c');

		expect(exchange.requests).toEqual(['negotiate', 'authenticate a', 'b', 'negotiate', 'authenticate b', 'negotiate', 'authenticate c']);
	});
});
