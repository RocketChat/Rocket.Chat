import type { ISettingsModel } from '@rocket.chat/model-typings';
import { expect, spy } from 'chai';
import sinon from 'sinon';

import { SettingsRegistry, compareSettingsMetadata } from '../../../../app/settings/server/SettingsRegistry';
import { settings } from '../../../../app/settings/server/cached';
import { getSettingDefaults } from '../../../../app/settings/server/functions/getSettingDefaults';

const model = {
	insertOne: sinon.stub(),
	findOneAndUpdate: sinon.stub(),
} as unknown as ISettingsModel;

const registry = new SettingsRegistry({ store: settings, model });

const testSetting = getSettingDefaults({
	_id: 'Dummy_setting',
	type: 'string',
	packageValue: 'test',
	value: 'test',
	group: 'Testing',
	section: 'Registry',
	enterprise: false,
});

function addSetting(maybeSetting?: any) {
	const setting = maybeSetting || testSetting;
	return registry.add(setting._id, setting.packageValue, setting);
}

(model.findOneAndUpdate as ReturnType<typeof sinon.stub>).returns({ value: {} });

Object.keys(model).forEach((key) => spy.on(model, key));

describe('SettingsRegistry operations', () => {
	describe('#add', () => {
		beforeEach(() => {
			settings.store.clear();
		});

		it('should set the setting value from code when nothing is loaded into the cache and no overwrite available', async () => {
			await addSetting();

			expect(settings.get(testSetting._id)).to.be.equal(testSetting.packageValue);
			expect(model.insertOne).to.be.called();
		});

		it('should NOT set the setting value from code when setting is loaded into the cache and no overwrite available', async () => {
			settings.set(testSetting as any);

			const settingFromCodeFaked = { ...testSetting, value: Date.now().toString() };

			await addSetting(settingFromCodeFaked);

			expect(settings.get(testSetting._id)).to.be.equal(testSetting.value);
		});

		it('should set the setting value found in environment without OVERWRITE_SETTING_ prefix, if nothing is in cache already', async () => {
			process.env[testSetting._id] = Date.now().toString();

			await addSetting();

			expect(model.insertOne).to.be.called();

			expect(settings.get(testSetting._id)).to.be.equal(process.env[testSetting._id]);
		});

		it('should NOT set the setting value found in environment without OVERWRITE_SETTING_ prefix, if value is in cache already', async () => {
			settings.set(testSetting as any);

			process.env[testSetting._id] = Date.now().toString();

			await addSetting();

			expect(settings.get(testSetting._id)).to.be.equal(testSetting.value);
		});

		it('should update cached value if OVERWRITE_SETTING_ prefix is found', async () => {
			settings.set(testSetting as any);

			process.env[`OVERWRITE_SETTING_${testSetting._id}`] = Date.now().toString();

			await addSetting();

			expect(model.findOneAndUpdate).to.be.called();
		});

		it('should update cached value with OVERWRITE_SETTING value even if both with-prefixed and without-prefixed variables exist', async () => {
			process.env[`OVERWRITE_SETTING_${testSetting._id}`] = Date.now().toString();
			process.env[testSetting._id] = Date.now().toString();

			await addSetting();

			expect(model.findOneAndUpdate).to.be.called();
		});
	});

	describe('#compareSettingsMetadata', () => {
		const ignoredKeys = ['value', 'ts', 'createdAt', 'valueSource', 'packageValue', 'processEnvValue', '_updatedAt'];

		ignoredKeys.forEach((key) =>
			it(`should return true if ${key} changes`, () => {
				const copiedSetting: any = { ...testSetting };

				if (['ts', 'createdAt', '_updatedAt'].includes(key)) {
					copiedSetting[key] = new Date();
				} else {
					copiedSetting[key] = 'random';
				}

				expect(compareSettingsMetadata(testSetting, copiedSetting)).to.be.true;
			}),
		);
	});
});
