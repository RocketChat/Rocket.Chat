Template.livechatIntegrations.helpers({
	webhookUrl() {
		return Template.instance().settingValue.get();
	},
	secretToken() {
		return Template.instance().secretToken.get();
	},
	disableTest() {
		return Template.instance().disableTest.get();
	},
	sendOnCloseChecked() {
		return Template.instance().sendOnClose.get();
	},
	sendOnOfflineChecked() {
		return Template.instance().sendOnOffline.get();
	}
});

Template.livechatIntegrations.onCreated(function() {
	this.disableTest = new ReactiveVar(true);
	this.settingValue = new ReactiveVar();
	this.secretToken = new ReactiveVar();
	this.sendOnClose = new ReactiveVar();
	this.sendOnOffline = new ReactiveVar();

	this.autorun(() => {
		this.disableTest.set(_.isEmpty(RocketChat.settings.get('Livechat_webhookUrl')));
		this.settingValue.set(RocketChat.settings.get('Livechat_webhookUrl'));
	});

	this.autorun(() => {
		this.secretToken.set(RocketChat.settings.get('Livechat_secret_token'));
	});

	this.autorun(() => {
		this.sendOnClose.set(RocketChat.settings.get('Livechat_webhook_on_close'));
	});

	this.autorun(() => {
		this.sendOnOffline.set(RocketChat.settings.get('Livechat_webhook_on_offline_msg'));
	});
});

Template.livechatIntegrations.events({
	'change #webhookUrl, blur #webhookUrl'(e, instance) {
		instance.disableTest.set(e.currentTarget.value !== instance.settingValue.get());
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

		instance.$('#webhookUrl').val(instance.settingValue.get());

		instance.disableTest.set(false);
	},
	'submit .rocket-form'(e, instance) {
		e.preventDefault();

		var settings = [
			{
				_id: 'Livechat_webhookUrl',
				value: s.trim(instance.$('#webhookUrl').val())
			},
			{
				_id: 'Livechat_secret_token',
				value: s.trim(instance.$('#secretToken').val())
			},
			{
				_id: 'Livechat_webhook_on_close',
				value: instance.$('#sendOnClose').get(0).checked
			},
			{
				_id: 'Livechat_webhook_on_offline_msg',
				value: instance.$('#sendOnOffline').get(0).checked
			}
		];
		RocketChat.settings.batchSet(settings, (err/*, success*/) => {
			if (err) {
				return handleError(err);
			}
			toastr.success(t('Saved'));
		});
	}
});
