import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import { RemoteBridges } from '../../../bridges/RemoteBridges';
import { createRecordingSender } from '../../tests/helpers/parityHarness';
import { EnvironmentalVariableRead } from '../EnvironmentalVariableRead';
import { ServerSettingRead } from '../ServerSettingRead';
import { ServerSettingUpdater } from '../ServerSettingUpdater';
import { ServerSettingsModify } from '../ServerSettingsModify';

const setup = (responses = {}) => {
	const rec = createRecordingSender(responses);
	return { rec, bridges: new RemoteBridges(rec.sender) };
};

describe('Environment accessors (base-runtime)', () => {
	describe('ServerSettingRead', () => {
		it('getValueById returns the value when set', async () => {
			const { bridges } = setup({ 'bridges:getServerSettingBridge:doGetOneById': { value: 'v', packageValue: 'pv' } });
			assert.strictEqual(await new ServerSettingRead(bridges).getValueById('s1'), 'v');
		});

		it('getValueById falls back to packageValue when value is null', async () => {
			const nullVal = setup({ 'bridges:getServerSettingBridge:doGetOneById': { value: null, packageValue: 'pv' } });
			assert.strictEqual(await new ServerSettingRead(nullVal.bridges).getValueById('s1'), 'pv');
		});

		it('getValueById falls back to packageValue when value is undefined', async () => {
			const undefinedVal = setup({ 'bridges:getServerSettingBridge:doGetOneById': { value: undefined, packageValue: 'pv' } });
			assert.strictEqual(await new ServerSettingRead(undefinedVal.bridges).getValueById('s1'), 'pv');
		});

		it('getValueById throws when the setting is not found', async () => {
			const { bridges } = setup({ 'bridges:getServerSettingBridge:doGetOneById': undefined });
			await assert.rejects(() => new ServerSettingRead(bridges).getValueById('missing'), /No Server Setting found/);
		});

		it('getAll throws (not implemented), matching the host accessor', () => {
			const { bridges } = setup();
			assert.throws(() => new ServerSettingRead(bridges).getAll(), /Method not implemented/);
		});

		it('getOneById and isReadableById forward verbatim', async () => {
			const { rec, bridges } = setup();
			const read = new ServerSettingRead(bridges);
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
			const { rec, bridges } = setup();
			const env = new EnvironmentalVariableRead(bridges);
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
			const { rec, bridges } = setup();
			await new ServerSettingUpdater(bridges).incrementValue('s1');
			assert.deepStrictEqual(rec.emitted()[0], {
				method: 'bridges:getServerSettingBridge:doIncrementValue',
				params: ['s1', 1, 'APP_ID'],
			});
		});
	});

	describe('ServerSettingsModify', () => {
		it('modifySetting maps to doUpdateOne and incrementValue defaults to 1', async () => {
			const { rec, bridges } = setup();
			const modify = new ServerSettingsModify(bridges);
			await modify.modifySetting({ id: 's1' } as any);
			await modify.incrementValue('s1');
			assert.deepStrictEqual(rec.emitted(), [
				{ method: 'bridges:getServerSettingBridge:doUpdateOne', params: [{ id: 's1' }, 'APP_ID'] },
				{ method: 'bridges:getServerSettingBridge:doIncrementValue', params: ['s1', 1, 'APP_ID'] },
			]);
		});
	});
});
