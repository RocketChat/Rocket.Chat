import { convertPathsIntoSubObjects } from './convertPathsIntoSubObjects';
import { convertSubObjectsIntoPaths } from './convertSubObjectsIntoPaths';

describe('convertPathsIntoSubObjects', () => {
	it('should preserve numeric 0 and empty strings', () => {
		const input = {
			'settings.timeout': 0,
			'settings.prefix': '',
			'settings.enabled': false,
			'settings.count': 0,
			'settings.name': 'Rocket.Chat',
		};

		expect(convertPathsIntoSubObjects(input)).toEqual({
			settings: {
				timeout: 0,
				prefix: '',
				enabled: false,
				count: 0,
				name: 'Rocket.Chat',
			},
		});
	});

	it('should preserve null and boolean false values', () => {
		const input = {
			'user.active': false,
			'user.deletedAt': null,
		};

		expect(convertPathsIntoSubObjects(input)).toEqual({
			user: {
				active: false,
				deletedAt: null,
			},
		});
	});

	it('should discard undefined values', () => {
		const input = {
			'a.b': undefined,
			'a.c': 'defined',
		};

		expect(convertPathsIntoSubObjects(input)).toEqual({
			a: {
				c: 'defined',
			},
		});
	});

	it('should prevent prototype pollution via __proto__ and constructor', () => {
		const input = {
			'__proto__.polluted': 'yes',
			'constructor.prototype.polluted': 'yes',
			'safe.prop': 'ok',
		};

		const result = convertPathsIntoSubObjects(input);

		expect(result).toEqual({ safe: { prop: 'ok' } });
		expect(({} as any).polluted).toBeUndefined();
	});

	it('should maintain roundtrip symmetry with convertSubObjectsIntoPaths', () => {
		const original = {
			server: {
				port: 3000,
				retries: 0,
				prefix: '',
				debug: false,
				nested: {
					zero: 0,
					empty: '',
				},
			},
		};

		const flattened = convertSubObjectsIntoPaths(original);
		const restored = convertPathsIntoSubObjects(flattened);

		expect(restored).toEqual(original);
	});

	it('should properly merge nested sub-objects', () => {
		const input = {
			'config.network.ip': '127.0.0.1',
			'config.network': { port: 8080 },
		};

		expect(convertPathsIntoSubObjects(input)).toEqual({
			config: {
				network: {
					ip: '127.0.0.1',
					port: 8080,
				},
			},
		});
	});
});
