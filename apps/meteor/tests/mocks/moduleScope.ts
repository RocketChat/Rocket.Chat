import { mock } from 'node:test';

// Test files share one module cache when they run in the same process. A suite that mocks modules loads its subject in its own scope, as each Jest test file gets its own module registry.

let saved: NodeJS.Dict<NodeModule> | undefined;

export const enterModuleScope = (): void => {
	saved = { ...require.cache };
	for (const id of Object.keys(require.cache)) {
		if (!id.includes('/node_modules/')) {
			delete require.cache[id];
		}
	}
};

export const leaveModuleScope = (): void => {
	mock.restoreAll();
	for (const id of Object.keys(require.cache)) {
		delete require.cache[id];
	}
	Object.assign(require.cache, saved);
	saved = undefined;
};
