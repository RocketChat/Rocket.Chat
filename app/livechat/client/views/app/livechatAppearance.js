/* eslint new-cap: ["error", { "newIsCapExceptions": ["jscolor"] }]*/
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { ReactiveVar } from 'meteor/reactive-var';
import { Random } from 'meteor/random';
import { Template } from 'meteor/templating';
import { t, handleError } from '../../../../utils';
import s from 'underscore.string';
import moment from 'moment';
import toastr from 'toastr';
import './livechatAppearance.html';

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
	conversationFinishedMessage() {
		return Template.instance().conversationFinishedMessage.get();
	},
	registrationFormEnabled() {
		if (Template.instance().registrationFormEnabled.get()) {
			return 'checked';
		}
	},
	registrationFormNameFieldEnabled() {
		if (Template.instance().registrationFormNameFieldEnabled.get()) {
			return 'checked';
		}
	},
	registrationFormEmailFieldEnabled() {
		if (Template.instance().registrationFormEmailFieldEnabled.get()) {
			return 'checked';
		}
	},
	registrationFormMessage() {
		return Template.instance().registrationFormMessage.get();
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
						username: 'guest',
					},
					time: moment(this.ts).format('LT'),
					date: moment(this.ts).format('LL'),
					body: 'Hello',
					sequential: null,
				},
				{
					_id: Random.id(),
					u: {
						username: 'rocketchat-agent',
					},
					time: moment(this.ts).format('LT'),
					date: moment(this.ts).format('LL'),
					body: 'Hey, what can I help you with?',
					sequential: null,
				},
				{
					_id: Random.id(),
					u: {
						username: 'guest',
					},
					time: moment(this.ts).format('LT'),
					date: moment(this.ts).format('LL'),
					body: 'I\'m looking for informations about your product.',
					sequential: null,
				},
				{
					_id: Random.id(),
					u: {
						username: 'rocketchat-agent',
					},
					time: moment(this.ts).format('LT'),
					date: moment(this.ts).format('LL'),
					body: 'Our product is open source, you can do what you want with it! =D',
					sequential: null,
				},
				{
					_id: Random.id(),
					u: {
						username: 'guest',
					},
					time: moment(this.ts).format('LT'),
					date: moment(this.ts).format('LL'),
					body: 'Yay, thanks. That\'s awesome.',
					sequential: null,
				},
				{
					_id: Random.id(),
					u: {
						username: 'rocketchat-agent',
					},
					time: moment(this.ts).format('LT'),
					date: moment(this.ts).format('LL'),
					body: 'You\'re welcome.',
					sequential: null,
				},
			],
		};
	},
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
	this.conversationFinishedMessage = new ReactiveVar(null);
	this.registrationFormEnabled = new ReactiveVar(null);
	this.registrationFormNameFieldEnabled = new ReactiveVar(null);
	this.registrationFormEmailFieldEnabled = new ReactiveVar(null);
	this.registrationFormMessage = new ReactiveVar(null);

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
	this.autorun(() => {
		const setting = LivechatAppearance.findOne('Livechat_conversation_finished_message');
		this.conversationFinishedMessage.set(setting && setting.value);
	});
	this.autorun(() => {
		const setting = LivechatAppearance.findOne('Livechat_registration_form_message');
		this.registrationFormMessage.set(setting && setting.value);
	});
	this.autorun(() => {
		const setting = LivechatAppearance.findOne('Livechat_registration_form');
		this.registrationFormEnabled.set(setting && setting.value);
	});
	this.autorun(() => {
		const setting = LivechatAppearance.findOne('Livechat_name_field_registration_form');
		this.registrationFormNameFieldEnabled.set(setting && setting.value);
	});
	this.autorun(() => {
		const setting = LivechatAppearance.findOne('Livechat_email_field_registration_form');
		this.registrationFormEmailFieldEnabled.set(setting && setting.value);
	});
});

Template.livechatAppearance.events({
	'change .preview-mode'(e, instance) {
		instance.previewState.set(e.currentTarget.value);
	},
	'change .js-input-check'(e, instance) {
		instance[e.currentTarget.name].set(e.currentTarget.checked);
	},
	'change .preview-settings, keyup .preview-settings'(e, instance) {
		let { value } = e.currentTarget;
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

		const settingConversationFinishedMessage = LivechatAppearance.findOne('Livechat_conversation_finished_message');
		instance.conversationFinishedMessage.set(settingConversationFinishedMessage && settingConversationFinishedMessage.value);

		const settingRegistrationFormEnabled = LivechatAppearance.findOne('Livechat_registration_form');
		instance.registrationFormEnabled.set(settingRegistrationFormEnabled && settingRegistrationFormEnabled.value);

		const settingRegistrationFormNameFieldEnabled = LivechatAppearance.findOne('Livechat_name_field_registration_form');
		instance.registrationFormNameFieldEnabled.set(settingRegistrationFormNameFieldEnabled && settingRegistrationFormNameFieldEnabled.value);

		const settingRegistrationFormEmailFieldEnabled = LivechatAppearance.findOne('Livechat_email_field_registration_form');
		instance.registrationFormEmailFieldEnabled.set(settingRegistrationFormEmailFieldEnabled && settingRegistrationFormEmailFieldEnabled.value);

		const settingRegistrationFormMessage = LivechatAppearance.findOne('Livechat_registration_form_message');
		instance.registrationFormMessage.set(settingRegistrationFormMessage && settingRegistrationFormMessage.value);

	},
	'submit .rocket-form'(e, instance) {
		e.preventDefault();
		const settings = [
			{
				_id: 'Livechat_title',
				value: s.trim(instance.title.get()),
			},
			{
				_id: 'Livechat_title_color',
				value: instance.color.get(),
			},
			{
				_id: 'Livechat_show_agent_email',
				value: instance.showAgentEmail.get(),
			},
			{
				_id: 'Livechat_display_offline_form',
				value: instance.displayOfflineForm.get(),
			},
			{
				_id: 'Livechat_offline_form_unavailable',
				value: s.trim(instance.offlineUnavailableMessage.get()),
			},
			{
				_id: 'Livechat_offline_message',
				value: s.trim(instance.offlineMessage.get()),
			},
			{
				_id: 'Livechat_offline_success_message',
				value: s.trim(instance.offlineSuccessMessage.get()),
			},
			{
				_id: 'Livechat_offline_title',
				value: s.trim(instance.titleOffline.get()),
			},
			{
				_id: 'Livechat_offline_title_color',
				value: instance.colorOffline.get(),
			},
			{
				_id: 'Livechat_offline_email',
				value: instance.$('#emailOffline').val(),
			},
			{
				_id: 'Livechat_conversation_finished_message',
				value: s.trim(instance.conversationFinishedMessage.get()),
			},
			{
				_id: 'Livechat_registration_form',
				value: instance.registrationFormEnabled.get(),
			},
			{
				_id: 'Livechat_name_field_registration_form',
				value: instance.registrationFormNameFieldEnabled.get(),
			},
			{
				_id: 'Livechat_email_field_registration_form',
				value: instance.registrationFormEmailFieldEnabled.get(),
			},
			{
				_id: 'Livechat_registration_form_message',
				value: s.trim(instance.registrationFormMessage.get()),
			},
		];

		Meteor.call('livechat:saveAppearance', settings, (err/* , success*/) => {
			if (err) {
				return handleError(err);
			}
			toastr.success(t('Settings_updated'));
		});
	},
});

Template.livechatAppearance.onRendered(function() {
	Meteor.setTimeout(() => {
		$('.colorpicker-input').each((index, el) => {
			new jscolor(el);
		});
	}, 500);
});
