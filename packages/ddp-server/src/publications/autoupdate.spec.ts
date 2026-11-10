import { registerAutoupdatePublication, setClientVersion } from './autoupdate';
import type { ClientVersion } from './autoupdate';
import { Server } from '../Server';
import { makeSession, makeSubscription, sentPackets } from '../__tests__/helpers';
import { MeteorCollection } from '../lib/MeteorCollection';

jest.mock('@rocket.chat/logger', () => ({
	Logger: jest.fn().mockReturnValue({
		error: jest.fn(),
	}),
}));

describe('meteor_autoupdate_clientVersions publication', () => {
	it('publishes the collection under the same name as its collection with the architecture as id', async () => {
		const server = new Server();
		const collection = registerAutoupdatePublication(server);
		collection.set('web.browser', { version: 'v1', versionRefreshable: 'r1', versionNonRefreshable: 'n1', versionHmr: 1 });
		const session = makeSession();

		await server.subscribe(session, makeSubscription('meteor_autoupdate_clientVersions'));

		expect(sentPackets(session)).toEqual([
			{
				msg: 'added',
				collection: 'meteor_autoupdate_clientVersions',
				id: 'web.browser',
				fields: { version: 'v1', versionRefreshable: 'r1', versionNonRefreshable: 'n1', versionHmr: 1 },
			},
			{ msg: 'ready', subs: ['test-id'] },
		]);
	});
});

describe('setClientVersion', () => {
	it('stores a version by architecture without repeating the id in the record', () => {
		const collection = new MeteorCollection<ClientVersion>();

		setClientVersion(collection, {
			_id: 'web.browser',
			version: 'v2',
			versionRefreshable: 'r2',
			versionNonRefreshable: 'n2',
			versionHmr: 2,
		});

		expect([...collection.entries()]).toEqual([
			['web.browser', { version: 'v2', versionRefreshable: 'r2', versionNonRefreshable: 'n2', versionHmr: 2 }],
		]);
	});
});
