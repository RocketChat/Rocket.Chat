import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import _ from 'underscore';
import s from 'underscore.string';
import toastr from 'toastr';

import { modal } from '../../../../../ui-utils';
import { t, handleError } from '../../../../../utils';
import './livechatIntegrationWebhook.html';
import { APIClient } from '../../../../../utils/client';

const getIntegrationSettingById = (settings, id) => settings.find((setting) => setting._id === id);

Template.livechatIntegrationWebhook.helpers({
	webhookUrl() {
		const setting = getIntegrationSettingById(Template.instance().settings.get(), 'Livechat_webhookUrl');
		return setting && setting.value;
	},
	secretToken() {
		const setting = getIntegrationSettingById(Template.instance().settings.get(), 'Livechat_secret_token');
		return setting && setting.value;
	},
	disableTest() {
		return Template.instance().disableTest.get();
	},
	sendOnCloseChecked() {
		const setting = getIntegrationSettingById(Template.instance().settings.get(), 'Livechat_webhook_on_close');
		return setting && setting.value;
	},
	sendOnOfflineChecked() {
		const setting = getIntegrationSettingById(Template.instance().settings.get(), 'Livechat_webhook_on_offline_msg');
		return setting && setting.value;
	},
	sendOnVisitorMessageChecked() {
		const setting = getIntegrationSettingById(Template.instance().settings.get(), 'Livechat_webhook_on_visitor_message');
		return setting && setting.value;
	},
	sendOnAgentMessageChecked() {
		const setting = getIntegrationSettingById(Template.instance().settings.get(), 'Livechat_webhook_on_agent_message');
		return setting && setting.value;
	},
});

Template.livechatIntegrationWebhook.onCreated(async function() {
	this.disableTest = new ReactiveVar(true);
	this.settings = new ReactiveVar([]);

	this.autorun(() => {
		const webhook = getIntegrationSettingById(this.settings.get(), 'Livechat_webhookUrl');
		this.disableTest.set(!webhook || _.isEmpty(webhook.value));
	});
	const { settings } = await APIClient.v1.get('livechat/integrations.settings');
	this.settings.set(settings);
});

Template.livechatIntegrationWebhook.events({
	'change #webhookUrl, blur #webhookUrl'(e, instance) {
		const setting = getIntegrationSettingById(instance.settings.get(), 'Livechat_webhookUrl');
		instance.disableTest.set(!setting || e.currentTarget.value !== setting.value);
	},
	'click .test'(e, instance) {
		if (!instance.disableTest.get()) {
			Meteor.call('livechat:webhookTest', (err) => {
				if (err) {
					return handleError(err);
				}
				modal.open({
					title: t('It_works'),
					type: 'success',
					timer: 2000,
				});
			});
		}
	},
	'click .reset-settings'(e, instance) {
		e.preventDefault();

		const webhookUrl = getIntegrationSettingById(instance.settings.get(), 'Livechat_webhookUrl');
		const secretToken = getIntegrationSettingById(instance.settings.get(), 'Livechat_secret_token');
		const webhookOnClose = getIntegrationSettingById(instance.settings.get(), 'Livechat_webhook_on_close');
		const webhookOnOfflineMsg = getIntegrationSettingById(instance.settings.get(), 'Livechat_webhook_on_offline_msg');
		const webhookOnVisitorMessage = getIntegrationSettingById(instance.settings.get(), 'Livechat_webhook_on_visitor_message');
		const webhookOnAgentMessage = getIntegrationSettingById(instance.settings.get(), 'Livechat_webhook_on_agent_message');

		instance.$('#webhookUrl').val(webhookUrl && webhookUrl.value);
		instance.$('#secretToken').val(secretToken && secretToken.value);
		instance.$('#sendOnClose').get(0).checked = webhookOnClose && webhookOnClose.value;
		instance.$('#sendOnOffline').get(0).checked = webhookOnOfflineMsg && webhookOnOfflineMsg.value;
		instance.$('#sendOnVisitorMessage').get(0).checked = webhookOnVisitorMessage && webhookOnVisitorMessage.value;
		instance.$('#sendOnAgentMessage').get(0).checked = webhookOnAgentMessage && webhookOnAgentMessage.value;

		instance.disableTest.set(!webhookUrl || _.isEmpty(webhookUrl.value));
	},
	'submit .rocket-form'(e, instance) {
		e.preventDefault();

		const settings = {
			Livechat_webhookUrl: s.trim(instance.$('#webhookUrl').val()),
			Livechat_secret_token: s.trim(instance.$('#secretToken').val()),
			Livechat_webhook_on_close: instance.$('#sendOnClose').get(0).checked,
			Livechat_webhook_on_offline_msg: instance.$('#sendOnOffline').get(0).checked,
			Livechat_webhook_on_visitor_message: instance.$('#sendOnVisitorMessage').get(0).checked,
			Livechat_webhook_on_agent_message: instance.$('#sendOnAgentMessage').get(0).checked,
		};
		Meteor.call('livechat:saveIntegration', settings, (err) => {
			if (err) {
				return handleError(err);
			}
			const savedValues = instance.settings.get().map((setting) => {
				setting.value = settings[setting._id];
				return setting;
			});
			instance.settings.set(savedValues);
			toastr.success(t('Saved'));
		});
	},
});
