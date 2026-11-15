import { describe, it } from 'node:test';

import { expect } from 'chai';

import { getEncryption, getEncryptionWarning } from './getEncryption';

describe('getEncryption', () => {
	it('should not enable encryption when the secret is missing or empty', () => {
		expect(getEncryption()).to.deep.equal({});
		expect(getEncryption({})).to.deep.equal({});
		expect(getEncryption({ MOLECULER_ENCRYPTION_SECRET: '' })).to.deep.equal({});
		expect(getEncryption({ MOLECULER_ENCRYPTION_SECRET: 123 })).to.deep.equal({});
	});

	it('should enable the encryption middleware when the secret is set', () => {
		const { middlewares } = getEncryption({ MOLECULER_ENCRYPTION_SECRET: 'secret' });

		expect(middlewares).to.have.length(1);
		expect(middlewares?.[0]).to.have.property('name', 'Encryption');
	});

	it('should let two instances sharing a secret read each other and reject a different one', () => {
		type Packet = (topic: string, data: Buffer, meta: unknown) => void;
		type TransmitMiddleware = {
			created(this: { logger: object }): void;
			transporterSend(next: Packet): Packet;
			transporterReceive(next: Packet): Packet;
		};

		const logger = { info: () => undefined, error: () => undefined };
		const middlewareFor = (secret: string) => {
			const [middleware] = getEncryption({ MOLECULER_ENCRYPTION_SECRET: secret }).middlewares as unknown as TransmitMiddleware[];
			middleware.created.call({ logger });
			return middleware;
		};

		const roundTrip = (sender: string, receiver: string) => {
			let wire: Buffer | undefined;
			middlewareFor(sender).transporterSend((_topic, data) => {
				wire = data;
			})('topic', Buffer.from('hello'), {});

			let received: Buffer | undefined;
			middlewareFor(receiver).transporterReceive((_topic, data) => {
				received = data;
			})('topic', wire as Buffer, {});

			return received?.toString();
		};

		expect(roundTrip('same', 'same')).to.equal('hello');
		expect(roundTrip('one', 'other')).to.equal(undefined);
	});
});

describe('getEncryptionWarning', () => {
	it('should warn that the TCP port is open when no secret is set', () => {
		expect(getEncryptionWarning(undefined, 'tcp')).to.include('is not set').and.include('TCP port accepts unauthenticated packets');
	});

	it('should warn that the TCP port is open when the secret is empty', () => {
		expect(getEncryptionWarning('', 'tcp')).to.include('is set but empty').and.include('TCP port accepts unauthenticated packets');
	});

	it('should not warn over TCP when a secret is set', () => {
		expect(getEncryptionWarning('secret', 'tcp')).to.equal(undefined);
	});

	it('should stay quiet over NATS when no secret is set', () => {
		expect(getEncryptionWarning(undefined, 'nats')).to.equal(undefined);
	});

	it('should warn over NATS when the secret is set but empty', () => {
		expect(getEncryptionWarning('', 'nats')).to.include('is set but empty').and.include('NOT encrypted');
	});

	it('should not warn over NATS when a secret is set', () => {
		expect(getEncryptionWarning('secret', 'nats')).to.equal(undefined);
	});

	it('should warn that the secret is ignored in microservices mode', () => {
		expect(getEncryptionWarning('secret', 'microservices')).to.include('ignored in microservices mode');
	});

	it('should stay quiet in microservices mode without a secret', () => {
		expect(getEncryptionWarning(undefined, 'microservices')).to.equal(undefined);
		expect(getEncryptionWarning('', 'microservices')).to.equal(undefined);
	});

	it('should treat a non-string value as no secret, matching getEncryption', () => {
		expect(getEncryption({ MOLECULER_ENCRYPTION_SECRET: 123 })).to.deep.equal({});
		expect(getEncryptionWarning(123, 'tcp')).to.include('is not set');
	});
});
