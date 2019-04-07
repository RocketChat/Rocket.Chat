import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import toastr from 'toastr';
import { modal } from '../../ui-utils';
import { t } from '../../utils';
import { WebdavAccounts } from '../../models';

Template.selectWebdavAccount.helpers({
	webdavAccounts() {
		return WebdavAccounts.find().fetch();
	},
	usernamePlusServer(account) {
		return account.name || `${ account.username }@${ account.server_url.replace(/^https?\:\/\//i, '') }`;
	},
});
Template.selectWebdavAccount.events({
	'click .webdav-account'() {
		modal.close();
		const accountId = this._id;
		const { url } = Template.instance().data;
		const name = Template.instance().data.attachment.title;

		const fileRequest = new XMLHttpRequest();
		fileRequest.open('GET', url, true);
		fileRequest.responseType = 'arraybuffer';
		fileRequest.onload = function() {
			const arrayBuffer = fileRequest.response;
			if (arrayBuffer) {
				const fileData = new Uint8Array(arrayBuffer);
				Meteor.call('uploadFileToWebdav', accountId, fileData, name, (error, response) => {
					if (error) {
						return toastr.error(t(error.error));
					}
					if (!response.success) {
						return toastr.error(t(response.message));
					}
					return toastr.success(t('File_uploaded'));
				});
			}
		};
		fileRequest.send(null);
	},
});
