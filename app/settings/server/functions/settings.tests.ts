/* eslint-disable @typescript-eslint/camelcase */
/* eslint-env mocha */
import { Meteor } from 'meteor/meteor';
import chai, { expect } from 'chai';
import spies from 'chai-spies';

import { Settings } from './settings.mocks';
import { settings } from './settings';

chai.use(spies);

describe('Settings', () => {
	beforeEach(() => {
		Settings.insertCalls = 0;
		Settings.upsertCalls = 0;
		Settings.data.clear();
		Meteor.settings = { public: {} };
		process.env = {};
	});

	it('should not insert the same setting twice', () => {
		settings.addGroup('group', function() {
			this.section('section', function() {
				this.add('my_setting', true, {
					type: 'boolean',
					sorter: 0,
				});
			});
		});

		expect(Settings.data.size).to.be.equal(2);
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

		settings.addGroup('group', function() {
			this.section('section', function() {
				this.add('my_setting', true, {
					type: 'boolean',
					sorter: 0,
				});
			});
		});

		expect(Settings.data.size).to.be.equal(2);
		expect(Settings.upsertCalls).to.be.equal(0);
		expect(Settings.insertCalls).to.be.equal(2);

		expect(Settings.findOne({ _id: 'my_setting' }).value).to.be.equal(true);

		settings.addGroup('group', function() {
			this.section('section', function() {
				this.add('my_setting2', false, {
					type: 'boolean',
					sorter: 0,
				});
			});
		});

		expect(Settings.data.size).to.be.equal(3);
		expect(Settings.upsertCalls).to.be.equal(0);
		expect(Settings.insertCalls).to.be.equal(3);

		expect(Settings.findOne({ _id: 'my_setting' }).value).to.be.equal(true);
		expect(Settings.findOne({ _id: 'my_setting2' }).value).to.be.equal(false);
	});

	it('should respect override via environment as int', () => {
		process.env.OVERWRITE_SETTING_my_setting = '1';

		settings.addGroup('group', function() {
			this.section('section', function() {
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

		expect(Settings.data.size).to.be.equal(2);
		expect(Settings).to.have.property('insertCalls').to.be.equal(1);
		expect(Settings).to.have.property('upsertCalls').to.be.equal(1);
		expect(Settings.findOne({ _id: 'my_setting' })).to.include(expectedSetting);

		process.env.OVERWRITE_SETTING_my_setting = '2';

		settings.addGroup('group', function() {
			this.section('section', function() {
				this.add('my_setting', 0, {
					type: 'int',
					sorter: 0,
				});
			});
		});

		expect(Settings.data.size).to.be.equal(2);
		expect(Settings).to.have.property('insertCalls').to.be.equal(1);
		expect(Settings).to.have.property('upsertCalls').to.be.equal(2);
		expect(Settings.findOne({ _id: 'my_setting' })).to.include({ ...expectedSetting, value: 2, processEnvValue: 2 });
	});

	it('should respect override via environment as boolean', () => {
		process.env.OVERWRITE_SETTING_my_setting_bool = 'true';

		settings.addGroup('group', function() {
			this.section('section', function() {
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

		expect(Settings.data.size).to.be.equal(2);
		expect(Settings.insertCalls).to.be.equal(1);
		expect(Settings.upsertCalls).to.be.equal(1);
		expect(Settings.findOne({ _id: 'my_setting_bool' })).to.include(expectedSetting);

		process.env.OVERWRITE_SETTING_my_setting_bool = 'false';

		settings.addGroup('group', function() {
			this.section('section', function() {
				this.add('my_setting_bool', true, {
					type: 'boolean',
					sorter: 0,
				});
			});
		});


		expect(Settings.data.size).to.be.equal(2);
		expect(Settings.insertCalls).to.be.equal(1);
		expect(Settings.upsertCalls).to.be.equal(2);
		expect(Settings.findOne({ _id: 'my_setting_bool' })).to.include({
			value: false,
			processEnvValue: false,
			packageValue: true,
		});
	});

	it('should respect override via environment as string', () => {
		process.env.OVERWRITE_SETTING_my_setting_str = 'hey';

		settings.addGroup('group', function() {
			this.section('section', function() {
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

		expect(Settings.data.size).to.be.equal(2);
		expect(Settings.insertCalls).to.be.equal(1);
		expect(Settings.upsertCalls).to.be.equal(1);
		expect(Settings.findOne({ _id: 'my_setting_str' })).to.include(expectedSetting);

		process.env.OVERWRITE_SETTING_my_setting_str = 'hey ho';

		settings.addGroup('group', function() {
			this.section('section', function() {
				this.add('my_setting_str', 'hey', {
					type: 'string',
					sorter: 0,
				});
			});
		});

		expect(Settings.data.size).to.be.equal(2);
		expect(Settings.insertCalls).to.be.equal(1);
		expect(Settings.upsertCalls).to.be.equal(2);
		expect(Settings.findOne({ _id: 'my_setting_str' })).to.include({ ...expectedSetting,
			value: 'hey ho',
			processEnvValue: 'hey ho',
			packageValue: 'hey',
		});
	});

	it('should respect initial value via environment', () => {
		process.env.my_setting = '1';

		settings.addGroup('group', function() {
			this.section('section', function() {
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

		expect(Settings.data.size).to.be.equal(2);
		expect(Settings.insertCalls).to.be.equal(2);
		expect(Settings.upsertCalls).to.be.equal(0);
		expect(Settings.findOne({ _id: 'my_setting' })).to.include(expectedSetting);

		settings.addGroup('group', function() {
			this.section('section', function() {
				this.add('my_setting', 0, {
					type: 'int',
					sorter: 0,
				});
			});
		});

		expect(Settings.data.size).to.be.equal(2);
		expect(Settings.insertCalls).to.be.equal(2);
		expect(Settings.upsertCalls).to.be.equal(0);
		expect(Settings.findOne({ _id: 'my_setting' })).to.include({ ...expectedSetting });
	});


	it('should call `settings.get` callback on setting added', () => {
		settings.addGroup('group', function() {
			this.section('section', function() {
				this.add('setting_callback', 'value1', {
					type: 'string',
				});
			});
		});

		const spy = chai.spy();
		settings.get('setting_callback', spy);
		settings.get(/setting_callback/, spy);

		expect(spy).to.have.been.called.exactly(2);
		expect(spy).to.have.been.called.always.with('setting_callback', 'value1');
	});

	it('should call `settings.get` callback on setting changed', () => {
		const spy = chai.spy();
		const spy2 = chai.spy();
		settings.get('setting_callback', spy);
		settings.get(/setting_callback/, spy2);

		settings.addGroup('group', function() {
			this.section('section', function() {
				this.add('setting_callback', 'value2', {
					type: 'string',
				});
			});
		});

		settings.updateById('setting_callback', 'value3');
		expect(spy).to.have.been.called.exactly(3); // TODO should be 2
		expect(spy2).to.have.been.called.exactly(3); // TODO should be 2
		expect(spy).to.have.been.called.with('setting_callback', 'value2');
		expect(spy).to.have.been.called.with('setting_callback', 'value3');
	});
});
