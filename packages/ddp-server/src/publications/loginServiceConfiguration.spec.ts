import type { LoginServiceConfiguration } from '@rocket.chat/core-typings';

import { applyLoginServiceConfigurationChange, registerLoginServiceConfigurationPublication } from './loginServiceConfiguration';
import { Server } from '../Server';
import { makeSession, makeSubscription, sentPackets } from '../__tests__/helpers';
import { MeteorCollection } from '../lib/MeteorCollection';

jest.mock('@rocket.chat/logger', () => ({
	Logger: jest.fn().mockReturnValue({
		error: jest.fn(),
	}),
}));

describe('meteor.loginServiceConfiguration publication', () => {
	it('publishes the collection under the Meteor accounts collection name with the full record as fields', async () => {
		const server = new Server();
		const collection = registerLoginServiceConfigurationPublication(server);
		collection.set('github', { _id: 'github', service: 'github', clientId: 'seeded' });
		const session = makeSession();

		await server.subscribe(session, makeSubscription('meteor.loginServiceConfiguration'));

		expect(sentPackets(session)).toEqual([
			{
				msg: 'added',
				collection: 'meteor_accounts_loginServiceConfiguration',
				id: 'github',
				fields: { _id: 'github', service: 'github', clientId: 'seeded' },
			},
			{ msg: 'ready', subs: ['test-id'] },
		]);
	});
});

describe('applyLoginServiceConfigurationChange', () => {
	it('stores an inserted or updated configuration and drops a removed one', () => {
		const collection = new MeteorCollection<Partial<LoginServiceConfiguration>>();
		const record = { _id: 'google', service: 'google', clientId: 'x' };

		applyLoginServiceConfigurationChange(collection, { clientAction: 'inserted', id: 'google', data: record });
		expect([...collection.entries()]).toEqual([['google', record]]);

		const updated = { _id: 'google', service: 'google' };
		applyLoginServiceConfigurationChange(collection, { clientAction: 'updated', id: 'google', data: updated });
		expect([...collection.entries()]).toEqual([['google', updated]]);

		applyLoginServiceConfigurationChange(collection, { clientAction: 'removed', id: 'google' });
		expect([...collection.entries()]).toEqual([]);
	});
});
