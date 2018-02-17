/*globals jscolor*/
/*eslint new-cap: ["error", { "newIsCapExceptions": ["jscolor"] }]*/
import s from 'underscore.string';
import moment from 'moment';
import toastr from 'toastr';

const LivechatAppearance = new Mongo.Collection('livechatAppearance');

Template.livechatAppearance.helpers({
	previewState() {
		return Template.instance().previewState.get();
	},
	showOnline() {
		return Template.instance().previewState.get().indexOf('offline') === -1;
	},
	showOfflineForm() {
		const state = Template.instance().previewState.get();
		return state === 'opened-offline' || state === 'closed-offline';
	},
	showOfflineSuccess() {
		return Template.instance().previewState.get() === 'offline-success';
	},
	showOfflineUnavailable() {
		return Template.instance().previewState.get() === 'offline-unavailable';
	},
	color() {
		return Template.instance().color.get();
	},
	showAgentEmail() {
		return Template.instance().showAgentEmail.get();
	},
	title() {
		return Template.instance().title.get();
	},
	colorOffline() {
		return Template.instance().colorOffline.get();
	},
	titleOffline() {
		return Template.instance().titleOffline.get();
	},
	offlineMessage() {
		return Template.instance().offlineMessage.get();
	},
	sampleOfflineMessage() {
		return Template.instance().offlineMessage.get().replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br>$2');
	},
	offlineSuccessMessage() {
		return Template.instance().offlineSuccessMessage.get();
	},
	sampleOfflineSuccessMessage() {
		return Template.instance().offlineSuccessMessage.get().replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br>$2');
	},
	showAgentEmailFormTrueChecked() {
		if (Template.instance().showAgentEmail.get()) {
			return 'checked';
		}
	},
	showAgentEmailFormFalseChecked() {
		if (!Template.instance().showAgentEmail.get()) {
			return 'checked';
		}
	},
	displayOfflineFormTrueChecked() {
		if (Template.instance().displayOfflineForm.get()) {
			return 'checked';
		}
	},
	displayOfflineFormFalseChecked() {
		if (!Template.instance().displayOfflineForm.get()) {
			return 'checked';
		}
	},
	offlineUnavailableMessage() {
		return Template.instance().offlineUnavailableMessage.get();
	},
	sampleOfflineUnavailableMessage() {
		return Template.instance().offlineUnavailableMessage.get().replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br>$2');
	},
	emailOffline() {
		return Template.instance().offlineEmail.get();
	},
	sampleColor() {
		if (Template.instance().previewState.get().indexOf('offline') !== -1) {
			return Template.instance().colorOffline.get();
		} else {
			return Template.instance().color.get();
		}
	},
	sampleTitle() {
		if (Template.instance().previewState.get().indexOf('offline') !== -1) {
			return Template.instance().titleOffline.get();
		} else {
			return Template.instance().title.get();
		}
	},
	sampleData() {
		return {
			messages: [
				{
					_id: Random.id(),
					u: {
						username: 'guest'
					},
					time: moment(this.ts).format('LT'),
					date: moment(this.ts).format('LL'),
					body: 'Hello',
					sequential: null
				},
				{
					_id: Random.id(),
					u: {
						username: 'rocketchat-agent'
					},
					time: moment(this.ts).format('LT'),
					date: moment(this.ts).format('LL'),
					body: 'Hey, what can I help you with?',
					sequential: null
				},
				{
					_id: Random.id(),
					u: {
						username: 'guest'
					},
					time: moment(this.ts).format('LT'),
					date: moment(this.ts).format('LL'),
					body: 'I\'m looking for informations about your product.',
					sequential: null
				},
				{
					_id: Random.id(),
					u: {
						username: 'rocketchat-agent'
					},
					time: moment(this.ts).format('LT'),
					date: moment(this.ts).format('LL'),
					body: 'Our product is open source, you can do what you want with it! =D',
					sequential: null
				},
				{
					_id: Random.id(),
					u: {
						username: 'guest'
					},
					time: moment(this.ts).format('LT'),
					date: moment(this.ts).format('LL'),
					body: 'Yay, thanks. That\'s awesome.',
					sequential: null
				},
				{
					_id: Random.id(),
					u: {
						username: 'rocketchat-agent'
					},
					time: moment(this.ts).format('LT'),
					date: moment(this.ts).format('LL'),
					body: 'You\'re welcome.',
					sequential: null
				}
			]
		};
	}
});

