import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import { modal } from '../../ui-utils';
import { t } from '../../utils';
import { WebdavAccounts } from '../../models/client';
import { dispatchToastMessage } from '../../../client/lib/toast';

Template.selectWebdavAccount.helpers({
	webdavAccounts() {
		return WebdavAccounts.find().fetch();
	},
	usernamePlusServer(account) {
		return account.name || `${account.username}@${account.server_url.replace(/^https?\:\/\//i, '')}`;
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
		fileRequest.onload = function () {
			const arrayBuffer = fileRequest.response;
			if (arrayBuffer) {
				const fileData = new Uint8Array(arrayBuffer);
				Meteor.call('uploadFileToWebdav', accountId, fileData, name, (error, response) => {
					if (error) {
						return dispatchToastMessage({ type: 'error', message: t(error.error) });
					}
					if (!response.success) {
						return dispatchToastMessage({ type: 'error', message: t(response.message) });
					}
					return dispatchToastMessage({ type: 'success', message: t('File_uploaded') });
				});
			}
		};
		fileRequest.send(null);
	},
});
