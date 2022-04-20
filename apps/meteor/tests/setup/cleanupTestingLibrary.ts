import { cleanup } from '@testing-library/react';

/**
 * Usually the testing library attachs its `cleanup` function by itself when an `afterEach` function is present at the
 * global scope. It provides a simple mechanism for, e.g., unmounting React components after tests to avoid leaking
 * memory and breaking the idempotence of subsequent tests. Despite working fine at a single run, when Mocha is run in
 * _watch mode_ all hooks previously attached are discarded and reloaded from **tests files only**, and its supposed to
 * work that way.
 *
 * See https://testing-library.com/docs/react-testing-library/setup#auto-cleanup-in-mochas-watch-mode
 */

export const mochaHooks = {
	afterEach(): void {
		cleanup();
	},
};
