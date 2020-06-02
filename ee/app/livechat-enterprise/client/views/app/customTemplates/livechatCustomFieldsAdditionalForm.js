import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import toastr from 'toastr';

import './livechatCustomFieldsAdditionalForm.html';
import { t } from '../../../../../../../app/utils/client';

Template.livechatCustomFieldsAdditionalForm.helpers({
	customField() {
		return Template.instance().customField.get();
	},
});

Template.livechatCustomFieldsAdditionalForm.onCreated(function() {
	this.customField = new ReactiveVar({});

	this.autorun(() => {
		// To make this template reactive we expect a ReactiveVar through the data property,
		// because the parent form may not be rerender, only the dynamic template data
		this.customField.set({ ...this.data.get() });
	});
});

Template.livechatCustomFieldsAdditionalForm.events({
	'change .additional-field'(e, instance) {
		const { target: { name, value } } = e;
		instance.customField.set({ ...instance.customField.get(), [name]: value });
	},

	'blur [name="options"]'(e) {
		const { currentTarget: { value } } = e;
		if (value.trim() !== '' && !/^([a-zA-Z0-9-_ ]+)(,\s*[a-zA-Z0-9-_ ]+)*$/i.test(value)) {
			toastr.error(t('error-invalid-value'));
			e.currentTarget.focus();
		}
	},
});
