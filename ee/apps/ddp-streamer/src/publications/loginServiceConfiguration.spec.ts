import type { LoginServiceConfiguration } from '@rocket.chat/core-typings';

import { Server } from '../Server';
import {
	registerLoginServiceConfigurationPublication,
	seedLoginServiceConfiguration,
	updateLoginServiceConfiguration,
} from './loginServiceConfiguration';
import { makeClient, makeSubscription, sentPackets } from '../__tests__/helpers';

jest.mock('@rocket.chat/logger', () => ({
	Logger: jest.fn().mockReturnValue({
		error: jest.fn(),
	}),
}));

const collection = 'meteor_accounts_loginServiceConfiguration';
const server = new Server();
registerLoginServiceConfigurationPublication(server);

async function subscribe(id: string) {
	const client = makeClient();
	await server.subscribe(client, { ...makeSubscription('meteor.loginServiceConfiguration'), id });
	return client;
}

describe('meteor.loginServiceConfiguration publication', () => {
	beforeAll(() => {
		seedLoginServiceConfiguration([{ _id: 'github', service: 'github', clientId: 'seeded' } as LoginServiceConfiguration]);
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
	});
});
