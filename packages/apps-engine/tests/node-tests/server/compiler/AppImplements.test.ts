import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import { AppInterface } from '../../../../src/definition/metadata';
import { AppImplements } from '../../../../src/server/compiler';

describe('AppImplements', () => {
	it('appImplements', () => {
		assert.doesNotThrow(() => new AppImplements());

		const impls = new AppImplements();

		assert.ok(impls.getValues() !== undefined);
		assert.doesNotThrow(() => impls.setImplements(AppInterface.IPreMessageSentPrevent));
		assert.strictEqual(impls.doesImplement(AppInterface.IPreMessageSentPrevent), true);
		assert.strictEqual(impls.doesImplement(AppInterface.IPostMessageDeleted), false);
		assert.strictEqual(impls.getValues()[AppInterface.IPreMessageSentPrevent], true);
		assert.strictEqual(impls.getValues()[AppInterface.IPostMessageDeleted], false);
	});
});
