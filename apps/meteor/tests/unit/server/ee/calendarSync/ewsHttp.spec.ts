import { expect } from 'chai';
import { describe, it } from 'mocha';
import sinon from 'sinon';

import type { IEwsRequestOptions } from '../../../../../ee/server/lib/calendarSync/providers/ews/ewsHttp';
import { EwsHttpClient } from '../../../../../ee/server/lib/calendarSync/providers/ews/ewsHttp';

const ENDPOINT = 'https://mail.example.mil/EWS/Exchange.asmx';

// Synthetic Type 2 challenge (signature, type 2, flags, server challenge, empty target info)
const type2 = (() => {
	const message = Buffer.alloc(48);
	message.write('NTLMSSP\0', 0, 'ascii');
	message.writeUInt32LE(2, 8);
	message.writeUInt32LE(0x00088201, 20);
	Buffer.from('0123456789abcdef', 'hex').copy(message, 24);
	return `NTLM ${message.toString('base64')}`;
})();

const response = (statusCode: number, headers: Record<string, string> = {}, body = '') => ({ statusCode, headers, body });

describe('calendarSync/ews/EwsHttpClient', () => {
	it('should send a single Basic-authenticated request', async () => {
		const requestFn = sinon.stub().resolves(response(200, {}, '<xml/>'));
		const client = new EwsHttpClient({ url: ENDPOINT, username: 'svc@example.mil', password: 'pw', authMethod: 'basic' }, requestFn);

		const result = await client.post('<soap/>');

		expect(result.statusCode).to.equal(200);
		expect(requestFn.calledOnce).to.be.true;
		const options: IEwsRequestOptions = requestFn.firstCall.args[0];
		expect(options.url).to.equal(ENDPOINT);
		expect(options.headers.Authorization).to.equal(`Basic ${Buffer.from('svc@example.mil:pw').toString('base64')}`);
		expect(options.body).to.equal('<soap/>');
	});

	it('should perform the NTLM handshake: empty-body Type 1, then Type 3 with the payload', async () => {
		const requestFn = sinon.stub();
		requestFn.onFirstCall().resolves(response(401, { 'www-authenticate': type2 }));
		requestFn.onSecondCall().resolves(response(200, {}, '<ok/>'));

		const client = new EwsHttpClient({ url: ENDPOINT, username: 'CONTOSO\\svc', password: 'pw', authMethod: 'ntlm' }, requestFn);

		const result = await client.post('<soap/>');
		expect(result.body).to.equal('<ok/>');

		const negotiate: IEwsRequestOptions = requestFn.firstCall.args[0];
		expect(negotiate.headers.Authorization).to.match(/^NTLM /);
		expect(Buffer.from(negotiate.headers.Authorization.slice(5), 'base64').readUInt32LE(8)).to.equal(1);
		expect(negotiate.body).to.equal('');

		const authenticate: IEwsRequestOptions = requestFn.secondCall.args[0];
		expect(authenticate.headers.Authorization).to.match(/^NTLM /);
		expect(Buffer.from(authenticate.headers.Authorization.slice(5), 'base64').readUInt32LE(8)).to.equal(3);
		expect(authenticate.body).to.equal('<soap/>');

		// Both legs must ride the same keep-alive agent (NTLM authenticates the connection)
		expect(negotiate.agent).to.equal(authenticate.agent);
	});

	it('should serialize concurrent NTLM posts so handshakes never interleave', async () => {
		const order: string[] = [];
		const requestFn = sinon.stub().callsFake(async (options: IEwsRequestOptions) => {
			const type = Buffer.from(options.headers.Authorization.slice(5), 'base64').readUInt32LE(8);
			order.push(`type${type}`);
			return type === 1 ? response(401, { 'www-authenticate': type2 }) : response(200, {}, '<ok/>');
		});

		const client = new EwsHttpClient({ url: ENDPOINT, username: 'CONTOSO\\svc', password: 'pw', authMethod: 'ntlm' }, requestFn);

		await Promise.all([client.post('<a/>'), client.post('<b/>')]);

		expect(order).to.deep.equal(['type1', 'type3', 'type1', 'type3']);
	});

	it('should fail with auth-failed when the endpoint does not offer NTLM', async () => {
		const requestFn = sinon.stub().resolves(response(401, { 'www-authenticate': 'Negotiate' }));
		const client = new EwsHttpClient({ url: ENDPOINT, username: 'CONTOSO\\svc', password: 'pw', authMethod: 'ntlm' }, requestFn);

		await client.post('<soap/>').then(
			() => expect.fail('expected rejection'),
			(error) => expect(error.code).to.equal('auth-failed'),
		);
	});

	it('should map transport failures to network-error', async () => {
		const requestFn = sinon.stub().rejects(new Error('ECONNREFUSED 10.0.0.5:443'));
		const client = new EwsHttpClient({ url: ENDPOINT, username: 'svc', password: 'pw', authMethod: 'basic' }, requestFn);

		await client.post('<soap/>').then(
			() => expect.fail('expected rejection'),
			(error) => expect(error.code).to.equal('network-error'),
		);
	});

	it('should keep accepting posts after a failed one', async () => {
		const requestFn = sinon.stub();
		requestFn.onFirstCall().rejects(new Error('boom'));
		requestFn.onSecondCall().resolves(response(200, {}, '<ok/>'));
		const client = new EwsHttpClient({ url: ENDPOINT, username: 'svc', password: 'pw', authMethod: 'basic' }, requestFn);

		await client.post('<soap/>').catch(() => undefined);
		const result = await client.post('<soap/>');
		expect(result.statusCode).to.equal(200);
	});
});
