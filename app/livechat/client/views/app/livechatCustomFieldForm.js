import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import toastr from 'toastr';

import { t, handleError } from '../../../../utils';
import { getCustomFormTemplate } from './customTemplates/register';
import './livechatCustomFieldForm.html';
import { APIClient } from '../../../../utils/client';

Template.livechatCustomFieldForm.helpers({
	customField() {
		return Template.instance().customField.get();
	},

	customFieldsTemplate() {
		return getCustomFormTemplate('livechatCustomFieldsAdditionalForm');
	},

	dataContext() {
		// To make the dynamic template reactive we need to pass a ReactiveVar through the data property
		// because only the dynamic template data will be reloaded
		return Template.instance().localFields;
	},
});

Template.livechatCustomFieldForm.events({
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

		instance.$('.additional-field').each((i, el) => {
			const elField = instance.$(el);
			const name = elField.attr('name');
			let value = elField.val();
			if (['true', 'false'].includes(value) && el.tagName === 'SELECT') {
				value = value === 'true';
			}
			customFieldData[name] = value;
		});

		Meteor.call('livechat:saveCustomField', _id, customFieldData, function(error) {
			$btn.html(oldBtnValue);
			if (error) {
				return handleError(error);
			}

			toastr.success(t('Saved'));
			FlowRouter.go('livechat-customfields');
		});
	},

	'click button.back'(e/* , instance*/) {
		e.preventDefault();
		FlowRouter.go('livechat-customfields');
	},

	'change .custom-field-input'(e, instance) {
		const { target: { name, value } } = e;
		instance.localFields.set({ ...instance.localFields.get(), [name]: value });
	},
});

Template.livechatCustomFieldForm.onCreated(async function() {
	this.customField = new ReactiveVar({});
	this.localFields = new ReactiveVar({});

	const { customField } = await APIClient.v1.get(`livechat/custom-fields/${ FlowRouter.getParam('_id') }`);
	if (customField) {
		this.customField.set(customField);
		this.localFields.set({ ...customField });
	}
});
