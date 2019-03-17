import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { settings } from '../../../../settings';
import { t } from '../../../../utils';
import toastr from 'toastr';
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
