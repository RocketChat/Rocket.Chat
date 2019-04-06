import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { settings } from '../../../settings';
import { getUserPreference, handleError, t } from '../../../utils';
import { popover } from '../../../ui-utils';
import { CustomSounds } from '../../../custom-sounds/client';
import { ChatSubscription } from '../../../models';

const notificationLabels = {
	all: 'All_messages',
	mentions: 'Mentions',
	nothing: 'Nothing',
};

const call = (method, ...params) => new Promise((resolve, reject) => {
	Meteor.call(method, ...params, (err, result) => {
		if (err) {
			handleError(err);
			return reject(err);
		}
		return resolve(result);
	});
});

Template.pushNotificationsFlexTab.helpers({
	notificationIsEnabled() {
		return !Template.instance().form.disableNotifications.get();
	},
	disableNotifications() {
		return Template.instance().form.disableNotifications.get();
	},
	showUnreadStatus() {
		return !Template.instance().form.hideUnreadStatus.get();
	},
	muteGroupMentions() {
		return Template.instance().form.muteGroupMentions.get();
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
		let preference = getUserPreference(Meteor.userId(), 'audioNotifications');
		if (preference === 'default') {
			preference = settings.get('Accounts_Default_User_Preferences_audioNotifications');
		}
		return notificationLabels[preference];
	},
	defaultDesktopNotification() {
		let preference = getUserPreference(Meteor.userId(), 'desktopNotifications');
		if (preference === 'default') {
			preference = settings.get('Accounts_Default_User_Preferences_desktopNotifications');
		}
		return notificationLabels[preference];
	},
	defaultMobileNotification() {
		let preference = getUserPreference(Meteor.userId(), 'mobileNotifications');
		if (preference === 'default') {
			preference = settings.get('Accounts_Default_User_Preferences_mobileNotifications');
		}
		return notificationLabels[preference];
	},
	disabled() {
		const { original, form } = Template.instance();
		return Object.keys(original).every((key) => original[key].get() === form[key].get());
	},
});

