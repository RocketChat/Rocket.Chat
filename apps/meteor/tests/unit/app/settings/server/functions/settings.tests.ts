import { expect, spy } from 'chai';
import { beforeEach, describe, it } from 'mocha';

import { CachedSettings } from '../../../../../../app/settings/server/CachedSettings';
import { SettingsRegistry } from '../../../../../../app/settings/server/SettingsRegistry';
import { getSettingDefaults } from '../../../../../../app/settings/server/functions/getSettingDefaults';
import { Settings } from '../../../../../../app/settings/server/functions/settings.mocks';

const testSetting = getSettingDefaults({
	_id: 'my_dummy_setting',
	type: 'string',
	value: 'dummy',
});

describe('Settings', () => {
	beforeEach(() => {
		Settings.insertCalls = 0;
		Settings.upsertCalls = 0;
		process.env = {};
		Settings.setDelay(0);
	});

	it('should not insert the same setting twice', async () => {
		const settings = new CachedSettings();
		Settings.settings = settings;
		settings.initialized();
		const settingsRegistry = new SettingsRegistry({ store: settings, model: Settings as any });
		await settingsRegistry.addGroup('group', async function () {
			await this.section('section', async function () {
				await this.add('my_setting', true, {
					type: 'boolean',
					sorter: 0,
				});
			});
		});

		expect(Settings.upsertCalls).to.be.equal(0);
		expect(Settings.insertCalls).to.be.equal(2);

		expect(Settings.findOne({ _id: 'my_setting' })).to.be.include({
			type: 'boolean',
			sorter: 0,
			group: 'group',
			section: 'section',
			packageValue: true,
			value: true,
			valueSource: 'packageValue',
			hidden: false,
			blocked: false,
			secret: false,
			i18nLabel: 'my_setting',
			i18nDescription: 'my_setting_Description',
			autocomplete: true,
		});

		await settingsRegistry.addGroup('group', async function () {
			await this.section('section', async function () {
				await this.add('my_setting', true, {
					type: 'boolean',
					sorter: 0,
				});
			});
		});

		expect(Settings.upsertCalls).to.be.equal(0);
		expect(Settings.insertCalls).to.be.equal(2);

		expect(Settings.findOne({ _id: 'my_setting' }).value).to.be.equal(true);

		await settingsRegistry.addGroup('group', async function () {
			await this.section('section', async function () {
				await this.add('my_setting2', false, {
					type: 'boolean',
					sorter: 0,
				});
			});
		});

		expect(Settings.upsertCalls).to.be.equal(0);
		expect(Settings.insertCalls).to.be.equal(3);

		expect(Settings.findOne({ _id: 'my_setting' }).value).to.be.equal(true);
		expect(Settings.findOne({ _id: 'my_setting2' }).value).to.be.equal(false);
	});

	it('should respect override via environment as int', async () => {
		const settings = new CachedSettings();
		Settings.settings = settings;
		settings.initialized();
		const settingsRegistry = new SettingsRegistry({ store: settings, model: Settings as any });

		process.env.OVERWRITE_SETTING_my_setting = '1';

		await settingsRegistry.addGroup('group', async function () {
			await this.section('section', async function () {
				await this.add('my_setting', 0, {
					type: 'int',
					sorter: 0,
				});
			});
		});

		const expectedSetting = {
			value: 1,
			processEnvValue: 1,
			valueSource: 'processEnvValue',
			type: 'int',
			sorter: 0,
			group: 'group',
			section: 'section',
			packageValue: 0,
			hidden: false,
			blocked: false,
			secret: false,
			i18nLabel: 'my_setting',
			i18nDescription: 'my_setting_Description',
			autocomplete: true,
		};

		expect(Settings).to.have.property('insertCalls').to.be.equal(2);
		expect(Settings).to.have.property('upsertCalls').to.be.equal(0);
		expect(Settings.findOne({ _id: 'my_setting' })).to.include(expectedSetting);

		process.env.OVERWRITE_SETTING_my_setting = '2';

		await settingsRegistry.addGroup('group', async function () {
			await this.section('section', async function () {
				await this.add('my_setting', 0, {
					type: 'int',
					sorter: 0,
				});
			});
		});

		expect(Settings).to.have.property('insertCalls').to.be.equal(2);
		expect(Settings).to.have.property('upsertCalls').to.be.equal(1);
		expect(Settings.findOne({ _id: 'my_setting' })).to.include({
			...expectedSetting,
			value: 2,
			processEnvValue: 2,
		});
	});

	it('should respect override via environment as boolean', async () => {
		process.env.OVERWRITE_SETTING_my_setting_bool = 'true';

		const settings = new CachedSettings();
		Settings.settings = settings;
		settings.initialized();
		const settingsRegistry = new SettingsRegistry({ store: settings, model: Settings as any });
		await settingsRegistry.addGroup('group', async function () {
			await this.section('section', async function () {
				await this.add('my_setting_bool', false, {
					type: 'boolean',
					sorter: 0,
				});
			});
		});

		const expectedSetting = {
			value: true,
			processEnvValue: true,
			valueSource: 'processEnvValue',
			type: 'boolean',
			sorter: 0,
			group: 'group',
			section: 'section',
			packageValue: false,
			hidden: false,
			blocked: false,
			secret: false,
			i18nLabel: 'my_setting_bool',
			i18nDescription: 'my_setting_bool_Description',
			autocomplete: true,
		};

		expect(Settings.insertCalls).to.be.equal(2);
		expect(Settings.upsertCalls).to.be.equal(0);
		expect(Settings.findOne({ _id: 'my_setting_bool' })).to.include(expectedSetting);

		process.env.OVERWRITE_SETTING_my_setting_bool = 'false';

		await settingsRegistry.addGroup('group', async function () {
			await this.section('section', async function () {
				await this.add('my_setting_bool', true, {
					type: 'boolean',
					sorter: 0,
				});
			});
		});

		expect(Settings.insertCalls).to.be.equal(2);
		expect(Settings.upsertCalls).to.be.equal(1);
		expect(Settings.findOne({ _id: 'my_setting_bool' })).to.include({
			value: false,
			processEnvValue: false,
			packageValue: true,
		});
	});

	it('should respect override via environment as string', async () => {
		process.env.OVERWRITE_SETTING_my_setting_str = 'hey';

		const settings = new CachedSettings();
		Settings.settings = settings;
		settings.initialized();
		const settingsRegistry = new SettingsRegistry({ store: settings, model: Settings as any });
		await settingsRegistry.addGroup('group', async function () {
			await this.section('section', async function () {
				await this.add('my_setting_str', '', {
					type: 'string',
					sorter: 0,
				});
			});
		});

		const expectedSetting = {
			value: 'hey',
			processEnvValue: 'hey',
			valueSource: 'processEnvValue',
			type: 'string',
			sorter: 0,
			group: 'group',
			section: 'section',
			packageValue: '',
			hidden: false,
			blocked: false,
			secret: false,
			i18nLabel: 'my_setting_str',
			i18nDescription: 'my_setting_str_Description',
			autocomplete: true,
		};

		expect(Settings.insertCalls).to.be.equal(2);
		expect(Settings.upsertCalls).to.be.equal(0);
		expect(Settings.findOne({ _id: 'my_setting_str' })).to.include(expectedSetting);

		process.env.OVERWRITE_SETTING_my_setting_str = 'hey ho';

		await settingsRegistry.addGroup('group', async function () {
			await this.section('section', async function () {
				await this.add('my_setting_str', 'hey', {
					type: 'string',
					sorter: 0,
				});
			});
		});

		expect(Settings.insertCalls).to.be.equal(2);
		expect(Settings.upsertCalls).to.be.equal(1);
		expect(Settings.findOne({ _id: 'my_setting_str' })).to.include({
			...expectedSetting,
			value: 'hey ho',
			processEnvValue: 'hey ho',
			packageValue: 'hey',
		});
	});

	it('should work with a setting type multiSelect with a default value', async () => {
		const settings = new CachedSettings();
		Settings.settings = settings;
		settings.initialized();
		const settingsRegistry = new SettingsRegistry({ store: settings, model: Settings as any });
		await settingsRegistry.addGroup('group', async function () {
			await this.section('section', async function () {
				await this.add('my_setting_multiselect', ['a'], {
					type: 'multiSelect',
					sorter: 0,
					values: [
						{ key: 'a', i18nLabel: 'a' },
						{ key: 'b', i18nLabel: 'b' },
						{ key: 'c', i18nLabel: 'c' },
					],
				});
			});
		});

		expect(Settings.insertCalls).to.be.equal(2);
		expect(Settings.upsertCalls).to.be.equal(0);
		expect(Settings.findOne({ _id: 'my_setting_multiselect' }).value).to.be.deep.equal(['a']);
	});
	it('should respect override via environment as multiSelect', async () => {
		process.env.OVERWRITE_SETTING_my_setting_multiselect = '["a","b"]';

		const settings = new CachedSettings();
		Settings.settings = settings;
		settings.initialized();
		const settingsRegistry = new SettingsRegistry({ store: settings, model: Settings as any });

		await settingsRegistry.addGroup('group', async function () {
			await this.section('section', async function () {
				await this.add('my_setting_multiselect', ['a'], {
					type: 'multiSelect',
					sorter: 0,
					values: [
						{ key: 'a', i18nLabel: 'a' },
						{ key: 'b', i18nLabel: 'b' },
						{ key: 'c', i18nLabel: 'c' },
					],
				});
			});
		});

		expect(Settings.insertCalls).to.be.equal(2);
		expect(Settings.upsertCalls).to.be.equal(0);
		expect(Settings.findOne({ _id: 'my_setting_multiselect' }).value).to.be.deep.equal(['a', 'b']);
		expect(Settings.findOne({ _id: 'my_setting_multiselect' }).processEnvValue).to.be.deep.equal(['a', 'b']);
		expect(Settings.findOne({ _id: 'my_setting_multiselect' }).valueSource).to.be.equal('processEnvValue');
	});

	it('should ignore override via environment as multiSelect if value is invalid', async () => {
		process.env.OVERWRITE_SETTING_my_setting_multiselect = '[INVALID_ARRAY]';

		const settings = new CachedSettings();
		Settings.settings = settings;
		settings.initialized();
		const settingsRegistry = new SettingsRegistry({ store: settings, model: Settings as any });

		await settingsRegistry.addGroup('group', async function () {
			await this.section('section', async function () {
				await this.add('my_setting_multiselect', ['a'], {
					type: 'multiSelect',
					sorter: 0,
					values: [
						{ key: 'a', i18nLabel: 'a' },
						{ key: 'b', i18nLabel: 'b' },
						{ key: 'c', i18nLabel: 'c' },
					],
				});
			});
		});

		expect(Settings.insertCalls).to.be.equal(2);
		expect(Settings.upsertCalls).to.be.equal(0);
		expect(Settings.findOne({ _id: 'my_setting_multiselect' }).value).to.be.deep.equal(['a']);
		expect(Settings.findOne({ _id: 'my_setting_multiselect' }).processEnvValue).to.be.equal(undefined);
		expect(Settings.findOne({ _id: 'my_setting_multiselect' }).valueSource).to.be.equal('packageValue');
	});

	it('should respect initial value via environment', async () => {
		process.env.my_setting = '1';
		const settings = new CachedSettings();
		Settings.settings = settings;
		settings.initialized();
		const settingsRegistry = new SettingsRegistry({ store: settings, model: Settings as any });

		await settingsRegistry.addGroup('group', async function () {
			await this.section('section', async function () {
				await this.add('my_setting', 0, {
					type: 'int',
					sorter: 0,
				});
			});
		});

		const expectedSetting = {
			value: 1,
			processEnvValue: 1,
			valueSource: 'processEnvValue',
			type: 'int',
			sorter: 0,
			group: 'group',
			section: 'section',
			packageValue: 0,
			hidden: false,
			blocked: false,
			secret: false,
			i18nLabel: 'my_setting',
			i18nDescription: 'my_setting_Description',
			autocomplete: true,
		};

		expect(Settings.insertCalls).to.be.equal(2);
		expect(Settings.upsertCalls).to.be.equal(0);
		expect(Settings.findOne({ _id: 'my_setting' })).to.include(expectedSetting);

		await settingsRegistry.addGroup('group', async function () {
			await this.section('section', async function () {
				await this.add('my_setting', 0, {
					type: 'int',
					sorter: 0,
				});
			});
		});

		expect(Settings.insertCalls).to.be.equal(2);
		expect(Settings.upsertCalls).to.be.equal(0);
		expect(Settings.findOne({ _id: 'my_setting' })).to.include({ ...expectedSetting });
	});

	it('should respect override via environment when changing settings props', async () => {
		const settings = new CachedSettings();
		Settings.settings = settings;
		settings.initialized();
		const settingsRegistry = new SettingsRegistry({ store: settings, model: Settings as any });

		await settingsRegistry.addGroup('group', async function () {
			await this.section('section', async function () {
				await this.add('my_setting', 0, {
					type: 'int',
					sorter: 0,
				});
			});
		});

		const expectedSetting = {
			value: 0,
			type: 'int',
			sorter: 0,
			group: 'group',
			section: 'section',
			packageValue: 0,
			hidden: false,
			blocked: false,
			secret: false,
			i18nLabel: 'my_setting',
			i18nDescription: 'my_setting_Description',
			autocomplete: true,
		};

		expect(Settings.insertCalls).to.be.equal(2);
		expect(Settings.upsertCalls).to.be.equal(0);
		expect(Settings.findOne({ _id: 'my_setting' })).to.include(expectedSetting);

		process.env.OVERWRITE_SETTING_my_setting = '1';
		await settingsRegistry.addGroup('group', async function () {
			// removed section
			await this.add('my_setting', 0, {
				type: 'int',
				sorter: 0,
			});
		});

		expect(Settings.insertCalls).to.be.equal(2);
		expect(Settings.upsertCalls).to.be.equal(1);

		const { section: _section, ...removedSection } = expectedSetting;

		const settingWithoutSection = {
			...removedSection,
			value: 1,
			processEnvValue: 1,
			valueSource: 'processEnvValue',
		};

		expect(Settings.findOne({ _id: 'my_setting' }))
			.to.include({ ...settingWithoutSection })
			.to.not.have.any.keys('section');
	});

	it('should ignore setting object from code if only value changes in code and setting already stored', async () => {
		const settings = new CachedSettings();
		Settings.settings = settings;
		settings.initialized();
		const settingsRegistry = new SettingsRegistry({ store: settings, model: Settings as any });

		await settingsRegistry.add(testSetting._id, testSetting.value, testSetting);

		expect(Settings.insertCalls).to.be.equal(1);
		Settings.insertCalls = 0;

		const settingFromCodeFaked = { ...testSetting, value: Date.now().toString() };

		await settingsRegistry.add(settingFromCodeFaked._id, settingFromCodeFaked.value, settingFromCodeFaked);

		expect(Settings.insertCalls).to.be.equal(0);
		expect(Settings.upsertCalls).to.be.equal(0);
	});

	it('should not update (reset) cached setting with value in code if some prop in code changes (including value)', async () => {
		Settings.setDelay(1000);
		const settings = new CachedSettings();
		process.env[`OVERWRITE_SETTING_${testSetting._id}`] = 'false';
		const storedSetting = { ...testSetting, value: true, packageValue: true };
		settings.set(storedSetting);

		Settings.settings = settings;

		settings.initialized();

		expect(settings.get(storedSetting._id)).to.be.equal(true);

		const settingsRegistry = new SettingsRegistry({ store: settings, model: Settings as any });

		const settingFromCodeFaked = {
			...storedSetting,
			value: true,
			enterprise: true,
			invalidValue: '',
		};

		await settingsRegistry.add(settingFromCodeFaked._id, settingFromCodeFaked.value, settingFromCodeFaked);

		expect(Settings.insertCalls).to.be.equal(0);
		expect(Settings.upsertCalls).to.be.equal(1);

		expect(settings.get(storedSetting._id)).to.be.equal(false);
	});

	it('should update cached setting with value from environment if some prop including value in code changes', async () => {
		const settings = new CachedSettings();
		Settings.settings = settings;
		settings.initialized();
		const settingsRegistry = new SettingsRegistry({ store: settings, model: Settings as any });

		await settingsRegistry.add(testSetting._id, testSetting.value, testSetting);

		expect(Settings.insertCalls).to.be.equal(1);
		Settings.insertCalls = 0;

		const settingFromCodeFaked = { ...testSetting, value: Date.now().toString(), enterprise: true, invalidValue: '' };

		process.env[`OVERWRITE_SETTING_${testSetting._id}`] = Date.now().toString();

		await settingsRegistry.add(settingFromCodeFaked._id, settingFromCodeFaked.value, settingFromCodeFaked);

		expect(Settings.insertCalls).to.be.equal(0);
		expect(Settings.upsertCalls).to.be.equal(1);

		expect(settings.get(testSetting._id)).to.be.equal(process.env[`OVERWRITE_SETTING_${testSetting._id}`]);
	});

	it('should ignore default value from environment if setting is already stored', async () => {
		const settings = new CachedSettings();
		Settings.settings = settings;
		settings.initialized();
		const settingsRegistry = new SettingsRegistry({ store: settings, model: Settings as any });

		await settingsRegistry.add(testSetting._id, testSetting.value, testSetting);

		process.env[testSetting._id] = Date.now().toString();

		await settingsRegistry.add(testSetting._id, testSetting.value, testSetting);

		expect(Settings.findOne({ _id: testSetting._id }).value).to.be.equal(testSetting.value);
	});

	it('should update setting cache synchronously if overwrite is available in environment', async () => {
		const settings = new CachedSettings();
		Settings.settings = settings;
		settings.initialized();
		const settingsRegistry = new SettingsRegistry({ store: settings, model: Settings as any });

		settings.set(testSetting);

		process.env[`OVERWRITE_SETTING_${testSetting._id}`] = Date.now().toString();

		await settingsRegistry.add(testSetting._id, testSetting.value, testSetting);

		expect(settings.get(testSetting._id)).to.be.equal(process.env[`OVERWRITE_SETTING_${testSetting._id}`]);
	});

	it('should update cached value with OVERWRITE_SETTING value even if both overwrite and default overwrite variables both exist', async () => {
		const settings = new CachedSettings();
		Settings.settings = settings;
		settings.initialized();
		const settingsRegistry = new SettingsRegistry({ store: settings, model: Settings as any });

		process.env[`OVERWRITE_SETTING_${testSetting._id}`] = Date.now().toString();
		process.env[testSetting._id] = Date.now().toString();

		await settingsRegistry.add(testSetting._id, testSetting.value, testSetting);

		expect(Settings.insertCalls).to.be.equal(1);
		expect(settings.get(testSetting._id)).to.be.equal(process.env[`OVERWRITE_SETTING_${testSetting._id}`]);
	});

	it('should call `settings.get` callback on setting added', async () => {
		return new Promise(async (resolve) => {
			const settings = new CachedSettings();
			Settings.settings = settings;
			settings.initialized();
			const settingsRegistry = new SettingsRegistry({ store: settings, model: Settings as any });

			const spiedCallback1 = spy();
			const spiedCallback2 = spy();

			await settingsRegistry.addGroup('group', async function () {
				await this.section('section', async function () {
					await this.add('setting_callback', 'value1', {
						type: 'string',
					});
				});
			});

			settings.watch('setting_callback', spiedCallback1, { debounce: 10 });
			settings.watchByRegex(/setting_callback/, spiedCallback2, { debounce: 10 });

			setTimeout(() => {
				expect(spiedCallback1).to.have.been.called.exactly(1);
				expect(spiedCallback2).to.have.been.called.exactly(1);
				expect(spiedCallback1).to.have.been.called.always.with('value1');
				expect(spiedCallback2).to.have.been.called.always.with('setting_callback', 'value1');
				resolve();
			}, settings.getConfig({ debounce: 10 }).debounce);
		});
	});

	it('should call `settings.watch` callback on setting changed registering before initialized', async () => {
		return new Promise(async (resolve) => {
			const spiedCallback1 = spy();
			const spiedCallback2 = spy();
			const settings = new CachedSettings();
			Settings.settings = settings;
			const settingsRegistry = new SettingsRegistry({ store: settings, model: Settings as any });

			settings.watch('setting_callback', spiedCallback1, { debounce: 1 });
			settings.watchByRegex(/setting_callback/gi, spiedCallback2, { debounce: 1 });

			settings.initialized();
			await settingsRegistry.addGroup('group', async function () {
				await this.section('section', async function () {
					await this.add('setting_callback', 'value2', {
						type: 'string',
					});
				});
			});
			setTimeout(() => {
				Settings.updateValueById('setting_callback', 'value3');
				setTimeout(() => {
					expect(spiedCallback1).to.have.been.called.exactly(2);
					expect(spiedCallback2).to.have.been.called.exactly(2);
					expect(spiedCallback1).to.have.been.called.with('value2');
					expect(spiedCallback1).to.have.been.called.with('value3');
					resolve();
				}, settings.getConfig({ debounce: 10 }).debounce);
			}, settings.getConfig({ debounce: 10 }).debounce);
		});
	});

	it('should update the stored value on setting change', async () => {
		Settings.setDelay(10);
		process.env[`OVERWRITE_SETTING_${testSetting._id}`] = 'false';
		const settings = new CachedSettings();
		Settings.settings = settings;

		settings.set(testSetting);
		settings.initialized();

		const settingsRegistry = new SettingsRegistry({ store: settings, model: Settings as any });
		await settingsRegistry.add(testSetting._id, testSetting.value, testSetting);

		expect(settings.get(testSetting._id)).to.be.equal(false);
	});
});
