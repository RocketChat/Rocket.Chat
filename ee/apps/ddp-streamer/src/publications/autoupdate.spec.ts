import { Server } from '../Server';
import { registerAutoupdatePublication } from './autoupdate';
import { makeClient, makeSubscription, sentPackets } from '../__tests__/helpers';

jest.mock('@rocket.chat/logger', () => ({
	Logger: jest.fn().mockReturnValue({
		error: jest.fn(),
	}),
}));

describe('meteor_autoupdate_clientVersions publication', () => {
	it('publishes the mirror under the same name as its collection with the architecture as id', async () => {
		const server = new Server();
		const mirror = registerAutoupdatePublication(server);
		mirror.set('web.browser', { version: 'v1', versionRefreshable: 'r1', versionNonRefreshable: 'n1', versionHmr: 1 });
		const client = makeClient();

		await server.subscribe(client, makeSubscription('meteor_autoupdate_clientVersions'));

		expect(sentPackets(client)).toEqual([
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
