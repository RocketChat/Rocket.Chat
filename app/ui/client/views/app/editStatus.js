import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import { settings } from '../../../../settings';
import { t } from '../../../../utils';
import { popover } from '../../../../ui-utils';
import { getPopoverStatusConfig } from '../..';
import { dispatchToastMessage } from '../../../../../client/lib/toast';

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
	'click .js-status-type'(e) {
		popover.open(getPopoverStatusConfig(e.currentTarget));
	},

	'submit .edit-status__content'(e, instance) {
		e.preventDefault();
		e.stopPropagation();
		const statusText = e.target.status.value?.trim();
		const statusType = e.target.statusType.value;

		if (statusText !== this.statusText) {
			if (statusText.length > 120) {
				dispatchToastMessage({ type: 'error', message: t('StatusMessage_Too_Long') });
				return false;
			}
			if (!settings.get('Accounts_AllowUserStatusMessageChange')) {
				dispatchToastMessage({ type: 'error', message: t('StatusMessage_Change_Disabled') });
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
