import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { settings } from '../../../../settings';
import { t } from '../../../../utils';
import toastr from 'toastr';
import { popover } from '../../../../ui-utils';
import s from 'underscore.string';

Template.editStatus.helpers({
	canChange() {
		return settings.get('Accounts_AllowUserStatusMessageChange');
	},
	statusMessage() {
		return Meteor.user().statusMessage;
	},
});

Template.editStatus.events({
	'click .rc-input__icon__config-value'(e) {
		const instance = Template.instance();

		const options = [
			{
				icon: 'circle',
				name: t('Online'),
				modifier: 'online',
				action: () => {
					
				},
			},
			{
				icon: 'circle',
				name: t('Away'),
				modifier: 'away',
				action: () => {
					
				},
			},
			{
				icon: 'circle',
				name: t('Busy'),
				modifier: 'busy',
				action: () => {
					
				},
			},
			{
				icon: 'circle',
				name: t('Invisible'),
				modifier: 'invisible',
				action: () => {
					
				},
			},
		];

		const value = 'busy';
		// const value = instance.form[key].get();

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
		const status = s.trim(e.target.status.value);
		if (status !== this.statusMessage) {
			if (status.length > 120) {
				toastr.remove();
				toastr.error(t('StatusMessage_Too_Long'));
				return false;
			}
			if (!settings.get('Accounts_AllowUserStatusMessageChange')) {
				toastr.remove();
				toastr.error(t('StatusMessage_Change_Disabled'));
				return false;
			} else if (status || status.length === 0) {
				Meteor.call('setStatusMessage', status);
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
