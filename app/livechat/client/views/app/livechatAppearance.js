import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import s from 'underscore.string';
import toastr from 'toastr';

import { t, handleError } from '../../../../utils';
import './livechatAppearance.html';
import { APIClient } from '../../../../utils/client';

const getSettingFromAppearance = (instance, settingName) => instance.appearance.get() && instance.appearance.get().find((setting) => setting._id === settingName);

Template.livechatAppearance.helpers({
	color() {
		return Template.instance().color.get();
	},
	showAgentInfo() {
		return Template.instance().showAgentInfo.get();
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
	showAgentInfoFormTrueChecked() {
		if (Template.instance().showAgentInfo.get()) {
			return 'checked';
		}
	},
	showAgentInfoFormFalseChecked() {
		if (!Template.instance().showAgentInfo.get()) {
			return 'checked';
		}
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
	conversationFinishedText() {
		return Template.instance().conversationFinishedText.get();
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
});

Template.livechatAppearance.onCreated(async function() {
	this.appearance = new ReactiveVar([]);
	this.title = new ReactiveVar(null);
	this.color = new ReactiveVar(null);

	this.showAgentInfo = new ReactiveVar(null);
	this.showAgentEmail = new ReactiveVar(null);
	this.displayOfflineForm = new ReactiveVar(null);
	this.offlineUnavailableMessage = new ReactiveVar(null);
	this.offlineMessage = new ReactiveVar(null);
	this.offlineSuccessMessage = new ReactiveVar(null);
	this.titleOffline = new ReactiveVar(null);
	this.colorOffline = new ReactiveVar(null);
	this.offlineEmail = new ReactiveVar(null);
	this.conversationFinishedMessage = new ReactiveVar(null);
	this.conversationFinishedText = new ReactiveVar(null);
	this.registrationFormEnabled = new ReactiveVar(null);
	this.registrationFormNameFieldEnabled = new ReactiveVar(null);
	this.registrationFormEmailFieldEnabled = new ReactiveVar(null);
	this.registrationFormMessage = new ReactiveVar(null);

	const { appearance } = await APIClient.v1.get('livechat/appearance');
	this.appearance.set(appearance);

	const livechatTitle = getSettingFromAppearance(this, 'Livechat_title');
	const livechatTitleColor = getSettingFromAppearance(this, 'Livechat_title_color');
	const livechatShowAgentInfo = getSettingFromAppearance(this, 'Livechat_show_agent_info');
	const livechatShowAgentEmail = getSettingFromAppearance(this, 'Livechat_show_agent_email');
	const livechatDisplayOfflineForm = getSettingFromAppearance(this, 'Livechat_display_offline_form');
	const livechatOfflineFormUnavailable = getSettingFromAppearance(this, 'Livechat_offline_form_unavailable');
	const livechatOfflineMessage = getSettingFromAppearance(this, 'Livechat_offline_message');
	const livechatOfflineSuccessMessage = getSettingFromAppearance(this, 'Livechat_offline_success_message');
	const livechatOfflineTitle = getSettingFromAppearance(this, 'Livechat_offline_title');
	const livechatOfflineTitleColor = getSettingFromAppearance(this, 'Livechat_offline_title_color');
	const livechatOfflineEmail = getSettingFromAppearance(this, 'Livechat_offline_email');
	const livechatConversationFinishedMessage = getSettingFromAppearance(this, 'Livechat_conversation_finished_message');
	const livechatRegistrationFormMessage = getSettingFromAppearance(this, 'Livechat_registration_form_message');
	const livechatRegistrationForm = getSettingFromAppearance(this, 'Livechat_registration_form');
	const livechatNameFieldRegistrationForm = getSettingFromAppearance(this, 'Livechat_name_field_registration_form');
	const livechatEmailFieldRegistrationForm = getSettingFromAppearance(this, 'Livechat_email_field_registration_form');
	const conversationFinishedText = getSettingFromAppearance(this, 'Livechat_conversation_finished_text');

	this.title.set(livechatTitle && livechatTitle.value);
	this.color.set(livechatTitleColor && livechatTitleColor.value);
	this.showAgentInfo.set(livechatShowAgentInfo && livechatShowAgentInfo.value);
	this.showAgentEmail.set(livechatShowAgentEmail && livechatShowAgentEmail.value);
	this.displayOfflineForm.set(livechatDisplayOfflineForm && livechatDisplayOfflineForm.value);
	this.offlineUnavailableMessage.set(livechatOfflineFormUnavailable && livechatOfflineFormUnavailable.value);
	this.offlineMessage.set(livechatOfflineMessage && livechatOfflineMessage.value);
	this.offlineSuccessMessage.set(livechatOfflineSuccessMessage && livechatOfflineSuccessMessage.value);
	this.titleOffline.set(livechatOfflineTitle && livechatOfflineTitle.value);
	this.colorOffline.set(livechatOfflineTitleColor && livechatOfflineTitleColor.value);
	this.offlineEmail.set(livechatOfflineEmail && livechatOfflineEmail.value);
	this.conversationFinishedMessage.set(livechatConversationFinishedMessage && livechatConversationFinishedMessage.value);
	this.registrationFormMessage.set(livechatRegistrationFormMessage && livechatRegistrationFormMessage.value);
	this.registrationFormEnabled.set(livechatRegistrationForm && livechatRegistrationForm.value);
	this.registrationFormNameFieldEnabled.set(livechatNameFieldRegistrationForm && livechatNameFieldRegistrationForm.value);
	this.registrationFormEmailFieldEnabled.set(livechatEmailFieldRegistrationForm && livechatEmailFieldRegistrationForm.value);
	this.conversationFinishedText.set(conversationFinishedText && conversationFinishedText.value);
});

Template.livechatAppearance.events({
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

		const settingTitle = getSettingFromAppearance(instance, 'Livechat_title');
		instance.title.set(settingTitle && settingTitle.value);

		const settingTitleColor = getSettingFromAppearance(instance, 'Livechat_title_color');
		instance.color.set(settingTitleColor && settingTitleColor.value);

		const settingShowAgentInfo = getSettingFromAppearance(instance, 'Livechat_show_agent_info');
		instance.showAgentInfo.set(settingShowAgentInfo && settingShowAgentInfo.value);

		const settingShowAgentEmail = getSettingFromAppearance(instance, 'Livechat_show_agent_email');
		instance.showAgentEmail.set(settingShowAgentEmail && settingShowAgentEmail.value);

		const settingDiplayOffline = getSettingFromAppearance(instance, 'Livechat_display_offline_form');
		instance.displayOfflineForm.set(settingDiplayOffline && settingDiplayOffline.value);

		const settingFormUnavailable = getSettingFromAppearance(instance, 'Livechat_offline_form_unavailable');
		instance.offlineUnavailableMessage.set(settingFormUnavailable && settingFormUnavailable.value);

		const settingOfflineMessage = getSettingFromAppearance(instance, 'Livechat_offline_message');
		instance.offlineMessage.set(settingOfflineMessage && settingOfflineMessage.value);

		const settingOfflineSuccess = getSettingFromAppearance(instance, 'Livechat_offline_success_message');
		instance.offlineSuccessMessage.set(settingOfflineSuccess && settingOfflineSuccess.value);

		const settingOfflineTitle = getSettingFromAppearance(instance, 'Livechat_offline_title');
		instance.titleOffline.set(settingOfflineTitle && settingOfflineTitle.value);

		const settingOfflineTitleColor = getSettingFromAppearance(instance, 'Livechat_offline_title_color');
		instance.colorOffline.set(settingOfflineTitleColor && settingOfflineTitleColor.value);

		const settingConversationFinishedMessage = getSettingFromAppearance(instance, 'Livechat_conversation_finished_message');
		instance.conversationFinishedMessage.set(settingConversationFinishedMessage && settingConversationFinishedMessage.value);

		const settingConversationFinishedText = getSettingFromAppearance(instance, 'Livechat_conversation_finished_text');
		instance.conversationFinishedText.set(settingConversationFinishedText && settingConversationFinishedText.value);

		const settingRegistrationFormEnabled = getSettingFromAppearance(instance, 'Livechat_registration_form');
		instance.registrationFormEnabled.set(settingRegistrationFormEnabled && settingRegistrationFormEnabled.value);

		const settingRegistrationFormNameFieldEnabled = getSettingFromAppearance(instance, 'Livechat_name_field_registration_form');
		instance.registrationFormNameFieldEnabled.set(settingRegistrationFormNameFieldEnabled && settingRegistrationFormNameFieldEnabled.value);

		const settingRegistrationFormEmailFieldEnabled = getSettingFromAppearance(instance, 'Livechat_email_field_registration_form');
		instance.registrationFormEmailFieldEnabled.set(settingRegistrationFormEmailFieldEnabled && settingRegistrationFormEmailFieldEnabled.value);

		const settingRegistrationFormMessage = getSettingFromAppearance(instance, 'Livechat_registration_form_message');
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
				_id: 'Livechat_show_agent_info',
				value: instance.showAgentInfo.get(),
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
				_id: 'Livechat_conversation_finished_text',
				value: s.trim(instance.conversationFinishedText.get()),
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
			instance.appearance.set(settings);
			toastr.success(t('Settings_updated'));
		});
	},
});
