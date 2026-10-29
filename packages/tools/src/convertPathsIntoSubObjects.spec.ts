import { convertPathsIntoSubObjects } from './convertPathsIntoSubObjects';

describe('convertPathsIntoSubObjects', () => {
	it('should return an empty object when passed an empty object', () => {
		expect(convertPathsIntoSubObjects({})).toEqual({});
	});

	it('should handle flat properties with no dots', () => {
		const input = { a: 1, b: 'hello', c: true };
		expect(convertPathsIntoSubObjects(input)).toEqual({ a: 1, b: 'hello', c: true });
	});

	it('should convert single-level dotted paths into nested objects', () => {
		const input = {
			'user.name': 'John',
			'user.age': 30,
		};
		expect(convertPathsIntoSubObjects(input)).toEqual({
			user: {
				name: 'John',
				age: 30,
			},
		});
	});

	it('should convert deeply nested dotted paths', () => {
		const input = {
			'a.b.c.d.e': 'deep',
		};
		expect(convertPathsIntoSubObjects(input)).toEqual({
			a: {
				b: {
					c: {
						d: {
							e: 'deep',
						},
					},
				},
			},
		});
	});

	it('should preserve falsy values: 0, empty string, false, and null', () => {
		const input = {
			'stats.count': 0,
			'profile.bio': '',
			'flags.active': false,
			'meta.deletedAt': null,
		};

		expect(convertPathsIntoSubObjects(input)).toEqual({
			stats: {
				count: 0,
			},
			profile: {
				bio: '',
			},
			flags: {
				active: false,
			},
			meta: {
				deletedAt: null,
			},
		});
	});

	it('should skip undefined values', () => {
		const input = {
			'user.name': 'Alice',
			'user.nickname': undefined,
		};

		expect(convertPathsIntoSubObjects(input)).toEqual({
			user: {
				name: 'Alice',
			},
		});
	});

	it('should merge sub-objects when paths overlap', () => {
		const input = {
			'settings.theme.color': 'blue',
			'settings.theme.fontSize': 14,
			'settings.notifications': true,
		};

		expect(convertPathsIntoSubObjects(input)).toEqual({
			settings: {
				theme: {
					color: 'blue',
					fontSize: 14,
				},
				notifications: true,
			},
		});
	});

	it('should merge when an object is provided as a value along with dotted subkeys', () => {
		const input = {
			'config.general': { timeout: 5000 },
			'config.general.retries': 3,
		};

		expect(convertPathsIntoSubObjects(input)).toEqual({
			config: {
				general: {
					timeout: 5000,
					retries: 3,
				},
			},
		});
	});

	it('should correctly handle arrays as values', () => {
		const input = {
			'items.list': [1, 2, 3],
		};

		expect(convertPathsIntoSubObjects(input)).toEqual({
			items: {
				list: [1, 2, 3],
			},
		});
	});
});
