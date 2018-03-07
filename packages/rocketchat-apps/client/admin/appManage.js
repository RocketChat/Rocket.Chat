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

	const id = this.id.get();

	function _morphSettings(settings) {
		Object.keys(settings).forEach((k) => {
			settings[k].i18nPlaceholder = settings[k].i18nPlaceholder || ' ';
			settings[k].value = settings[k].value || settings[k].packageValue;
			settings[k].oldValue = settings[k].value;
		});

		instance.settings.set(settings);
	}

	Promise.all([
		RocketChat.API.get(`apps/${ id }`),
		RocketChat.API.get(`apps/${ id }/settings`)
	]).then((results) => {
		instance.app.set(results[0].app);
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

	'click .uninstall': (e, t) => {
		t.ready.set(false);

		RocketChat.API.delete(`apps/${ t.id.get() }`).then(() => {
			FlowRouter.go('/admin/apps');
		}).catch((err) => {
			console.warn('Error:', err);
			t.ready.set(true);
		});
	},

	'click .logs': (e, t) => {
		FlowRouter.go(`/admin/apps/${ t.id.get() }/logs`);
	},

	'click .save': (e, t) => {
		const toSave = [];

		Object.keys(t.settings.get()).forEach((k) => {
			const setting = t.settings.get()[k];
			if (setting.hasChanged) {
				toSave.push(setting);
			}
		});

		if (toSave.length === 0) {
			console.log('Nothing to save..');
			return;
		}

		RocketChat.API.post(`apps/${ t.id.get() }/settings`, undefined, { settings: toSave }).then((result) => {
			console.log('Updating results:', result);
			result.updated.forEach((setting) => {
				t.settings.get()[setting.id].oldValue = setting.value;
			});
		});
	},

	'click .input.checkbox label': (e, t) => {
		const labelFor = $(e.currentTarget).attr('for');
		const isChecked = $(`input[name="${ labelFor }"]`).prop('checked');

		$(`input[name="${ labelFor }"]`).prop('checked', !isChecked);

		const setting = t.settings.get()[labelFor];

		if (setting) {
			setting.value = !isChecked;
			t.settings.get()[labelFor].hasChanged = setting.oldValue !== setting.value;
		}
	},

	'change .input-monitor, keyup .input-monitor': _.throttle(function(e, t) {
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
		}
	}, 500)
});
