/* globals ChatSubscription popover */

const notificationLabels = {
	all: 'All_messages',
	mentions: 'Mentions',
	nothing: 'Nothing'
};

const call = (method, ...params) => {
	return new Promise((resolve, reject) => {
		Meteor.call(method, ...params, (err, result)=> {
			if (err) {
				handleError(err);
				return reject(err);
			}
			return resolve(result);
		});
	});
};

Template.pushNotificationsFlexTab.helpers({
	disableNotifications() {
		return Template.instance().form.disableNotifications.get();
	},
	hideUnreadStatus() {
		return Template.instance().form.hideUnreadStatus.get();
	},
	audioNotifications() {
		return Template.instance().form.audioNotifications.get();
	},
	audioNotificationValue() {
		const value = Template.instance().form.audioNotificationValue.get();
		if (value === '0') {
			return t('Use_account_preference');
		}

		return value;
	},
	desktopNotifications() {
		return Template.instance().form.desktopNotifications.get();
	},
	mobilePushNotifications() {
		return Template.instance().form.mobilePushNotifications.get();
	},
	emailNotifications() {
		return Template.instance().form.emailNotifications.get();
	},
	desktopNotificationDuration() {
		return Template.instance().form.desktopNotificationDuration.get();
	},
	subValue(field) {
		const { form } = Template.instance();
		if (form[field]) {
			switch (form[field].get()) {
				case 'all':
					return t('All_messages');
				case 'nothing':
					return t('Nothing');
				case 'default':
					return t('Use_account_preference');
				case 'mentions':
					return t('Mentions');
				default:
					return t('Use_account_preference');
			}
		}
	},
	defaultAudioNotification() {
		let preference = RocketChat.getUserPreference(Meteor.user(), 'audioNotifications');
		if (preference === 'default') {
			preference = RocketChat.settings.get('Accounts_Default_User_Preferences_audioNotifications');
		}
		return notificationLabels[preference];
	},
	defaultDesktopNotification() {
		let preference = RocketChat.getUserPreference(Meteor.user(), 'desktopNotifications');
		if (preference === 'default') {
			preference = RocketChat.settings.get('Accounts_Default_User_Preferences_desktopNotifications');
		}
		return notificationLabels[preference];
	},
	defaultMobileNotification() {
		let preference = RocketChat.getUserPreference(Meteor.user(), 'mobileNotifications');
		if (preference === 'default') {
			preference = RocketChat.settings.get('Accounts_Default_User_Preferences_mobileNotifications');
		}
		return notificationLabels[preference];
	},
	disabled() {
		const { original, form } = Template.instance();
		return Object.keys(original).every(key => original[key].get() === form[key].get());
	}
});

Template.pushNotificationsFlexTab.onCreated(function() {
	const rid = Session.get('openedRoom');
	const sub = ChatSubscription.findOne({rid}, {
		fields: {
			disableNotifications: 1,
			hideUnreadStatus: 1,
			audioNotifications: 1,
			desktopNotifications: 1,
			mobilePushNotifications: 1,
			emailNotifications: 1,
			desktopNotificationDuration: 1,
			audioNotificationValue: 1
		}
	}) || {};

	const {
		disableNotifications = false,
		hideUnreadStatus = false,
		audioNotifications = 'default',
		desktopNotifications = 'default',
		mobilePushNotifications = 'default',
		emailNotifications = 'default',
		desktopNotificationDuration = 0,
		audioNotificationValue = null
	} = sub;

	this.original = {
		disableNotifications: new ReactiveVar(disableNotifications),
		hideUnreadStatus: new ReactiveVar(hideUnreadStatus),
		audioNotifications: new ReactiveVar(audioNotifications),
		desktopNotifications: new ReactiveVar(desktopNotifications),
		mobilePushNotifications: new ReactiveVar(mobilePushNotifications),
		emailNotifications: new ReactiveVar(emailNotifications),
		desktopNotificationDuration: new ReactiveVar(desktopNotificationDuration),
		audioNotificationValue: new ReactiveVar(audioNotificationValue)
	};

	this.form = {
		disableNotifications: new ReactiveVar(disableNotifications),
		hideUnreadStatus: new ReactiveVar(hideUnreadStatus),
		audioNotifications: new ReactiveVar(audioNotifications),
		desktopNotifications: new ReactiveVar(desktopNotifications),
		mobilePushNotifications: new ReactiveVar(mobilePushNotifications),
		emailNotifications: new ReactiveVar(emailNotifications),
		desktopNotificationDuration: new ReactiveVar(desktopNotificationDuration),
		audioNotificationValue: new ReactiveVar(audioNotificationValue)
	};

	this.saveSetting = async() => {
		Object.keys(this.original).forEach(async field => {
			if (this.original[field].get() === this.form[field].get()) {
				return;
			}
			let value = this.form[field].get();

			value = typeof value === 'boolean' ? value ? '1' : '0' : value;
			const rid = Session.get('openedRoom');
			switch (field) {
				case 'desktopNotificationDuration':
					await call('saveDesktopNotificationDuration', rid, value);
					break;
				case 'audioNotificationValue':
					await call('saveAudioNotificationValue', rid, value);
					break;
				default:
					await call('saveNotificationSettings', rid, field, value);
			}
			this.original[field].set(this.form[field].get());

		});
	};
});

