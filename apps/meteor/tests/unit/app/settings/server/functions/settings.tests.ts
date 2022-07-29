import { expect, spy } from 'chai';

import { Settings } from '../../../../../../app/settings/server/functions/settings.mocks';
import { SettingsRegistry } from '../../../../../../app/settings/server/SettingsRegistry';
import { CachedSettings } from '../../../../../../app/settings/server/CachedSettings';

describe('Settings', () => {
	beforeEach(() => {
		Settings.insertCalls = 0;
		Settings.upsertCalls = 0;
		process.env = {};
	});

	it('should not insert the same setting twice', () => {
		const settings = new CachedSettings();
		Settings.settings = settings;
		settings.initilized();
		const settingsRegistry = new SettingsRegistry({ store: settings, model: Settings as any });
		settingsRegistry.addGroup('group', function () {
			this.section('section', function () {
				this.add('my_setting', true, {
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

		settingsRegistry.addGroup('group', function () {
			this.section('section', function () {
				this.add('my_setting', true, {
					type: 'boolean',
					sorter: 0,
				});
			});
		});

		expect(Settings.upsertCalls).to.be.equal(0);
		expect(Settings.insertCalls).to.be.equal(2);

		expect(Settings.findOne({ _id: 'my_setting' }).value).to.be.equal(true);

		settingsRegistry.addGroup('group', function () {
			this.section('section', function () {
				this.add('my_setting2', false, {
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

	it('should respect override via environment as int', () => {
		const settings = new CachedSettings();
		Settings.settings = settings;
		settings.initilized();
		const settingsRegistry = new SettingsRegistry({ store: settings, model: Settings as any });

		process.env.OVERWRITE_SETTING_my_setting = '1';

		settingsRegistry.addGroup('group', function () {
			this.section('section', function () {
				this.add('my_setting', 0, {
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

		settingsRegistry.addGroup('group', function () {
			this.section('section', function () {
				this.add('my_setting', 0, {
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

	it('should respect override via environment as boolean', () => {
		process.env.OVERWRITE_SETTING_my_setting_bool = 'true';

		const settings = new CachedSettings();
		Settings.settings = settings;
		settings.initilized();
		const settingsRegistry = new SettingsRegistry({ store: settings, model: Settings as any });
		settingsRegistry.addGroup('group', function () {
			this.section('section', function () {
				this.add('my_setting_bool', false, {
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

		settingsRegistry.addGroup('group', function () {
			this.section('section', function () {
				this.add('my_setting_bool', true, {
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

	it('should respect override via environment as string', () => {
		process.env.OVERWRITE_SETTING_my_setting_str = 'hey';

		const settings = new CachedSettings();
		Settings.settings = settings;
		settings.initilized();
		const settingsRegistry = new SettingsRegistry({ store: settings, model: Settings as any });
		settingsRegistry.addGroup('group', function () {
			this.section('section', function () {
				this.add('my_setting_str', '', {
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

		settingsRegistry.addGroup('group', function () {
			this.section('section', function () {
				this.add('my_setting_str', 'hey', {
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

	it('should respect initial value via environment', () => {
		process.env.my_setting = '1';
		const settings = new CachedSettings();
		Settings.settings = settings;
		settings.initilized();
		const settingsRegistry = new SettingsRegistry({ store: settings, model: Settings as any });

		settingsRegistry.addGroup('group', function () {
			this.section('section', function () {
				this.add('my_setting', 0, {
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

		settingsRegistry.addGroup('group', function () {
			this.section('section', function () {
				this.add('my_setting', 0, {
					type: 'int',
					sorter: 0,
				});
			});
		});

		expect(Settings.insertCalls).to.be.equal(2);
		expect(Settings.upsertCalls).to.be.equal(0);
		expect(Settings.findOne({ _id: 'my_setting' })).to.include({ ...expectedSetting });
	});

	it('should call `settings.get` callback on setting added', (done) => {
		const settings = new CachedSettings();
		Settings.settings = settings;
		settings.initilized();
		const settingsRegistry = new SettingsRegistry({ store: settings, model: Settings as any });

		const spiedCallback1 = spy();
		const spiedCallback2 = spy();

		settingsRegistry.addGroup('group', function () {
			this.section('section', function () {
				this.add('setting_callback', 'value1', {
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
			done();
		}, settings.getConfig({ debounce: 10 }).debounce);
	});

	it('should call `settings.watch` callback on setting changed registering before initialized', (done) => {
		const spiedCallback1 = spy();
		const spiedCallback2 = spy();
		const settings = new CachedSettings();
		Settings.settings = settings;
		const settingsRegistry = new SettingsRegistry({ store: settings, model: Settings as any });

		settings.watch('setting_callback', spiedCallback1, { debounce: 1 });
		settings.watchByRegex(/setting_callback/gi, spiedCallback2, { debounce: 1 });

		settings.initilized();
		settingsRegistry.addGroup('group', function () {
			this.section('section', function () {
				this.add('setting_callback', 'value2', {
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
				done();
			}, settings.getConfig({ debounce: 10 }).debounce);
		}, settings.getConfig({ debounce: 10 }).debounce);
	});
});
