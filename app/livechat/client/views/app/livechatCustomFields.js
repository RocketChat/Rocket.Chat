import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import { modal } from '../../../../ui-utils';
import { t, handleError } from '../../../../utils';
import { LivechatCustomField } from '../../collections/LivechatCustomField';
import './livechatCustomFields.html';

Template.livechatCustomFields.helpers({
	customFields() {
		return LivechatCustomField.find();
	},
});

Template.livechatCustomFields.events({
	'click .remove-custom-field'(e) {
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
			Meteor.call('livechat:removeCustomField', this._id, function(error/* , result*/) {
				if (error) {
					return handleError(error);
				}
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

Template.livechatCustomFields.onCreated(function() {
	this.subscribe('livechat:customFields');
});
