import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import toastr from 'toastr';
import s from 'underscore.string';

import { settings } from '../../../../settings';
import { t } from '../../../../utils';
import { popover } from '../../../../ui-utils';

Template.editStatus.helpers({
	canChange() {
		return settings.get('Accounts_AllowUserStatusMessageChange');
	},
	statusType() {
		return Meteor.user().status;
	},
	statusText() {
		return Meteor.user().statusText;
	},
});

Template.editStatus.events({
	'click .edit-status .rc-input__icon'(e) {
		const options = [
			{
				icon: 'circle',
				name: t('Online'),
				modifier: 'online',
				action: () => {
					$('input[name=statusType]').val('online');
					$('.edit-status .rc-input__icon').prop('class', 'rc-input__icon edit-status-type-icon--online');
				},
			},
			{
				icon: 'circle',
				name: t('Away'),
				modifier: 'away',
				action: () => {
					$('input[name=statusType]').val('away');
					$('.edit-status .rc-input__icon').prop('class', 'rc-input__icon edit-status-type-icon--away');
				},
			},
			{
				icon: 'circle',
				name: t('Busy'),
				modifier: 'busy',
				action: () => {
					$('input[name=statusType]').val('busy');
					$('.edit-status .rc-input__icon').prop('class', 'rc-input__icon edit-status-type-icon--busy');
				},
			},
			{
				icon: 'circle',
				name: t('Invisible'),
				modifier: 'offline',
				action: () => {
					$('input[name=statusType]').val('offline');
					$('.edit-status .rc-input__icon').prop('class', 'rc-input__icon edit-status-type-icon--offline');
				},
			},
		];

		const config = {
			popoverClass: 'edit-status-type',
			columns: [
				{
					groups: [
						{
							items: options,
						},
					],
				},
			],
			currentTarget: e.currentTarget,
			offsetVertical: e.currentTarget.clientHeight,
		};
		popover.open(config);
	},

	'submit .edit-status__content'(e, instance) {
		e.preventDefault();
		e.stopPropagation();
		const statusText = s.trim(e.target.status.value);
		const statusType = e.target.statusType.value;

		if (statusText !== this.statusText) {
			if (statusText.length > 120) {
				toastr.remove();
				toastr.error(t('StatusMessage_Too_Long'));
				return false;
			}
			if (!settings.get('Accounts_AllowUserStatusMessageChange')) {
				toastr.remove();
				toastr.error(t('StatusMessage_Change_Disabled'));
				return false;
			}

			if (statusText || statusText.length === 0) {
				Meteor.call('setUserStatus', statusType, statusText);
				if (instance.data.onSave) {
					instance.data.onSave(true);
				}
				return;
			}
		}
		return false;
	},
});


Template.editStatus.onRendered(function() {
	this.firstNode.querySelector('[name="status"]').focus();
});