Template.pushNotificationsFlexTab.onCreated(function() {
	const rid = Session.get('openedRoom');
	const sub = ChatSubscription.findOne({ rid }, {
		fields: {
			disableNotifications: 1,
			hideUnreadStatus: 1,
			audioNotifications: 1,
			desktopNotifications: 1,
			mobilePushNotifications: 1,
			emailNotifications: 1,
			desktopNotificationDuration: 1,
			audioNotificationValue: 1,
			muteGroupMentions: 1,
		},
	}) || {};

	const {
		disableNotifications = false,
		hideUnreadStatus = false,
		audioNotifications = 'default',
		desktopNotifications = 'default',
		mobilePushNotifications = 'default',
		emailNotifications = 'default',
		desktopNotificationDuration = 0,
		audioNotificationValue = null,
		muteGroupMentions = false,
	} = sub;

	this.original = {
		disableNotifications: new ReactiveVar(disableNotifications),
		hideUnreadStatus: new ReactiveVar(hideUnreadStatus),
		audioNotifications: new ReactiveVar(audioNotifications),
		desktopNotifications: new ReactiveVar(desktopNotifications),
		mobilePushNotifications: new ReactiveVar(mobilePushNotifications),
		emailNotifications: new ReactiveVar(emailNotifications),
		desktopNotificationDuration: new ReactiveVar(desktopNotificationDuration),
		audioNotificationValue: new ReactiveVar(audioNotificationValue),
		muteGroupMentions: new ReactiveVar(muteGroupMentions),
	};

	this.form = {
		disableNotifications: new ReactiveVar(disableNotifications),
		hideUnreadStatus: new ReactiveVar(hideUnreadStatus),
		audioNotifications: new ReactiveVar(audioNotifications),
		desktopNotifications: new ReactiveVar(desktopNotifications),
		mobilePushNotifications: new ReactiveVar(mobilePushNotifications),
		emailNotifications: new ReactiveVar(emailNotifications),
		desktopNotificationDuration: new ReactiveVar(desktopNotificationDuration),
		audioNotificationValue: new ReactiveVar(audioNotificationValue),
		muteGroupMentions: new ReactiveVar(muteGroupMentions),
	};

	this.saveSetting = async () => {
		Object.keys(this.original).forEach(async (field) => {
			if (this.original[field].get() === this.form[field].get()) {
				return;
			}
			let value = this.form[field].get();

			if (typeof value === 'boolean') {
				value = value ? '1' : '0';
			}
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
		const user = Meteor.userId();

		let value = Template.instance().form.audioNotificationValue.get();
		if (value === '0') {
			value = getUserPreference(user, 'newMessageNotification');
		}

		if (value && value !== 'none') {
			const audioVolume = getUserPreference(user, 'notificationsSoundVolume');
			const $audio = $(`audio#${ value }`);

			if ($audio && $audio[0] && $audio[0].play) {
				$audio[0].volume = Number((audioVolume / 100).toPrecision(2));
				$audio[0].play();
			}
		}
	},

	'change input[type=checkbox]'(e, instance) {
		e.preventDefault();
		const name = $(e.currentTarget).attr('name');
		const checked = ['disableNotifications', 'hideUnreadStatus'].includes(name) ? !e.currentTarget.checked : e.currentTarget.checked;
		instance.form[name].set(checked);
	},

	'click .rc-user-info__config-value'(e) {
		const instance = Template.instance();
		const key = this.valueOf();

		let options;

		switch (key) {
			case 'audioNotificationValue':
				const audioAssets = (CustomSounds && CustomSounds.getList && CustomSounds.getList()) || [];
				const audioAssetsArray = audioAssets.map((audio) => ({
					id: `audioNotificationValue${ audio.name }`,
					name: 'audioNotificationValue',
					label: audio.name,
					value: audio._id,
				}));
				options = [
					{
						id: 'audioNotificationValueNone',
						name: 'audioNotificationValue',
						label: 'None',
						value: 'none',
					},
					{
						id: 'audioNotificationValueDefault',
						name: 'audioNotificationValue',
						label: 'Default',
						value: 0,
					},
					...audioAssetsArray,
				];
				break;
			case 'desktopNotificationDuration':
				options = [{
					id: 'desktopNotificationDuration',
					name: 'desktopNotificationDuration',
					label: 'Default',
					value: 0,
				},
				{
					id: 'desktopNotificationDuration1s',
					name: 'desktopNotificationDuration',
					label: `1 ${ t('seconds') }`,
					value: 1,
				},
				{
					id: 'desktopNotificationDuration2s',
					name: 'desktopNotificationDuration',
					label: `2 ${ t('seconds') }`,
					value: 2,
				},
				{
					id: 'desktopNotificationDuration3s',
					name: 'desktopNotificationDuration',
					label: `3 ${ t('seconds') }`,
					value: 3,
				},
				{
					id: 'desktopNotificationDuration4s',
					name: 'desktopNotificationDuration',
					label: `4 ${ t('seconds') }`,
					value: 4,
				},
				{
					id: 'desktopNotificationDuration5s',
					name: 'desktopNotificationDuration',
					label: `5 ${ t('seconds') }`,
					value: 5,
				}];
				break;
			default:
				options = [{
					id: 'desktopNotificationsDefault',
					name: 'desktopNotifications',
					label: 'Default',
					value: 'default',
				},
				{
					id: 'desktopNotificationsAll_messages',
					name: 'desktopNotifications',
					label: 'All_messages',
					value: 'all',
				},
				{
					id: 'desktopNotificationsMentions',
					name: 'desktopNotifications',
					label: 'Mentions',
					value: 'mentions',
				},
				{
					id: 'desktopNotificationsNothing',
					name: 'desktopNotifications',
					label: 'Nothing',
					value: 'nothing',
				}];
		}

		const config = {
			popoverClass: 'notifications-preferences',
			template: 'pushNotificationsPopover',
			data: {
				change : (value) => instance.form[key].set(key === 'desktopNotificationDuration' ? parseInt(value) : value),
				value: instance.form[key].get(),
				options,
			},
			currentTarget: e.currentTarget,
			offsetVertical: e.currentTarget.clientHeight + 10,
		};
		popover.open(config);
	},
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
		let preference = getUserPreference(Meteor.userId(), 'desktopNotifications');
		if (preference === 'default') {
			preference = settings.get('Accounts_Default_User_Preferences_desktopNotifications');
		}
		return notificationLabels[preference];
	},
});
Template.pushNotificationsPopover.events({
	'change input'(e, instance) {
		instance.change && instance.change(e.target.value);
	},
});
