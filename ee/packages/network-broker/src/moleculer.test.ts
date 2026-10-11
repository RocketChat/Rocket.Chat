import { MeteorError, isMeteorError } from '@rocket.chat/core-services';
import { ServiceBroker } from 'moleculer';

import { CustomRegenerator } from './moleculer';

describe('CustomRegenerator', () => {
	const regenerator = new CustomRegenerator();
	regenerator.init(new ServiceBroker({ logger: false, nodeID: 'node-a' }));

	const roundTrip = (error: Error) => regenerator.restore(regenerator.extractPlainError(error), { sender: 'node-a' });

	it('should keep the message of a Meteor error whose message is its code', () => {
		const error = new MeteorError('error-abac-required-attributes-removed', 'error-abac-required-attributes-removed', { keys: ['dept'] });
		error.message = 'error-abac-required-attributes-removed';

		const restored = roundTrip(error);

		expect(isMeteorError(restored)).toBe(true);
		expect(restored).toMatchObject({
			message: 'error-abac-required-attributes-removed',
			error: 'error-abac-required-attributes-removed',
			reason: 'error-abac-required-attributes-removed',
			details: { keys: ['dept'] },
		});
	});

	it('should keep the message of a Meteor error built from a code and a reason', () => {
		const restored = roundTrip(new MeteorError('error-not-allowed', 'Not allowed'));

		expect(restored).toMatchObject({ message: 'Not allowed [error-not-allowed]', reason: 'Not allowed' });
	});
});
