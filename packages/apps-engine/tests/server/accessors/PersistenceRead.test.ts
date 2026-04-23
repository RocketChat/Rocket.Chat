import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import type { RocketChatAssociationRecord } from '../../../src/definition/metadata';
import { PersistenceRead } from '../../../src/server/accessors';
import type { PersistenceBridge } from '../../../src/server/bridges';

describe('PersistenceRead', () => {
	it('usePersistenceRead', async () => {
		const mockPersisBridge = {
			doReadById(id: string, appId: string): Promise<object> {
				return Promise.resolve({ id, appId });
			},
			doReadByAssociations(assocs: Array<RocketChatAssociationRecord>, appId: string): Promise<Array<object>> {
				return Promise.resolve([{ appId }]);
			},
		} as PersistenceBridge;

		assert.doesNotThrow(() => new PersistenceRead(mockPersisBridge, 'testing'));

		const pr = new PersistenceRead(mockPersisBridge, 'testing');
		assert.deepStrictEqual(await pr.read('thing'), { id: 'thing', appId: 'testing' });
		assert.deepStrictEqual(await pr.readByAssociation({} as RocketChatAssociationRecord), [{ appId: 'testing' }]);
		assert.deepStrictEqual(await pr.readByAssociations([{} as RocketChatAssociationRecord]), [{ appId: 'testing' }]);
	});
});
