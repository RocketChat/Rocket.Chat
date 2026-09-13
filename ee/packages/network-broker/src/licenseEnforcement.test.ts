import { shouldShutdown } from './licenseEnforcement';

describe('shouldShutdown', () => {
	it('should shut down when the service is no longer registered', () => {
		expect(shouldShutdown('presence', 'node-a', [{ name: 'streamer', nodes: ['node-a'] }])).toBe(true);
	});

	it('should shut down the lowest sorted node when the service runs on more than one node', () => {
		const services = [
			{ name: 'presence', nodes: ['node-b', 'node-a'] },
			{ name: 'streamer', nodes: ['node-c'] },
		];

		expect(shouldShutdown('presence', 'node-a', services)).toBe(true);
		expect(shouldShutdown('presence', 'node-b', services)).toBe(false);
	});

	it('should shut down a single node when it is the only service in the cluster', () => {
		expect(shouldShutdown('presence', 'node-a', [{ name: 'presence', nodes: ['node-a'] }])).toBe(true);
	});

	it('should keep a single node running while other services are online', () => {
		const services = [
			{ name: 'presence', nodes: ['node-a'] },
			{ name: 'streamer', nodes: ['node-b'] },
		];

		expect(shouldShutdown('presence', 'node-a', services)).toBe(false);
	});

	it('should not mutate the node list it is given', () => {
		const nodes = ['node-b', 'node-a'];

		shouldShutdown('presence', 'node-a', [{ name: 'presence', nodes }]);

		expect(nodes).toEqual(['node-b', 'node-a']);
	});
});
