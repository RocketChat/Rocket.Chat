/*globals jscolor*/
/*eslint new-cap: ["error", { "newIsCapExceptions": ["jscolor"] }]*/
import moment from 'moment';
import toastr from 'toastr';

const LivechatAppearance = new Mongo.Collection('livechatAppearance');
const LivechatAppearanceTexts = new Mongo.Collection('livechatAppearanceTexts');

Template.livechatAppearance.helpers({
	chosenLanguage() {
		return Template.instance().chosenLanguage.get();
	},
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
		return Template.instance().emailOffline.get();
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
	},
	languages() {
		const languages = TAPi18n.getLanguages();

		let result = Object.keys(languages).map(key => {
			const language = languages[key];
			return _.extend(language, {key});
		});

		result = _.sortBy(result, 'key');
		return result;
	},
	defaultLanguage(key) {
		return 'en' === key;
	}
});

Template.livechatAppearance.onCreated(function() {
	this.subscribe('livechat:appearance');
	this.subscribe('livechat:appearancetexts');

	this.previewState = new ReactiveVar('opened');
	this.chosenLanguage = new ReactiveVar('en');

	this.title = new ReactiveVar(null);
	this.color = new ReactiveVar(null);

	this.displayOfflineForm = new ReactiveVar(null);
	this.offlineUnavailableMessage = new ReactiveVar(null);
	this.offlineMessage = new ReactiveVar(null);
	this.offlineSuccessMessage = new ReactiveVar(null);
	this.titleOffline = new ReactiveVar(null);
	this.colorOffline = new ReactiveVar(null);
	this.emailOffline = new ReactiveVar(null);

	this.autorun(() => {
		const setting = LivechatAppearanceTexts.findOne({identifier: 'Livechat_title', lang: this.chosenLanguage.get()});
		this.title.set(setting && setting.text);
	});
	this.autorun(() => {
		const setting = LivechatAppearance.findOne('Livechat_title_color');
		this.color.set(setting && setting.value);
	});
	this.autorun(() => {
		const setting = LivechatAppearance.findOne('Livechat_display_offline_form');
		this.displayOfflineForm.set(setting && setting.value);
	});
	this.autorun(() => {
		const setting = LivechatAppearanceTexts.findOne({identifier: 'Livechat_offline_form_unavailable', lang: this.chosenLanguage.get()});
		this.offlineUnavailableMessage.set(setting && setting.text);
	});
	this.autorun(() => {
		const setting = LivechatAppearanceTexts.findOne({identifier: 'Livechat_offline_message', lang: this.chosenLanguage.get()});
		this.offlineMessage.set(setting && setting.text);
	});
	this.autorun(() => {
		const setting = LivechatAppearanceTexts.findOne({identifier: 'Livechat_offline_success_message', lang: this.chosenLanguage.get()});
		this.offlineSuccessMessage.set(setting && setting.text);
	});
	this.autorun(() => {
		const setting = LivechatAppearanceTexts.findOne({identifier: 'Livechat_offline_title', lang: this.chosenLanguage.get()});
		this.titleOffline.set(setting && setting.text);
	});
	this.autorun(() => {
		const setting = LivechatAppearance.findOne('Livechat_offline_title_color');
		this.colorOffline.set(setting && setting.value);
	});
	this.autorun(() => {
		const setting = LivechatAppearance.findOne('Livechat_offline_email');
		this.emailOffline.set(setting && setting.value);
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
	'change #language, keyup #language'(e, instance) {
		instance.chosenLanguage.set(e.currentTarget.value);
	},
	'click .reset-settings'(e, instance) {
		e.preventDefault();

		const settingTitle = LivechatAppearanceTexts.findOne({identifier: 'Livechat_title', lang: instance.chosenLanguage.get()});
		instance.title.set(settingTitle && settingTitle.text);

		const settingTitleColor = LivechatAppearance.findOne('Livechat_title_color');
		instance.color.set(settingTitleColor && settingTitleColor.value);

		const settingDiplayOffline = LivechatAppearance.findOne('Livechat_display_offline_form');
		instance.displayOfflineForm.set(settingDiplayOffline && settingDiplayOffline.value);

		const settingFormUnavailable = LivechatAppearanceTexts.findOne({identifier: 'Livechat_offline_form_unavailable', lang: instance.chosenLanguage.get()});
		instance.offlineUnavailableMessage.set(settingFormUnavailable && settingFormUnavailable.text);

		const settingOfflineMessage = LivechatAppearanceTexts.findOne({identifier: 'Livechat_offline_message', lang: instance.chosenLanguage.get()});
		instance.offlineMessage.set(settingOfflineMessage && settingOfflineMessage.text);

		const settingOfflineSuccess = LivechatAppearanceTexts.findOne({identifier: 'Livechat_offline_success_message', lang: instance.chosenLanguage.get()});
		instance.offlineSuccessMessage.set(settingOfflineSuccess && settingOfflineSuccess.text);

		const settingOfflineTitle = LivechatAppearanceTexts.findOne({identifier: 'Livechat_offline_title', lang: instance.chosenLanguage.get()});
		instance.titleOffline.set(settingOfflineTitle && settingOfflineTitle.text);

		const settingOfflineTitleColor = LivechatAppearance.findOne('Livechat_offline_title_color');
		instance.colorOffline.set(settingOfflineTitleColor && settingOfflineTitleColor.value);

		const settingEmailOffline = LivechatAppearance.findOne('Livechat_offline_email');
		instance.emailOffline.set(settingEmailOffline && settingEmailOffline.value);
	},
	'submit .rocket-form'(e, instance) {
		e.preventDefault();

		const settingsAppearance = [
			{
				_id: 'Livechat_title_color',
				value: instance.color.get()
			},
			{
				_id: 'Livechat_display_offline_form',
				value: instance.displayOfflineForm.get()
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

		const settingTexts = [
			{
				identifier: 'Livechat_title',
				lang: instance.chosenLanguage.get(),
				text: _.trim(instance.title.get())
			},
			{
				identifier: 'Livechat_offline_form_unavailable',
				lang: instance.chosenLanguage.get(),
				text: _.trim(instance.offlineUnavailableMessage.get())
			},
			{
				identifier: 'Livechat_offline_message',
				lang: instance.chosenLanguage.get(),
				text: _.trim(instance.offlineMessage.get())
			},
			{
				identifier: 'Livechat_offline_success_message',
				lang: instance.chosenLanguage.get(),
				text: _.trim(instance.offlineSuccessMessage.get())
			},
			{
				identifier: 'Livechat_offline_title',
				lang: instance.chosenLanguage.get(),
				text: _.trim(instance.titleOffline.get())
			}
		];

		Meteor.call('livechat:saveAppearance', settingsAppearance, (err/*, success*/) => {
			if (err) {
				return handleError(err);
			}

			// chain with localized texts
			Meteor.call('livechat:saveAppearanceTexts', settingTexts, (err/*, success*/) => {
				if (err) {
					return handleError(err);
				}
				toastr.success(t('Settings_updated'));
			});
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
