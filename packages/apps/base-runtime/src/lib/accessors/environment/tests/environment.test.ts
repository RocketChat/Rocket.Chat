import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import { createRecordingSender } from '../../tests/helpers/parityHarness';
import { EnvironmentalVariableRead } from '../EnvironmentalVariableRead';
import { ServerSettingRead } from '../ServerSettingRead';
import { ServerSettingUpdater } from '../ServerSettingUpdater';
import { ServerSettingsModify } from '../ServerSettingsModify';

const setup = (responses = {}) => {
	const rec = createRecordingSender(responses);
	return { rec, senderFn: rec.sender };
};

describe('Environment accessors (base-runtime)', () => {
	describe('ServerSettingRead', () => {
		it('getValueById returns the value when set', async () => {
			const { senderFn } = setup({ 'bridges:getServerSettingBridge:doGetOneById': { value: 'v', packageValue: 'pv' } });
			assert.strictEqual(await new ServerSettingRead(senderFn).getValueById('s1'), 'v');
		});

		it('getValueById falls back to packageValue when value is null', async () => {
			const nullVal = setup({ 'bridges:getServerSettingBridge:doGetOneById': { value: null, packageValue: 'pv' } });
			assert.strictEqual(await new ServerSettingRead(nullVal.senderFn).getValueById('s1'), 'pv');
		});

		it('getValueById falls back to packageValue when value is undefined', async () => {
			const undefinedVal = setup({ 'bridges:getServerSettingBridge:doGetOneById': { value: undefined, packageValue: 'pv' } });
			assert.strictEqual(await new ServerSettingRead(undefinedVal.senderFn).getValueById('s1'), 'pv');
		});

		it('getValueById throws when the setting is not found', async () => {
			const { senderFn } = setup({ 'bridges:getServerSettingBridge:doGetOneById': undefined });
			await assert.rejects(() => new ServerSettingRead(senderFn).getValueById('missing'), /No Server Setting found/);
		});

		it('getAll throws (not implemented), matching the host accessor', () => {
			const { senderFn } = setup();
			assert.throws(() => new ServerSettingRead(senderFn).getAll(), /Method not implemented/);
		});

		it('getOneById and isReadableById forward verbatim', async () => {
			const { rec, senderFn } = setup();
			const read = new ServerSettingRead(senderFn);
			await read.getOneById('s1');
			await read.isReadableById('s1');
			assert.deepStrictEqual(rec.emitted(), [
				{ method: 'bridges:getServerSettingBridge:doGetOneById', params: ['s1', 'APP_ID'] },
				{ method: 'bridges:getServerSettingBridge:doIsReadableById', params: ['s1', 'APP_ID'] },
			]);
		});
	});

	describe('EnvironmentalVariableRead', () => {
		it('forwards each method to its bridge call', async () => {
			const { rec, senderFn } = setup();
			const env = new EnvironmentalVariableRead(senderFn);
			await env.getValueByName('X');
			await env.isReadable('X');
			await env.isSet('X');
			assert.deepStrictEqual(rec.methods(), [
				'bridges:getEnvironmentalVariableBridge:doGetValueByName',
				'bridges:getEnvironmentalVariableBridge:doIsReadable',
				'bridges:getEnvironmentalVariableBridge:doIsSet',
			]);
		});
	});

	describe('ServerSettingUpdater', () => {
		it('incrementValue defaults the amount to 1', async () => {
			const { rec, senderFn } = setup();
			await new ServerSettingUpdater(senderFn).incrementValue('s1');
			assert.deepStrictEqual(rec.emitted()[0], {
				method: 'bridges:getServerSettingBridge:doIncrementValue',
				params: ['s1', 1, 'APP_ID'],
			});
		});
	});

	describe('ServerSettingsModify', () => {
		it('modifySetting maps to doUpdateOne and incrementValue defaults to 1', async () => {
			const { rec, senderFn } = setup();
			const modify = new ServerSettingsModify(senderFn);
			await modify.modifySetting({ id: 's1' } as any);
			await modify.incrementValue('s1');
			assert.deepStrictEqual(rec.emitted(), [
				{ method: 'bridges:getServerSettingBridge:doUpdateOne', params: [{ id: 's1' }, 'APP_ID'] },
				{ method: 'bridges:getServerSettingBridge:doIncrementValue', params: ['s1', 1, 'APP_ID'] },
			]);
		});
	});
});
