import * as assert from 'node:assert';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';

import { RocketChatAssociationModel, RocketChatAssociationRecord } from '../../../../src/definition/metadata';
import { Persistence } from '../../../../src/server/accessors';
import type { PersistenceBridge } from '../../../../src/server/bridges';

describe('Persistence', () => {
	let mockAppId: string;
	let mockPersisBridge: PersistenceBridge;
	let mockAssoc: RocketChatAssociationRecord;
	let data: object;

	beforeEach(() => {
		mockAppId = 'testing-app';
		data = { hello: 'world' };

		const theData = data;
		mockPersisBridge = {
			doCreate(d: any, appId: string): Promise<string> {
				return Promise.resolve('id');
			},
			doCreateWithAssociations(d: any, assocs: Array<RocketChatAssociationRecord>, appId: string): Promise<string> {
				return Promise.resolve('id2');
			},
			doUpdate(id: string, d: object, upsert: boolean, appId: string): Promise<string> {
				return Promise.resolve('id3');
			},
			doRemove(id: string, appId: string): Promise<object> {
				return Promise.resolve(theData);
			},
			doRemoveByAssociations(assocs: Array<RocketChatAssociationRecord>, appId: string): Promise<Array<object>> {
				return Promise.resolve([theData]);
			},
			doUpdateByAssociations(
				associations: Array<RocketChatAssociationRecord>,
				d: object,
				upsert: boolean,
				appId: string,
			): Promise<string> {
				return Promise.resolve('id4');
			},
		} as PersistenceBridge;
		mockAssoc = new RocketChatAssociationRecord(RocketChatAssociationModel.USER, 'fake-id');
	});

	afterEach(() => {
		mock.restoreAll();
	});

	it('usePersistenceAccessor', async () => {
		assert.doesNotThrow(() => new Persistence(mockPersisBridge, mockAppId));

		const sp1 = mock.method(mockPersisBridge, 'doCreate');
		const sp2 = mock.method(mockPersisBridge, 'doCreateWithAssociations');
		const sp3 = mock.method(mockPersisBridge, 'doUpdate');
		const sp4 = mock.method(mockPersisBridge, 'doRemove');
		const sp5 = mock.method(mockPersisBridge, 'doRemoveByAssociations');
		const sp6 = mock.method(mockPersisBridge, 'doUpdateByAssociations');

		const ps = new Persistence(mockPersisBridge, mockAppId);

		assert.strictEqual(await ps.create(data), 'id');
		assert.strictEqual(sp1.mock.calls.length, 1);
		assert.deepStrictEqual(sp1.mock.calls[0].arguments, [data, mockAppId]);

		assert.strictEqual(await ps.createWithAssociation(data, mockAssoc), 'id2');
		assert.strictEqual(await ps.createWithAssociations(data, [mockAssoc]), 'id2');
		assert.strictEqual(sp2.mock.calls.length, 2);

		assert.strictEqual(await ps.update('id', data), 'id3');
		assert.strictEqual(sp3.mock.calls.length, 1);
		assert.deepStrictEqual(sp3.mock.calls[0].arguments, ['id', data, false, mockAppId]);

		assert.deepStrictEqual(await ps.remove('id'), data);
		assert.strictEqual(sp4.mock.calls.length, 1);
		assert.deepStrictEqual(sp4.mock.calls[0].arguments, ['id', mockAppId]);

		assert.ok((await ps.removeByAssociation(mockAssoc)) !== undefined);
		assert.ok((await ps.removeByAssociations([mockAssoc])) !== undefined);
		assert.strictEqual(sp5.mock.calls.length, 2);

		assert.ok((await ps.updateByAssociation(mockAssoc, data)) !== undefined);
		assert.ok((await ps.updateByAssociations([mockAssoc], data)) !== undefined);
		assert.strictEqual(sp6.mock.calls.length, 2);
	});
});
