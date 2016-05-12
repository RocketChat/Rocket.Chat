Template.livechatAppearance.helpers({
	previewState() {
		return Template.instance().previewState.get();
	},
	showOnline() {
		return Template.instance().previewState.get().indexOf('offline') === -1;
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

	this.offlineMessage = new ReactiveVar(null);
	this.titleOffline = new ReactiveVar(null);
	this.colorOffline = new ReactiveVar(null);

	this.autorun(() => {
		this.title.set(RocketChat.settings.get('Livechat_title'));
	});
	this.autorun(() => {
		this.color.set(RocketChat.settings.get('Livechat_title_color'));
	});
	this.autorun(() => {
		this.offlineMessage.set(RocketChat.settings.get('Livechat_offline_message'));
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
		instance[e.currentTarget.name].set(e.currentTarget.value);
	},
	'click .reset-settings'(e, instance) {
		e.preventDefault();

		instance.title.set(RocketChat.settings.get('Livechat_title'));
		instance.color.set(RocketChat.settings.get('Livechat_title_color'));
		instance.offlineMessage.set(RocketChat.settings.get('Livechat_offline_message'));
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
				value: instance.title.get()
			},
			{
				_id: 'Livechat_title_color',
				value: instance.color.get()
			},
			{
				_id: 'Livechat_offline_message',
				value: instance.offlineMessage.get()
			},
			{
				_id: 'Livechat_offline_title',
				value: instance.titleOffline.get()
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
