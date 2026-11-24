import { afterEach, before, describe, it, mock } from 'node:test';

import { expect } from 'chai';
import sinon from 'sinon';

const warn = sinon.stub();
const startBroker = sinon.stub();

mock.module('@rocket.chat/network-broker', { namedExports: { startBroker } });

const stub = (name: string) => ({ [name]: true });

let registerEEBroker: (typeof import('./index'))['registerEEBroker'];

before(async () => {
	mock.module('./presence', { exports: stub('presence') });
	const moduleMocks = [
		mock.module('../hooks/auth/callback', { exports: stub('hooks') }),
		mock.module('./audit', { exports: stub('audit') }),
		mock.module('./deviceManagement', { exports: stub('deviceManagement') }),
		mock.module('./engagementDashboard', { exports: stub('engagementDashboard') }),
		mock.module('./maxRoomsPerGuest', { exports: stub('maxRoomsPerGuest') }),
		mock.module('./services', { exports: stub('services') }),
		mock.module('./readReceiptsArchive', { exports: stub('readReceiptsArchive') }),
		mock.module('./mcp', { exports: stub('mcp') }),
		mock.module('@rocket.chat/core-services', { exports: { api: { setBroker: sinon.stub(), start: sinon.stub().resolves() } } }),
		mock.module('../../../server/lib/logger/system', { exports: { SystemLogger: { warn } } }),
	];
	({ registerEEBroker } = await import('./index'));
	moduleMocks.forEach((moduleMock) => moduleMock.restore());
});

describe('registerEEBroker encryption warning', () => {
	const env = { ...process.env };

	afterEach(() => {
		warn.reset();
		startBroker.reset();
		process.env.TRANSPORTER = env.TRANSPORTER;
		process.env.MOLECULER_ENCRYPTION_SECRET = env.MOLECULER_ENCRYPTION_SECRET;
		for (const key of ['TRANSPORTER', 'MOLECULER_ENCRYPTION_SECRET'] as const) {
			if (env[key] === undefined) {
				delete process.env[key];
			}
		}
	});

	it('should warn that the secret is ignored in microservices mode', async () => {
		process.env.TRANSPORTER = 'nats://localhost:4222';
		process.env.MOLECULER_ENCRYPTION_SECRET = 'a-long-random-secret';

		await registerEEBroker();

		expect(warn.calledOnce).to.equal(true);
		expect(warn.firstCall.args[0]).to.include('ignored in microservices mode');
		expect(startBroker.calledOnce).to.equal(true);
	});

	it('should not warn in microservices mode without a secret', async () => {
		process.env.TRANSPORTER = 'nats://localhost:4222';
		delete process.env.MOLECULER_ENCRYPTION_SECRET;

		await registerEEBroker();

		expect(warn.called).to.equal(false);
	});

	it('should not warn in monolith mode', async () => {
		delete process.env.TRANSPORTER;
		process.env.MOLECULER_ENCRYPTION_SECRET = 'a-long-random-secret';

		await registerEEBroker();

		expect(warn.called).to.equal(false);
	});
});
