import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import { Utilities } from '../../../../src/server/misc/Utilities';

describe('Utilities', () => {
	const expectedInfo = {
		id: '614055e2-3dba-41fb-be48-c1ff146f5932',
		name: 'Testing App',
		nameSlug: 'testing-app',
		description: 'A Rocket.Chat Application used to test out the various features.',
		version: '0.0.8',
		requiredApiVersion: '>=0.9.6',
		author: {
			name: 'Bradley Hilton',
			homepage: 'https://github.com/RocketChat/Rocket.Chat.Apps-ts-definitions',
			support: 'https://github.com/RocketChat/Rocket.Chat.Apps-ts-definitions/issues',
		},
		classFile: 'TestingApp.ts',
		iconFile: 'testing.jpg',
	};

	it('testDeepClone', () => {
		assert.doesNotThrow(() => Utilities.deepClone(expectedInfo));
		const info = Utilities.deepClone(expectedInfo);

		assert.deepStrictEqual(info, expectedInfo);
		info.name = 'New Testing App';
		assert.strictEqual(info.name, 'New Testing App');
		assert.strictEqual(info.author.name, expectedInfo.author.name);
	});

	it('testDeepFreeze', () => {
		const testInfo = {
			id: '614055e2-3dba-41fb-be48-c1ff146f5932',
			name: 'Testing App',
			nameSlug: 'testing-app',
			description: 'A Rocket.Chat Application used to test out the various features.',
			version: '0.0.8',
			requiredApiVersion: '>=0.9.6',
			author: {
				name: 'Bradley Hilton',
				homepage: 'https://github.com/RocketChat/Rocket.Chat.Apps-ts-definitions',
				support: 'https://github.com/RocketChat/Rocket.Chat.Apps-ts-definitions/issues',
			},
			classFile: 'TestingApp.ts',
			iconFile: 'testing.jpg',
		};

		assert.doesNotThrow(() => {
			testInfo.name = 'New Testing App';
		});
		assert.doesNotThrow(() => {
			testInfo.author.name = 'Bradley H';
		});
		assert.strictEqual(testInfo.name, 'New Testing App');
		assert.strictEqual(testInfo.author.name, 'Bradley H');

		assert.doesNotThrow(() => Utilities.deepFreeze(testInfo));

		assert.throws(() => {
			testInfo.name = 'Old Testing App';
		});
		assert.throws(() => {
			testInfo.author.name = 'Bradley';
		});
		assert.strictEqual(testInfo.name, 'New Testing App');
		assert.strictEqual(testInfo.author.name, 'Bradley H');
	});

	it('testDeepCloneAndFreeze', () => {
		const testInfo = {
			id: '614055e2-3dba-41fb-be48-c1ff146f5932',
			name: 'Testing App',
			nameSlug: 'testing-app',
			description: 'A Rocket.Chat Application used to test out the various features.',
			version: '0.0.8',
			requiredApiVersion: '>=0.9.6',
			author: {
				name: 'Bradley H',
				homepage: 'https://github.com/RocketChat/Rocket.Chat.Apps-ts-definitions',
				support: 'https://github.com/RocketChat/Rocket.Chat.Apps-ts-definitions/issues',
			},
			classFile: 'TestingApp.ts',
			iconFile: 'testing.jpg',
		};

		assert.doesNotThrow(() => Utilities.deepCloneAndFreeze({}));

		const info = Utilities.deepCloneAndFreeze(testInfo);
		assert.deepStrictEqual(info, testInfo);
		assert.notStrictEqual(info, testInfo);
		assert.strictEqual(info.author.name, testInfo.author.name);
		assert.strictEqual(info.author.name, 'Bradley H');
		assert.throws(() => {
			info.author.name = 'Bradley Hilton';
		});
	});
});
