import { registerLoginServiceConfigurationPublication } from './loginServiceConfiguration';
import { makeSession, makeSubscription, sentPackets } from '../__tests__/helpers';
import { Server } from '../ddp/Server';

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
