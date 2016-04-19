Template.livechatAppearance.helpers({
	previewState() {
		return Template.instance().previewState.get();
	},
	color() {
		return Template.instance().color.get();
	},
	title() {
		return Template.instance().title.get();
	},
	sampleData() {
		return {
			color: RocketChat.settings.get('Livechat_title_color'),
			title: RocketChat.settings.get('Livechat_title'),
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

	this.autorun(() => {
		this.title.set(RocketChat.settings.get('Livechat_title'));
	});
	this.autorun(() => {
		this.color.set(RocketChat.settings.get('Livechat_title_color'));
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

		instance.$('input.preview-settings[name=color]').minicolors('value', instance.color.get());
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
			}
		];
		RocketChat.settings.batchSet(settings, (err/*, success*/) => {
			if (err) {
				return toastr.error(t('Error_updating_settings'));
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
