import crypto from 'crypto';
import { EventEmitter } from 'events';
import { Agent } from 'https';
import type { TLSSocket } from 'tls';

import type { EwsTransportConfig } from './EwsTransport';
import { AllowlistedAgent, captureCertificate, EwsTransport } from './EwsTransport';

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
		refuseSocket();

		await expect(transportFor({ authMethod: 'ntlm' }).post('<soap/>')).rejects.toBe(SOCKET_REACHED);
	});
});
