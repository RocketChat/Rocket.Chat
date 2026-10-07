import { Agent } from 'https';

import { AllowlistedAgent, EwsTransport } from './EwsTransport';

const SOCKET_REACHED = new Error('socket reached');

const transportFor = (url: string) => new EwsTransport({ url, username: 'svc', password: 'pw', authMethod: 'basic' });

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
		await expect(transportFor('https://owa.corp.example/EWS/Exchange.asmx').post('<soap/>')).rejects.toBe(SOCKET_REACHED);

		expect(openSocket).toHaveBeenCalled();
	});

	it('connects to an IPv6 literal endpoint', async () => {
		await expect(transportFor('https://[2001:db8::1]/EWS/Exchange.asmx').post('<soap/>')).rejects.toBe(SOCKET_REACHED);

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
