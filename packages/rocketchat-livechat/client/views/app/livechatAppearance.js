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
		return RocketChat.settings.get('Livechat_offline_email');
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
	this.previewState = new ReactiveVar('opened');

	this.title = new ReactiveVar(null);
	this.color = new ReactiveVar(null);

	this.displayOfflineForm = new ReactiveVar(null);
	this.offlineUnavailableMessage = new ReactiveVar(null);
	this.offlineMessage = new ReactiveVar(null);
	this.offlineSuccessMessage = new ReactiveVar(null);
	this.titleOffline = new ReactiveVar(null);
	this.colorOffline = new ReactiveVar(null);

	this.autorun(() => {
		this.title.set(RocketChat.settings.get('Livechat_title'));
	});
	this.autorun(() => {
		this.color.set(RocketChat.settings.get('Livechat_title_color'));
	});
	this.autorun(() => {
		this.displayOfflineForm.set(RocketChat.settings.get('Livechat_display_offline_form'));
	});
	this.autorun(() => {
		this.offlineUnavailableMessage.set(RocketChat.settings.get('Livechat_offline_form_unavailable'));
	});
	this.autorun(() => {
		this.offlineMessage.set(RocketChat.settings.get('Livechat_offline_message'));
	});
	this.autorun(() => {
		this.offlineSuccessMessage.set(RocketChat.settings.get('Livechat_offline_success_message'));
	});
	this.autorun(() => {
		this.titleOffline.set(RocketChat.settings.get('Livechat_offline_title'));
	});
	this.autorun(() => {
		this.colorOffline.set(RocketChat.settings.get('Livechat_offline_title_color'));
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

		instance.title.set(RocketChat.settings.get('Livechat_title'));
		instance.color.set(RocketChat.settings.get('Livechat_title_color'));
		instance.displayOfflineForm.set(RocketChat.settings.get('Livechat_display_offline_form'));
		instance.offlineUnavailableMessage.set(RocketChat.settings.get('Livechat_offline_form_unavailable'));
		instance.offlineMessage.set(RocketChat.settings.get('Livechat_offline_message'));
		instance.offlineSuccessMessage.set(RocketChat.settings.get('Livechat_offline_success_message'));
		instance.titleOffline.set(RocketChat.settings.get('Livechat_offline_title'));
		instance.colorOffline.set(RocketChat.settings.get('Livechat_offline_title_color'));

		instance.$('input.preview-settings[name=color]').minicolors('value', instance.color.get());
		instance.$('input.preview-settings[name=colorOffline]').minicolors('value', instance.colorOffline.get());
	},
	'submit .rocket-form'(e, instance) {
		e.preventDefault();

		var settings = [
			{
				_id: 'Livechat_title',
				value: _.trim(instance.title.get())
			},
			{
				_id: 'Livechat_title_color',
				value: instance.color.get()
			},
			{
				_id: 'Livechat_display_offline_form',
				value: instance.displayOfflineForm.get()
			},
			{
				_id: 'Livechat_offline_form_unavailable',
				value: _.trim(instance.offlineUnavailableMessage.get())
			},
			{
				_id: 'Livechat_offline_message',
				value: _.trim(instance.offlineMessage.get())
			},
			{
				_id: 'Livechat_offline_success_message',
				value: _.trim(instance.offlineSuccessMessage.get())
			},
			{
				_id: 'Livechat_offline_title',
				value: _.trim(instance.titleOffline.get())
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
		RocketChat.settings.batchSet(settings, (err/*, success*/) => {
			if (err) {
				return handleError(err);
			}
			toastr.success(t('Settings_updated'));
		});
	}
});

Template.livechatAppearance.onRendered(function() {
	Meteor.setTimeout(() => {
		$('input.minicolors').minicolors({
			theme: 'rocketchat',
			letterCase: 'uppercase'
		});
	}, 500);
});
