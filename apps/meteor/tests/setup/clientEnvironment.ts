import './jsdom';

import { registerHooks } from 'node:module';
import path from 'node:path';
import { afterEach, snapshot } from 'node:test';

import matchers from '@testing-library/jest-dom/matchers';
import { cleanup, prettyDOM } from '@testing-library/react';
import { expect } from 'expect';
import { toHaveNoViolations } from 'jest-axe';

registerHooks({
	resolve(specifier, context, nextResolve) {
		if (specifier.endsWith('.css')) {
			return nextResolve('identity-obj-proxy', context);
		}
		return nextResolve(specifier, context);
	},
});

expect.extend(matchers);
expect.extend(toHaveNoViolations);

afterEach(cleanup);

snapshot.setResolveSnapshotPath((testFile = '') => path.join(path.dirname(testFile), '__snapshots__', `${path.basename(testFile)}.snap`));

// React's useId counter is process-wide, so its ids are renumbered per snapshot to not depend on what rendered before
const renumberReactIds = (text: string): string => {
	const ids = new Map<string, string>();
	return text.replace(/_r_[0-9a-z]+_/g, (id) => {
		if (!ids.has(id)) {
			ids.set(id, `_r_${ids.size}_`);
		}
		return ids.get(id) ?? id;
	});
};

snapshot.setDefaultSnapshotSerializers([
	(value) =>
		value instanceof Element ? renumberReactIds(prettyDOM(value, Infinity, { highlight: false }) || '') : JSON.stringify(value, null, 2),
]);
