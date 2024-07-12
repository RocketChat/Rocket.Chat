import { expect } from 'chai';
import sinon from 'sinon';

import type { ISettingsModel } from '@rocket.chat/model-typings';

import { SettingsRegistry } from '../../../../../app/settings/server/SettingsRegistry';
import { settings } from '../../../../../app/settings/server/cached';

const model = {
	insertOne: sinon.stub(),
	updateOne: sinon.stub(),
} as unknown as ISettingsModel;

const registry = new SettingsRegistry({ store: settings, model });

const testSetting = {
	_id: 'Dummy_setting',
	packageValue: 'test',
	value: 'test',
	group: 'Testing',
	section: 'Registry',
};

function addSetting(maybeSetting?: any) {
	const setting = maybeSetting || testSetting;
	return registry.add(setting._id, setting.packageValue, setting);
}

describe('SettingsRegistry operations', () => {
	describe('#add', () => {
		beforeEach(() => {
			settings.store.clear();
		});

		it('should set the setting value from code when nothing is loaded into the cache and no overwrite available', async () => {
			await addSetting();

			expect(settings.get(testSetting._id)).to.be.equal(testSetting.packageValue);
		});

		it('should NOT set the setting value from code when nothing is loaded into the cache and no overwrite available', async () => {
			settings.set(testSetting as any);

			const settingFromCodeFaked = { ...testSetting, value: 'new value' };

			await addSetting(settingFromCodeFaked);

			expect(settings.get(settingFromCodeFaked._id)).to.be.equal(testSetting.value);
		});

		it('should set the setting value found in environment without OVERWRITE_SETTING_ prefix, if nothing is in cache already', async () => {
			process.env[testSetting._id] = 'overriden value';

			await addSetting();

			expect(settings.get(testSetting._id)).to.be.equal('overriden value');
		});

		it('should NOT set the setting value found in environment without OVERWRITE_SETTING_ prefix, if value is in cache already', async () => {
			settings.set(testSetting as any);

			process.env[testSetting._id] = 'overriden value';

			await addSetting();

			expect(settings.get(testSetting._id)).to.be.equal(testSetting.value);
		});

		it('should update cached value if OVERWRITE_SETTING_ prefix is found', async () => {
			settings.set(testSetting as any);

			process.env[`OVERWRITE_SETTING_${testSetting._id}`] = 'new value';

			await addSetting();

			expect(settings.get(testSetting._id)).to.be.equal('new value');
		});

		it('should update cached value with OVERWRITE_SETTING value even if both with-prefixed and without-prefixed variabled exist', async () => {
			process.env[`OVERWRITE_SETTING_${testSetting._id}`] = 'overwritten';
			process.env[testSetting._id] = 'overriden';

			await addSetting();

			expect(settings.get(testSetting._id)).to.be.equal('overwritten');
		});
	});
});
