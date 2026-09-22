import { makeClient, makeSubscription, sentPackets } from './__tests__/helpers';
import { server, updateLoginServiceConfiguration } from './configureServer';

jest.mock('@rocket.chat/core-services', () => ({
	...jest.requireActual('@rocket.chat/core-services'),
	MeteorService: {
		getLoginServiceConfiguration: jest.fn().mockResolvedValue([{ _id: 'github', service: 'github', clientId: 'seeded' }]),
	},
}));

jest.mock('@rocket.chat/logger', () => ({
	Logger: jest.fn().mockReturnValue({
		error: jest.fn(),
	}),
}));

const collection = 'meteor_accounts_loginServiceConfiguration';

const subscribedClients: ReturnType<typeof makeClient>[] = [];

async function subscribe(id: string) {
	const client = makeClient();
	subscribedClients.push(client);
	await server.subscribe(client, { ...makeSubscription('meteor.loginServiceConfiguration'), id });
	return client;
}

describe('meteor.loginServiceConfiguration publication', () => {
	beforeAll(async () => {
		await new Promise(setImmediate);
	});

	// Subscriptions register listeners on a module level emitter, so a leaked one would keep the
	// mirror updated on behalf of the code under test and mask the very regression covered here.
	afterEach(() => {
		subscribedClients.forEach((client) => client.subscriptions.forEach((subscription) => subscription.stop()));
		subscribedClients.length = 0;
	});

	it('replays the seeded configuration and reports ready', async () => {
		const client = await subscribe('seed');

		expect(sentPackets(client)).toEqual([
			{ msg: 'added', collection, id: 'github', fields: { _id: 'github', service: 'github', clientId: 'seeded' } },
			{ msg: 'ready', subs: ['seed'] },
		]);
	});

	// A change that arrives while nobody is subscribed must still reach the next subscriber.
	it('keeps the mirror current while there are no subscribers', async () => {
		updateLoginServiceConfiguration('added', { _id: 'google', service: 'google', clientId: 'first' });
		updateLoginServiceConfiguration('changed', { _id: 'google', service: 'google', clientId: 'second' });

		const client = await subscribe('late');

		expect(sentPackets(client)).toContainEqual({
			msg: 'added',
			collection,
			id: 'google',
			fields: { _id: 'google', service: 'google', clientId: 'second' },
		});

		updateLoginServiceConfiguration('removed', { _id: 'google' });
		const afterRemoval = await subscribe('after-removal');

		expect(sentPackets(afterRemoval)).not.toContainEqual(expect.objectContaining({ id: 'google' }));
	});

	it('forwards changes to active subscribers and stops after they unsubscribe', async () => {
		const client = await subscribe('live');
		client.send.mockClear();

		updateLoginServiceConfiguration('added', { _id: 'gitlab', service: 'gitlab' });
		updateLoginServiceConfiguration('changed', { _id: 'gitlab', service: 'gitlab', clientId: 'x' });
		updateLoginServiceConfiguration('removed', { _id: 'gitlab' });

		expect(sentPackets(client)).toEqual([
			{ msg: 'added', collection, id: 'gitlab', fields: { _id: 'gitlab', service: 'gitlab' } },
			{ msg: 'changed', collection, id: 'gitlab', fields: { _id: 'gitlab', service: 'gitlab', clientId: 'x' } },
			{ msg: 'removed', collection, id: 'gitlab' },
		]);

		client.subscriptions.get('live')?.stop();
		client.send.mockClear();
		updateLoginServiceConfiguration('added', { _id: 'bitbucket', service: 'bitbucket' });

		expect(client.send).not.toHaveBeenCalled();

		updateLoginServiceConfiguration('removed', { _id: 'bitbucket' });
	});
});
