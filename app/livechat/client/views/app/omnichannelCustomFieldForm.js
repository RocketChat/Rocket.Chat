import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import toastr from 'toastr';

import { t, handleError } from '../../../../utils';
import './omnichannelCustomFieldForm.html';
import { APIClient } from '../../../../utils/client';

Template.omnichannelCustomFieldForm.helpers({
	customField() {
		return Template.instance().customField.get();
	},
});

Template.omnichannelCustomFieldForm.events({
	'submit #customField-form'(e, instance) {
		e.preventDefault();
		const $btn = instance.$('button.save');

		const _id = $(e.currentTarget).data('id');
		const field = instance.$('input[name=field]').val();
		const label = instance.$('input[name=label]').val();
		const scope = instance.$('select[name=scope]').val();
		const visibility = instance.$('select[name=visibility]').val();
		const regexp = instance.$('input[name=regexp]').val();

		if (!/^[0-9a-zA-Z-_]+$/.test(field)) {
			return toastr.error(t('error-invalid-custom-field-name'));
		}

		if (label.trim() === '') {
			return toastr.error(t('Please_fill_a_label'));
		}

		const oldBtnValue = $btn.html();
		$btn.html(t('Saving'));

		const customFieldData = {
			field,
			label,
			scope: scope.trim(),
			visibility: visibility.trim(),
			regexp: regexp.trim(),
		};

		Meteor.call('livechat:saveCustomField', _id, customFieldData, function(error) {
			$btn.html(oldBtnValue);
			if (error) {
				return handleError(error);
			}

			toastr.success(t('Saved'));
			FlowRouter.go('omnichannel-customfields');
		});
	},

	'click button.back'(e/* , instance*/) {
		e.preventDefault();
		FlowRouter.go('omnichannel-customfields');
	},
});

Template.omnichannelCustomFieldForm.onCreated(async function() {
	this.customField = new ReactiveVar({});
	const { customField } = await APIClient.v1.get(`livechat/custom-fields/${ FlowRouter.getParam('_id') }`);
	if (customField) {
		this.customField.set(customField);
	}
});
