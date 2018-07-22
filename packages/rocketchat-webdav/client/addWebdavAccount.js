import _ from "underscore";
import toastr from "toastr";

Template.addWebdavAccount.helpers({
	btnAddNewServer() {
		if (Template.instance().loading.get()) {
			return `${ t('Please_wait') }...`;
		}
		return t('Add_new_webdav_account');
	},
});

Template.addWebdavAccount.events({
	'submit #add-webdav'(event, instance) {
		event.preventDefault();
		const formData = instance.validate();
		instance.loading.set(true);
		if(formData) {
			Meteor.call('addNewWebdavAccount', formData, function (error, response) {
				if (error) {
					return toastr.error(t(error.error));
				}
				if (!response.success) {
					return toastr.error(t(response.message));
				}
				toastr.success(t(response.message));
				modal.close();
			});
		}
		instance.loading.set(false);
	}
});

Template.addWebdavAccount.onCreated(function() {
	const instance = this;
	this.loading = new ReactiveVar(false);
	this.validate = function() {
		const formData = $('#add-webdav').serializeArray();
		const formObj = {};
		const validationObj = {};
		formData.forEach((field) => {
			formObj[field.name] = field.value;
		});
		if(!formObj['serverURL']) {
			validationObj['serverURL'] = t('Field_required');
		}
		if(!formObj['username']) {
			validationObj['username'] = t('Field_required');
		}
		if(!formObj['pass']) {
			validationObj['pass'] = t('Field_required');
		}

		if (!_.isEmpty(validationObj)) {
			Object.keys(validationObj).forEach((key) => {
				const value = validationObj[key];
				$(`#add-webdav input[name=${ key }], #add-webdav  select[name=${ key }]`).addClass('error');
				$(`#add-webdav  input[name=${ key }]~.input-error, #add-webdav  select[name=${ key }]~.input-error`).text(value);
			});
			instance.loading.set(false);
			return false;
		}
		return formObj;
	}

});
