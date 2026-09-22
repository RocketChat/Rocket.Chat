import { Server } from '../Server';
import { registerLoginServiceConfigurationPublication } from './loginServiceConfiguration';
import { makeClient, makeSubscription, sentPackets } from '../__tests__/helpers';

jest.mock('@rocket.chat/logger', () => ({
	Logger: jest.fn().mockReturnValue({
		error: jest.fn(),
	}),
}));

describe('meteor.loginServiceConfiguration publication', () => {
	it('publishes the mirror under the Meteor accounts collection name with the full record as fields', async () => {
		const server = new Server();
		const mirror = registerLoginServiceConfigurationPublication(server);
		mirror.set('github', { _id: 'github', service: 'github', clientId: 'seeded' });
		const client = makeClient();

		await server.subscribe(client, makeSubscription('meteor.loginServiceConfiguration'));

		expect(sentPackets(client)).toEqual([
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
