import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import _ from 'underscore';
import toastr from 'toastr';

import { modal, call } from '../../ui-utils';
import { t } from '../../utils';

Template.addWebdavAccount.helpers({
	btnAddNewServer() {
		if (Template.instance().loading.get()) {
			return `${ t('Please_wait') }...`;
		}
		return t('Webdav_add_new_account');
	},
});

Template.addWebdavAccount.events({
	async 'submit #add-webdav'(event, instance) {
		event.preventDefault();
		const formData = instance.validate();
		if (!formData) {
			return;
		}
		instance.loading.set(true);
		try {
			const response = await call('addWebdavAccount', formData).catch((error) => { console.log(error); });
			if (response) { toastr.success(t('webdav-account-saved')); }
		} finally {
			instance.loading.set(false);
			modal.close();
		}
	},
});

const validate = function() {
	const form = $(this.firstNode);
	const formData = form.serializeArray();
	const validationObj = {};

	const formObj = formData.reduce((ret, { value, name }) => {
		ret[name] = value;
		return ret;
	}, {});

	if (!formObj.serverURL) {
		validationObj.serverURL = t('Field_required');
	}
	if (!formObj.username) {
		validationObj.username = t('Field_required');
	}
	if (!formObj.pass) {
		validationObj.pass = t('Field_required');
	}

	form.find('input.error, select.error').removeClass('error');
	form.find('.input-error').text('');
	if (_.isEmpty(validationObj)) {
		return formObj;
	}
	Object.entries(validationObj).forEach(([key, value]) => {
		form.find(`input[name=${ key }], select[name=${ key }]`).addClass('error');
		form.find(`input[name=${ key }]~.input-error, select[name=${ key }]~.input-error`).text(value);
	});
	this.loading.set(false);
	return false;
};

Template.addWebdavAccount.onCreated(function() {
	this.loading = new ReactiveVar(false);
	this.validate = validate.bind(this);
});