Template.pushNotificationsFlexTab.events({
	'click .js-cancel'(e, instance) {
		instance.data.tabBar.close();
	},

	'click .js-save'(e, instance) {
		e.preventDefault();
		instance.saveSetting();
	},

	'click [data-play]'(e) {
		e.preventDefault();
		const user = Meteor.user();

		let value = Template.instance().form.audioNotificationValue.get();
		if (value === '0') {
			value = RocketChat.getUserPreference(user, 'newMessageNotification');
		}

		if (value && value !== 'none') {
			const audioVolume = RocketChat.getUserPreference(user, 'notificationsSoundVolume');
			const $audio = $(`audio#${ value }`);

			if ($audio && $audio[0] && $audio[0].play) {
				$audio[0].volume = Number((audioVolume/100).toPrecision(2));
				$audio[0].play();
			}
		}
	},

	'change input[type=checkbox]'(e, instance) {
		e.preventDefault();
		instance.form[$(e.currentTarget).attr('name')].set(e.currentTarget.checked);
	},

	'click .rc-user-info__config-value'(e) {
		const instance = Template.instance();
		const key = this.valueOf();

		let options;

		switch (key) {
			case 'audioNotificationValue':
				const audioAssets = RocketChat.CustomSounds && RocketChat.CustomSounds.getList && RocketChat.CustomSounds.getList() || [];
				const audioAssetsArray = audioAssets.map(audio => {
					return {
						id: `audioNotificationValue${ audio.name }`,
						name: 'audioNotificationValue',
						label: audio.name,
						value: audio._id
					};
				});
				options = [
					{
						id: 'audioNotificationValueNone',
						name: 'audioNotificationValue',
						label: 'None',
						value: 'none'
					},
					{
						id: 'audioNotificationValueDefault',
						name: 'audioNotificationValue',
						label: 'Default',
						value: 0
					},
					...audioAssetsArray
				];
				break;
			case 'desktopNotificationDuration':
				options = [{
					id: 'desktopNotificationDuration',
					name: 'desktopNotificationDuration',
					label: 'Default',
					value: 0
				},
				{
					id: 'desktopNotificationDuration1s',
					name: 'desktopNotificationDuration',
					label: `1 ${ t('seconds') }`,
					value: 1
				},
				{
					id: 'desktopNotificationDuration2s',
					name: 'desktopNotificationDuration',
					label: `2 ${ t('seconds') }`,
					value: 2
				},
				{
					id: 'desktopNotificationDuration3s',
					name: 'desktopNotificationDuration',
					label: `3 ${ t('seconds') }`,
					value: 3
				},
				{
					id: 'desktopNotificationDuration4s',
					name: 'desktopNotificationDuration',
					label: `4 ${ t('seconds') }`,
					value: 4
				},
				{
					id: 'desktopNotificationDuration5s',
					name: 'desktopNotificationDuration',
					label: `5 ${ t('seconds') }`,
					value: 5
				}];
				break;
			default:
				options = [{
					id: 'desktopNotificationsDefault',
					name: 'desktopNotifications',
					label: 'Default',
					value: 'default'
				},
				{
					id: 'desktopNotificationsAll_messages',
					name: 'desktopNotifications',
					label: 'All_messages',
					value: 'all'
				},
				{
					id: 'desktopNotificationsMentions',
					name: 'desktopNotifications',
					label: 'Mentions',
					value: 'mentions'
				},
				{
					id: 'desktopNotificationsNothing',
					name: 'desktopNotifications',
					label: 'Nothing',
					value: 'nothing'
				}];
		}

		const config = {
			popoverClass: 'notifications-preferences',
			template: 'pushNotificationsPopover',
			mousePosition: () => ({
				x: e.currentTarget.getBoundingClientRect().left,
				y: e.currentTarget.getBoundingClientRect().bottom + 50
			}),
			customCSSProperties: () => ({
				top:  `${ e.currentTarget.getBoundingClientRect().bottom + 10 }px`,
				left: `${ e.currentTarget.getBoundingClientRect().left - 10 }px`
			}),
			data: {
				change : (value) => {
					return instance.form[key].set(key === 'desktopNotificationDuration' ? parseInt(value) : value);
				},
				value: instance.form[key].get(),
				options
			}
		};
		popover.open(config);
	}
});



Template.pushNotificationsPopover.onCreated(function() {
	this.change = this.data.change;
});

Template.pushNotificationsPopover.onRendered(function() {
	this.find(`[value=${ this.data.value }]`).checked = true;
});

Template.pushNotificationsPopover.helpers({
	options() {
		return Template.instance().data.options;
	},
	defaultDesktopNotification() {
		let preference = RocketChat.getUserPreference(Meteor.user(), 'desktopNotifications');
		if (preference === 'default') {
			preference = RocketChat.settings.get('Accounts_Default_User_Preferences_desktopNotifications');
		}
		return notificationLabels[preference];
	}
});
Template.pushNotificationsPopover.events({
	'change input'(e, instance) {
		instance.change && instance.change(e.target.value);
	}
});
