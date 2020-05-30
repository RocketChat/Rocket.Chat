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

const getAudioAssetsArray = () => CustomSounds.getList().map((audio) => ({
	id: `audioNotificationValue${ audio.name }`,
	name: 'audioNotificationValue',
	label: audio.name,
	value: `${ audio._id } ${ audio.name }`,
}));

const getAudioAssetValue = (value) => {
	const asset = CustomSounds.getList().find((audio) => audio._id === value);
	return asset ? `${ asset._id } ${ asset.name }` : '0 Default';
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
		const audioNotificationValue = Template.instance().form.audioNotificationValue.get();
		const value = audioNotificationValue && audioNotificationValue.split(' ');
		if (!value || value[0] === '0') {
			return t('Use_account_preference');
		}

		return value[1];
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
		muteGroupMentions = false,
	} = sub;

	const audioNotificationValue = sub.audioNotificationValue && getAudioAssetValue(sub.audioNotificationValue);

	this.original = {
		disableNotifications: new ReactiveVar(disableNotifications),
		hideUnreadStatus: new ReactiveVar(hideUnreadStatus),
		audioNotifications: new ReactiveVar(audioNotifications),
		desktopNotifications: new ReactiveVar(desktopNotifications),
		mobilePushNotifications: new ReactiveVar(mobilePushNotifications),
		emailNotifications: new ReactiveVar(emailNotifications),
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
				case 'audioNotificationValue':
					await call('saveAudioNotificationValue', rid, value.split(' ')[0]);
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

		const uid = Meteor.userId();
		const formValue = Template.instance().form.audioNotificationValue.get();

		const value = formValue && formValue.split(' ')[0] && formValue.split(' ')[0] !== '0'
			? formValue.split(' ')[0]
			: getUserPreference(uid, 'newMessageNotification');

		if (!value || value === 'none') {
			return;
		}

		const audioVolume = getUserPreference(uid, 'notificationsSoundVolume');
		CustomSounds.play(value, {
			volume: Number((audioVolume / 100).toPrecision(2)),
		});
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
				const audioAssetsArray = getAudioAssetsArray();
				options = [
					{
						id: 'audioNotificationValueNone',
						name: 'audioNotificationValue',
						label: 'None',
						value: 'none None',
					},
					{
						id: 'audioNotificationValueDefault',
						name: 'audioNotificationValue',
						label: 'Default',
						value: '0 Default',
					},
					...audioAssetsArray,
				];
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
				change: (value) => instance.form[key].set(value),
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
	this.find(`[value='${ this.data.value }']`).checked = true;
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
