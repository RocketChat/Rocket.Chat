import * as assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';

import type { IMessage } from '@rocket.chat/apps-engine/definition/messages';
import type { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import type { IUser } from '@rocket.chat/apps-engine/definition/users';

import { createRecordingSender } from './helpers/parityHarness';
import { AppObjectRegistry } from '../../../AppObjectRegistry';
import { AppAccessors } from '../mod';

/**
 * Guards the *wiring* of `AppAccessors`, not the behavior of any single accessor.
 *
 * `AppAccessors` memoizes most sub-accessors in private fields and hands them out
 * through `get*()` methods. Some consumers capture a sub-accessor **by value** at
 * construction time - most notably `Reader`, which takes all fifteen of its readers
 * as constructor arguments and returns them verbatim afterwards. That combination
 * makes a construction-order hazard possible: if a memoized field is still
 * `undefined` when `getReader()` runs, the `Reader` caches `undefined` forever and
 * every app in the subprocess sees a missing accessor.
 *
 * That is exactly what happened to the notifier: `getReader()` was invoked from the
 * `AppAccessors` constructor (to build `Http`) on the line *before*
 * `this.notifier` was assigned, so `read.getNotifier()` returned `undefined` and
 * apps calling `read.getNotifier().notifyUser(...)` got
 * "Cannot read properties of undefined (reading 'notifyUser')". `modify.getNotifier()`
 * was unaffected because it resolves lazily through an arrow.
 *
 * `packages/apps/tsconfig.json` sets `strict: false`, so `strictNullChecks` will not
 * catch a `T | undefined` flowing into a parameter typed `T`. These tests stand in
 * for that missing compile-time guard.
 *
 * The sweep below is reflective on purpose: a sub-accessor added to any container in
 * the future is covered without touching this file.
 */

/** Zero-argument `get*()` methods reachable on `target`, including inherited ones. */
function zeroArgGetters(target: object): string[] {
	const names = new Set<string>();

	for (let o: object | null = target; o && o !== Object.prototype; o = Object.getPrototypeOf(o)) {
		for (const name of Object.getOwnPropertyNames(o)) {
			if (!name.startsWith('get')) {
				continue;
			}

			// Read off the descriptor rather than the instance so a real `get x()`
			// accessor property is not invoked just by looking at it.
			const descriptor = Object.getOwnPropertyDescriptor(o, name);
			if (typeof descriptor?.value !== 'function' || descriptor.value.length !== 0) {
				continue;
			}

			names.add(name);
		}
	}

	return [...names].sort();
}

describe('AppAccessors surface integrity', () => {
	beforeEach(() => {
		// `mod.ts` seeds this at import time and `getDefaultAppAccessors()` captures the
		// array *reference*, so anything that cleared the registry earlier would leave a
		// legitimately-undefined `providedApiEndpoints` behind and muddy the sweep below.
		if (!AppObjectRegistry.has('apiEndpoints')) {
			AppObjectRegistry.set('apiEndpoints', []);
		}
	});

	// A factory rather than a shared instance: every construction-order hazard needs a
	// freshly built `AppAccessors` to show up at all.
	const makeAccessors = () => new AppAccessors(createRecordingSender().sender);

	describe('no accessor resolves to undefined', () => {
		// Containers are the objects that *hand out* other accessors, which is where the
		// capture-by-value hazard lives. Leaf accessors (ModifyCreator, RoomRead, ...) are
		// covered by their own suites.
		const containers: Array<[string, (a: AppAccessors) => object]> = [
			['reader', (a) => a.getReader()],
			['modifier', (a) => a.getModifier()],
			['environmentRead', (a) => a.getEnvironmentRead()],
			['environmentWrite', (a) => a.getEnvironmentWrite()],
			['reader.getEnvironmentReader()', (a) => a.getReader().getEnvironmentReader()],
			['defaultAppAccessors', (a) => a.getDefaultAppAccessors()],
		];

		for (const [label, resolve] of containers) {
			it(`${label} exposes only defined accessors`, () => {
				const container = resolve(makeAccessors());

				assert.notStrictEqual(container, undefined, `${label} itself is undefined`);

				const getters = zeroArgGetters(container);

				// A container with no getters means the reflection missed its shape (e.g. the
				// object was replaced by a plain map), which would silently pass every
				// assertion below. `defaultAppAccessors` is a plain data bag by design.
				if (label !== 'defaultAppAccessors') {
					assert.ok(getters.length > 0, `found no zero-arg get*() methods on ${label}`);
				}

				for (const name of getters) {
					const resolved = (container as Record<string, () => unknown>)[name]();

					assert.notStrictEqual(resolved, undefined, `${label}.${name}() returned undefined`);
					assert.notStrictEqual(resolved, null, `${label}.${name}() returned null`);
				}

				// Plain-object containers expose accessors as properties, not methods.
				for (const [key, value] of Object.entries(container)) {
					assert.notStrictEqual(value, undefined, `${label}.${key} is undefined`);
				}
			});
		}

		for (const [label, resolve] of [
			['http', (a: AppAccessors) => a.getHttp()],
			['persistence', (a: AppAccessors) => a.getPersistence()],
			['configurationExtend', (a: AppAccessors) => a.getConfigurationExtend()],
			['configurationModify', (a: AppAccessors) => a.getConfigurationModify()],
		] as const) {
			it(`${label} is defined and fully populated`, () => {
				const resolved = resolve(makeAccessors()) as object;

				assert.notStrictEqual(resolved, undefined, `${label} is undefined`);

				for (const [key, value] of Object.entries(resolved)) {
					assert.notStrictEqual(value, undefined, `${label}.${key} is undefined`);
				}
			});
		}
	});

	describe('accessors reachable by more than one path agree', () => {
		// The notifier is reachable through both IRead and IModify. A single shared
		// instance is the invariant: two divergent instances would let this bug recur in
		// the "defined, but the wrong object" form that a definedness check cannot see.
		it('resolves the same notifier through read and modify', () => {
			const accessors = makeAccessors();

			assert.strictEqual(accessors.getReader().getNotifier(), accessors.getModifier().getNotifier());
		});

		it('resolves the same notifier regardless of which path is touched first', () => {
			const modifyFirst = makeAccessors();
			const viaModify = modifyFirst.getModifier().getNotifier();

			assert.strictEqual(modifyFirst.getReader().getNotifier(), viaModify);

			const readFirst = makeAccessors();
			const viaRead = readFirst.getReader().getNotifier();

			assert.strictEqual(readFirst.getModifier().getNotifier(), viaRead);
		});

		it('resolves a settings reader through both IRead and IEnvironmentRead', () => {
			const accessors = makeAccessors();

			assert.notStrictEqual(accessors.getReader().getEnvironmentReader().getSettings(), undefined);
			assert.notStrictEqual(accessors.getEnvironmentRead().getSettings(), undefined);
		});
	});

	// Pins the exact call the app author reported, at the level the app sees it: a
	// slashcommand executor handed a fresh `IRead` and calling straight through.
	describe('regression: read.getNotifier().notifyUser()', () => {
		const user = { id: 'user-id', username: 'user' } as IUser;
		const room = { id: 'room-id' } as IRoom;
		const message = { room, text: 'hello', sender: user } as IMessage;

		it('does not throw when reached through IRead', async () => {
			const recording = createRecordingSender();
			const read = new AppAccessors(recording.sender).getReader();

			await read.getNotifier().notifyUser(user, message);

			assert.deepStrictEqual(recording.emitted(), [
				{
					method: 'bridges:getMessageBridge:doNotifyUser',
					params: [user, message, 'APP_ID'],
				},
			]);
		});

		it('emits the same traffic through IRead and IModify', async () => {
			const viaRead = createRecordingSender();
			await new AppAccessors(viaRead.sender).getReader().getNotifier().notifyUser(user, message);

			const viaModify = createRecordingSender();
			await new AppAccessors(viaModify.sender).getModifier().getNotifier().notifyUser(user, message);

			assert.deepStrictEqual(viaRead.emitted(), viaModify.emitted());
		});
	});
});
