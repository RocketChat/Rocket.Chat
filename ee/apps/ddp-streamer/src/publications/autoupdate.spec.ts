import { registerAutoupdatePublication } from './autoupdate';
import { makeSession, makeSubscription, sentPackets } from '../__tests__/helpers';
import { Server } from '../ddp/Server';

jest.mock('@rocket.chat/logger', () => ({
	Logger: jest.fn().mockReturnValue({
		error: jest.fn(),
	}),
}));

const browser = { version: 'v1', versionRefreshable: 'r1', versionNonRefreshable: 'n1', versionHmr: 1 };

describe('meteor_autoupdate_clientVersions publication', () => {
	it('publishes the collection under the same name as its collection with the architecture as id', async () => {
		const server = new Server();
		const collection = registerAutoupdatePublication(server, jest.fn().mockResolvedValue({}));
		collection.set('web.browser', browser);
		const session = makeSession();

		await server.subscribe(session, makeSubscription('meteor_autoupdate_clientVersions'));

		expect(sentPackets(session)).toEqual([
			{
				msg: 'added',
				collection: 'meteor_autoupdate_clientVersions',
				id: 'web.browser',
				fields: browser,
			},
			{ msg: 'ready', subs: ['test-id'] },
		]);
	});

	it('loads the versions on first subscription, and again on the next one if that load failed', async () => {
		const server = new Server();
		const load = jest
			.fn()
			.mockRejectedValueOnce(new Error('monolith unreachable'))
			.mockResolvedValue({ 'web.browser': { _id: 'web.browser', ...browser } });
		registerAutoupdatePublication(server, load);

		const first = makeSession();
		await server.subscribe(first, makeSubscription('meteor_autoupdate_clientVersions'));
		expect(sentPackets(first)).toEqual([{ msg: 'ready', subs: ['test-id'] }]);

		const second = makeSession();
		await server.subscribe(second, makeSubscription('meteor_autoupdate_clientVersions'));
		expect(sentPackets(second)).toEqual([
			{ msg: 'added', collection: 'meteor_autoupdate_clientVersions', id: 'web.browser', fields: browser },
			{ msg: 'ready', subs: ['test-id'] },
		]);

		await server.subscribe(makeSession(), makeSubscription('meteor_autoupdate_clientVersions'));
		expect(load).toHaveBeenCalledTimes(2);
	});
});
