/* global WebdavAccounts */

import toastr from 'toastr';
Meteor.subscribe('webdavAccounts');

Template.accountIntegrations.helpers({
	webdavAccounts() {
		return WebdavAccounts.find().fetch();
	},
	getOptionValue(account) {
		return `${ account.username }@${ account.server_url.replace(/^https?\:\/\//i, '') }`;
	}
});

Template.accountIntegrations.events({
	'click .webdav-account-remove'(e) {
		e.preventDefault();
		const selectEl = document.getElementById('webdav-accounts');
		const options = selectEl.options;
		const selectedOption = selectEl.value;
		const optionIndex = Array.from(options).findIndex(option => option.value === selectedOption);

		Meteor.call('removeWebdavAccount', selectedOption, function(error) {
			if (error) {
				return toastr.error(t(error.error));
			}

			toastr.success(t('webdav-account-removed'));
			modal.close();
		});

		selectEl.remove(optionIndex);
	}
});
