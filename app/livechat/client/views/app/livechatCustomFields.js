import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import { modal } from '../../../../ui-utils';
import { t, handleError } from '../../../../utils';
import './livechatCustomFields.html';
import { APIClient } from '../../../../utils/client';

const loadCustomFields = async (instance) => {
	const { customFields } = await APIClient.v1.get('livechat/custom-fields');
	instance.customFields.set(customFields);
};

Template.livechatCustomFields.helpers({
	customFields() {
		return Template.instance().customFields.get();
	},
});

Template.livechatCustomFields.events({
	'click .remove-custom-field'(e, instance) {
		e.preventDefault();
		e.stopPropagation();

		modal.open({
			title: t('Are_you_sure'),
			type: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#DD6B55',
			confirmButtonText: t('Yes'),
			cancelButtonText: t('Cancel'),
			closeOnConfirm: false,
			html: false,
		}, () => {
			Meteor.call('livechat:removeCustomField', this._id, async function(error/* , result*/) {
				if (error) {
					return handleError(error);
				}
				await loadCustomFields(instance);
				modal.open({
					title: t('Removed'),
					text: t('Field_removed'),
					type: 'success',
					timer: 1000,
					showConfirmButton: false,
				});
			});
		});
	},

	'click .custom-field-info'(e/* , instance*/) {
		e.preventDefault();
		FlowRouter.go('livechat-customfield-edit', { _id: this._id });
	},
});

Template.livechatCustomFields.onCreated(async function() {
	this.customFields = new ReactiveVar([]);
	await loadCustomFields(this);
});
