import _ from 'underscore';
import s from 'underscore.string';

import { AppEvents } from '../communication';


Template.appManage.onCreated(function() {
	const instance = this;
	this.id = new ReactiveVar(FlowRouter.getParam('appId'));
	this.ready = new ReactiveVar(false);
	this.hasError = new ReactiveVar(false);
	this.theError = new ReactiveVar('');
	this.processingEnabled = new ReactiveVar(false);
	this.app = new ReactiveVar({});
	this.settings = new ReactiveVar({});
	this.loading = new ReactiveVar(false);

	const id = this.id.get();

	function _morphSettings(settings) {
		Object.keys(settings).forEach((k) => {
			settings[k].i18nPlaceholder = settings[k].i18nPlaceholder || ' ';
			settings[k].value = settings[k].value !== undefined ? settings[k].value : settings[k].packageValue;
			settings[k].oldValue = settings[k].value;
			settings[k].hasChanged = false;
		});

		instance.settings.set(settings);
	}

	Promise.all([
		RocketChat.API.get(`apps/${ id }`),
		RocketChat.API.get(`apps/${ id }/settings`)
	]).then((results) => {
		instance.app.set(results[0].app);
		console.log(instance.app.get());
		_morphSettings(results[1].settings);

		this.ready.set(true);
	}).catch((e) => {
		instance.hasError.set(true);
		instance.theError.set(e.message);
	});

	instance.onStatusChanged = function _onStatusChanged({ appId, status }) {
		if (appId !== id) {
			return;
		}

		const app = instance.app.get();
		app.status = status;
		instance.app.set(app);
	};

	instance.onSettingUpdated = function _onSettingUpdated({ appId }) {
		if (appId !== id) {
			return;
		}

		RocketChat.API.get(`apps/${ id }/settings`).then((result) => {
			_morphSettings(result.settings);
		});
	};

	window.Apps.getWsListener().registerListener(AppEvents.APP_STATUS_CHANGE, instance.onStatusChanged);
	window.Apps.getWsListener().registerListener(AppEvents.APP_SETTING_UPDATED, instance.onSettingUpdated);
});

Template.apps.onDestroyed(function() {
	const instance = this;

	window.Apps.getWsListener().unregisterListener(AppEvents.APP_STATUS_CHANGE, instance.onStatusChanged);
	window.Apps.getWsListener().unregisterListener(AppEvents.APP_SETTING_UPDATED, instance.onSettingUpdated);
});

Template.appManage.helpers({
	disabled() {
		const t = Template.instance();
		const settings = t.settings.get();
		return !Object.keys(settings).some((k) => settings[k].hasChanged);
	},
	isReady() {
		if (Template.instance().ready) {
			return Template.instance().ready.get();
		}

		return false;
	},
	hasError() {
		if (Template.instance().hasError) {
			return Template.instance().hasError.get();
		}

		return false;
	},
	theError() {
		if (Template.instance().theError) {
			return Template.instance().theError.get();
		}

		return '';
	},
	isProcessingEnabled() {
		if (Template.instance().processingEnabled) {
			return Template.instance().processingEnabled.get();
		}

		return false;
	},
	isEnabled() {
		if (!Template.instance().app) {
			return false;
		}

		const info = Template.instance().app.get();

		return info.status === 'auto_enabled' || info.status === 'manually_enabled';
	},
	app() {
		return Template.instance().app.get();
	},
	settings() {
		return Object.values(Template.instance().settings.get());
	},
	parseDescription(i18nDescription) {
		const item = RocketChat.Markdown.parseMessageNotEscaped({ html: t(i18nDescription) });

		item.tokens.forEach((t) => item.html = item.html.replace(t.token, t.text));

		return item.html;
	},
	saving() {
		return Template.instance().loading.get();
	}
});

Template.appManage.events({
	'click .expand': (e) => {
		$(e.currentTarget).closest('.section').removeClass('section-collapsed');
		$(e.currentTarget).closest('button').removeClass('expand').addClass('collapse').find('span').text(TAPi18n.__('Collapse'));
		$('.CodeMirror').each((index, codeMirror) => codeMirror.CodeMirror.refresh());
	},

	'click .collapse': (e) => {
		$(e.currentTarget).closest('.section').addClass('section-collapsed');
		$(e.currentTarget).closest('button').addClass('expand').removeClass('collapse').find('span').text(TAPi18n.__('Expand'));
	},
	'click .js-cancel'() {
		FlowRouter.go('/admin/apps');
	},
	'change #enabled': (e, t) => {
		t.processingEnabled.set(true);
		$('#enabled').prop('disabled', true);

		const status = $('#enabled').prop('checked') ? 'manually_enabled' : 'manually_disabled';
		RocketChat.API.post(`apps/${ t.id.get() }/status`, { status }).then((result) => {
			const info = t.app.get();
			info.status = result.status;
			t.app.set(info);

			if (info.status.indexOf('disabled') !== -1) {
				$('#enabled').prop('checked', false);
			}
		}).catch(() => {
			$('#enabled').prop('checked', !$('#enabled').prop('checked'));
		}).then(() => {
			t.processingEnabled.set(false);
			$('#enabled').prop('disabled', false);
		});
	},

	'click .js-uninstall': async(e, t) => {
		t.ready.set(false);
		try {
			await RocketChat.API.delete(`apps/${ t.id.get() }`);
			FlowRouter.go('/admin/apps');
		} catch (err) {
			console.warn('Error:', err);
		} finally {
			t.ready.set(true);
		}
	},

	'click .logs': (e, t) => {
		FlowRouter.go(`/admin/apps/${ t.id.get() }/logs`);
	},

	'click .js-save': async(e, t) => {
		if (t.loading.get()) {
			return;
		}
		t.loading.set(true);
		const settings = t.settings.get();


		try {
			const toSave = [];
			Object.keys(settings).forEach(k => {
				const setting = settings[k];
				if (setting.hasChanged) {
					toSave.push(setting);
				}
				// return !!setting.hasChanged;
			});

			if (toSave.length === 0) {
				throw 'Nothing to save..';
			}
			const result = await RocketChat.API.post(`apps/${ t.id.get() }/settings`, undefined, { settings: toSave });
			console.log('Updating results:', result);
			result.updated.forEach(setting => {
				settings[setting.id].value = settings[setting.id].oldValue = setting.value;
			});
			Object.keys(settings).forEach(k => {
				const setting = settings[k];
				setting.hasChanged = false;
			});
			t.settings.set(settings);

		} catch (e) {
			console.log(e);
		} finally {
			t.loading.set(false);
		}

	},

	'change input[type="checkbox"]': (e, t) => {
		const labelFor = $(e.currentTarget).attr('name');
		const isChecked = $(e.currentTarget).prop('checked');

		// $(`input[name="${ labelFor }"]`).prop('checked', !isChecked);

		const setting = t.settings.get()[labelFor];

		if (setting) {
			setting.value = isChecked;
			t.settings.get()[labelFor].hasChanged = setting.oldValue !== setting.value;
			t.settings.set(t.settings.get());
		}
	},

	'input input': _.throttle(function(e, t) {
		let value = s.trim($(e.target).val());
		switch (this.type) {
			case 'int':
				value = parseInt(value);
				break;
			case 'boolean':
				value = value === '1';
		}

		const setting = t.settings.get()[this.id];
		setting.value = value;

		if (setting.oldValue !== setting.value) {
			t.settings.get()[this.id].hasChanged = true;
			t.settings.set(t.settings.get());
		}
	}, 500)
});
