/* globals LivechatIntegration */
Template.livechatIntegrations.helpers({
	webhookUrl() {
		let setting = LivechatIntegration.findOne('Livechat_webhookUrl');
		return setting && setting.value;
	},
	secretToken() {
		let setting = LivechatIntegration.findOne('Livechat_secret_token');
		return setting && setting.value;
	},
	disableTest() {
		return Template.instance().disableTest.get();
	},
	sendOnCloseChecked() {
		let setting = LivechatIntegration.findOne('Livechat_webhook_on_close');
		return setting && setting.value;
	},
	sendOnOfflineChecked() {
		let setting = LivechatIntegration.findOne('Livechat_webhook_on_offline_msg');
		return setting && setting.value;
	}
});

Template.livechatIntegrations.onCreated(function() {
	this.disableTest = new ReactiveVar(true);

	this.autorun(() => {
		let webhook = LivechatIntegration.findOne('Livechat_webhookUrl');
		this.disableTest.set(!webhook || _.isEmpty(webhook.value));
	});

	this.subscribe('livechat:integration');
});

Template.livechatIntegrations.events({
	'change #webhookUrl, blur #webhookUrl'(e, instance) {
		let setting = LivechatIntegration.findOne('Livechat_webhookUrl');
		instance.disableTest.set(!setting || e.currentTarget.value !== setting.value);
	},
	'click .test'(e, instance) {
		if (!instance.disableTest.get()) {
			Meteor.call('livechat:webhookTest', (err) => {
				if (err) {
					return handleError(err);
				}
				swal(t('It_works'), null, 'success');
			});
		}
	},
	'click .reset-settings'(e, instance) {
		e.preventDefault();

		let webhookUrl = LivechatIntegration.findOne('Livechat_webhookUrl');
		let secretToken = LivechatIntegration.findOne('Livechat_secret_token');
		let webhookOnClose = LivechatIntegration.findOne('Livechat_webhook_on_close');
		let webhookOnOfflineMsg = LivechatIntegration.findOne('Livechat_webhook_on_offline_msg');

		instance.$('#webhookUrl').val(webhookUrl && webhookUrl.value);
		instance.$('#secretToken').val(secretToken && secretToken.value);
		instance.$('#sendOnClose').get(0).checked = webhookOnClose && webhookOnClose.value;
		instance.$('#sendOnOffline').get(0).checked = webhookOnOfflineMsg && webhookOnOfflineMsg.value;

		instance.disableTest.set(!webhookUrl || _.isEmpty(webhookUrl.value));
	},
	'submit .rocket-form'(e, instance) {
		e.preventDefault();

		var settings = {
			'Livechat_webhookUrl': s.trim(instance.$('#webhookUrl').val()),
			'Livechat_secret_token': s.trim(instance.$('#secretToken').val()),
			'Livechat_webhook_on_close': instance.$('#sendOnClose').get(0).checked,
			'Livechat_webhook_on_offline_msg': instance.$('#sendOnOffline').get(0).checked
		};
		Meteor.call('livechat:saveIntegration', settings, (err) => {
			if (err) {
				return handleError(err);
			}
			toastr.success(t('Saved'));
		});
	}
});