Template.livechatAppearance.onCreated(function() {
	this.subscribe('livechat:appearance');

	this.previewState = new ReactiveVar('opened');

	this.title = new ReactiveVar(null);
	this.color = new ReactiveVar(null);

	this.showAgentEmail = new ReactiveVar(null);
	this.displayOfflineForm = new ReactiveVar(null);
	this.offlineUnavailableMessage = new ReactiveVar(null);
	this.offlineMessage = new ReactiveVar(null);
	this.offlineSuccessMessage = new ReactiveVar(null);
	this.titleOffline = new ReactiveVar(null);
	this.colorOffline = new ReactiveVar(null);
	this.offlineEmail = new ReactiveVar(null);

	this.autorun(() => {
		const setting = LivechatAppearance.findOne('Livechat_title');
		this.title.set(setting && setting.value);
	});
	this.autorun(() => {
		const setting = LivechatAppearance.findOne('Livechat_title_color');
		this.color.set(setting && setting.value);
	});
	this.autorun(() => {
		const setting = LivechatAppearance.findOne('Livechat_show_agent_email');
		this.showAgentEmail.set(setting && setting.value);
	});
	this.autorun(() => {
		const setting = LivechatAppearance.findOne('Livechat_display_offline_form');
		this.displayOfflineForm.set(setting && setting.value);
	});
	this.autorun(() => {
		const setting = LivechatAppearance.findOne('Livechat_offline_form_unavailable');
		this.offlineUnavailableMessage.set(setting && setting.value);
	});
	this.autorun(() => {
		const setting = LivechatAppearance.findOne('Livechat_offline_message');
		this.offlineMessage.set(setting && setting.value);
	});
	this.autorun(() => {
		const setting = LivechatAppearance.findOne('Livechat_offline_success_message');
		this.offlineSuccessMessage.set(setting && setting.value);
	});
	this.autorun(() => {
		const setting = LivechatAppearance.findOne('Livechat_offline_title');
		this.titleOffline.set(setting && setting.value);
	});
	this.autorun(() => {
		const setting = LivechatAppearance.findOne('Livechat_offline_title_color');
		this.colorOffline.set(setting && setting.value);
	});
	this.autorun(() => {
		const setting = LivechatAppearance.findOne('Livechat_offline_email');
		this.offlineEmail.set(setting && setting.value);
	});
});

Template.livechatAppearance.events({
	'change .preview-mode'(e, instance) {
		instance.previewState.set(e.currentTarget.value);
	},
	'change .preview-settings, keyup .preview-settings'(e, instance) {
		let value = e.currentTarget.value;
		if (e.currentTarget.type === 'radio') {
			value = value === 'true';
		}
		instance[e.currentTarget.name].set(value);
	},
	'click .reset-settings'(e, instance) {
		e.preventDefault();

		const settingTitle = LivechatAppearance.findOne('Livechat_title');
		instance.title.set(settingTitle && settingTitle.value);

		const settingTitleColor = LivechatAppearance.findOne('Livechat_title_color');
		instance.color.set(settingTitleColor && settingTitleColor.value);

		const settingShowAgentEmail = LivechatAppearance.findOne('Livechat_show_agent_email');
		instance.showAgentEmail.set(settingShowAgentEmail && settingShowAgentEmail.value);

		const settingDiplayOffline = LivechatAppearance.findOne('Livechat_display_offline_form');
		instance.displayOfflineForm.set(settingDiplayOffline && settingDiplayOffline.value);

		const settingFormUnavailable = LivechatAppearance.findOne('Livechat_offline_form_unavailable');
		instance.offlineUnavailableMessage.set(settingFormUnavailable && settingFormUnavailable.value);

		const settingOfflineMessage = LivechatAppearance.findOne('Livechat_offline_message');
		instance.offlineMessage.set(settingOfflineMessage && settingOfflineMessage.value);

		const settingOfflineSuccess = LivechatAppearance.findOne('Livechat_offline_success_message');
		instance.offlineSuccessMessage.set(settingOfflineSuccess && settingOfflineSuccess.value);

		const settingOfflineTitle = LivechatAppearance.findOne('Livechat_offline_title');
		instance.titleOffline.set(settingOfflineTitle && settingOfflineTitle.value);

		const settingOfflineTitleColor = LivechatAppearance.findOne('Livechat_offline_title_color');
		instance.colorOffline.set(settingOfflineTitleColor && settingOfflineTitleColor.value);
	},
	'submit .rocket-form'(e, instance) {
		e.preventDefault();

		const settings = [
			{
				_id: 'Livechat_title',
				value: s.trim(instance.title.get())
			},
			{
				_id: 'Livechat_title_color',
				value: instance.color.get()
			},
			{
				_id: 'Livechat_show_agent_email',
				value: instance.showAgentEmail.get()
			},
			{
				_id: 'Livechat_display_offline_form',
				value: instance.displayOfflineForm.get()
			},
			{
				_id: 'Livechat_offline_form_unavailable',
				value: s.trim(instance.offlineUnavailableMessage.get())
			},
			{
				_id: 'Livechat_offline_message',
				value: s.trim(instance.offlineMessage.get())
			},
			{
				_id: 'Livechat_offline_success_message',
				value: s.trim(instance.offlineSuccessMessage.get())
			},
			{
				_id: 'Livechat_offline_title',
				value: s.trim(instance.titleOffline.get())
			},
			{
				_id: 'Livechat_offline_title_color',
				value: instance.colorOffline.get()
			},
			{
				_id: 'Livechat_offline_email',
				value: instance.$('#emailOffline').val()
			}
		];

		Meteor.call('livechat:saveAppearance', settings, (err/*, success*/) => {
			if (err) {
				return handleError(err);
			}
			toastr.success(t('Settings_updated'));
		});
	}
});

Template.livechatAppearance.onRendered(function() {
	Meteor.setTimeout(() => {
		$('.colorpicker-input').each((index, el) => {
			new jscolor(el);
		});
	}, 500);
});
