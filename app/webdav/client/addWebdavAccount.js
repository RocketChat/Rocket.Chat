import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { modal } from '../../ui-utils';
import { t } from '../../utils';
import _ from 'underscore';
import toastr from 'toastr';

Template.addWebdavAccount.helpers({
	btnAddNewServer() {
		if (Template.instance().loading.get()) {
			return `${ t('Please_wait') }...`;
		}
		return t('Webdav_add_new_account');
	},
});

Template.addWebdavAccount.events({
	'submit #add-webdav'(event, instance) {
		event.preventDefault();
		const formData = instance.validate();
		instance.loading.set(true);
		if (!formData) {
			return instance.loading.set(false);
		}
		Meteor.call('addWebdavAccount', formData, function(error, response) {
			if (error) {
				return toastr.error(t(error.error));
			}
			if (!response.success) {
				return toastr.error(t(response.message));
			}
			toastr.success(t(response.message));
			instance.loading.set(false);
			modal.close();
		});
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
