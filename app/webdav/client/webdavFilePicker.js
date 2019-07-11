import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import _ from 'underscore';
import toastr from 'toastr';
import { Session } from 'meteor/session';
import { Handlebars } from 'meteor/ui';
import { ReactiveVar } from 'meteor/reactive-var';

import { modal, call } from '../../ui-utils';
import { t } from '../../utils';
import { fileUploadHandler } from '../../file-upload';

Template.webdavFilePicker.rendered = async function() {
	const { accountId } = this.data;
	Session.set('webdavCurrentFolder', '/');
	const response = await call('getWebdavFileList', accountId, '/');
	if (!response.success) {
		modal.close();
		return toastr.error(t(response.message));
	}
	Session.set('webdavNodes', response.data);
	this.isLoading.set(false);
};

Template.webdavFilePicker.destroyed = function() {
	Session.set('webdavNodes', []);
};

Template.webdavFilePicker.helpers({
	iconType() {
		// add icon for different types
		let icon = 'clip';
		let type = '';

		let extension = this.basename.split('.').pop();
		if (extension === this.basename) {
			extension = '';
		}

		if (this.type === 'directory') {
			icon = 'folder';
			type = 'directory';
		} else if (this.mime.match(/application\/pdf/)) {
			icon = 'file-pdf';
			type = 'ppt';
		} else if (['application/vnd.oasis.opendocument.text', 'application/vnd.oasis.opendocument.presentation'].includes(this.mime)) {
			icon = 'file-document';
			type = 'document';
		} else if (['application/vnd.ms-excel', 'application/vnd.oasis.opendocument.spreadsheet',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(this.mime)) {
			icon = 'file-sheets';
			type = 'sheets';
		} else if (['application/vnd.ms-powerpoint', 'application/vnd.oasis.opendocument.presentation'].includes(this.mime)) {
			icon = 'file-sheets';
			type = 'ppt';
		}
		return { icon, type, extension };
	},
	isLoading() {
		return Template.instance().isLoading.get();
	},
	webdavNodes() {
		return Session.get('webdavNodes');
	},
	webdavCurrentFolder() {
		return Session.get('webdavCurrentFolder');
	},
});

Template.webdavFilePicker.events({
	async 'click #webdav-go-back'() {
		const instance = Template.instance();
		const { accountId } = instance.data;
		instance.isLoading.set(true);
		let currentFolder = Session.get('webdavCurrentFolder');

		// determine parent directory to go back
		let parentFolder = '/';
		if (currentFolder && currentFolder !== '/') {
			if (currentFolder[currentFolder.length - 1] === '/') {
				currentFolder = currentFolder.slice(0, -1);
			}
			parentFolder = currentFolder.substr(0, currentFolder.lastIndexOf('/') + 1);
		}
		Session.set('webdavCurrentFolder', parentFolder);
		Session.set('webdavNodes', []);
		const response = await call('getWebdavFileList', accountId, parentFolder);
		instance.isLoading.set(false);
		if (!response.success) {
			return toastr.error(t(response.message));
		}
		Session.set('webdavNodes', response.data);
	},
	async 'click .webdav_directory'() {
		const instance = Template.instance();
		const { accountId } = instance.data;
		instance.isLoading.set(true);
		Session.set('webdavCurrentFolder', this.filename);
		Session.set('webdavNodes', []);
		const response = await call('getWebdavFileList', accountId, this.filename);
		instance.isLoading.set(false);
		if (!response.success) {
			modal.close();
			return toastr.error(t(response.message));
		}
		Session.set('webdavNodes', response.data);
	},
	async 'click .webdav_file'() {
		const roomId = Session.get('openedRoom');
		const instance = Template.instance();
		const { accountId } = instance.data;
		instance.isLoading.set(true);
		const file = this;
		const response = await call('getFileFromWebdav', accountId, file);
		instance.isLoading.set(false);
		if (!response.success) {
			modal.close();
			return toastr.error(t('Failed_to_get_webdav_file'));
		}
		const blob = new Blob([response.data], { type: response.type });
		// converting to file object
		blob.lastModified = file.lastmod;
		blob.name = file.basename;
		const text = `
			<div class='upload-preview-title'>
				<div class="rc-input__wrapper">
					<input class="rc-input__element" id='file-name' style='display: inherit;' value='${ Handlebars._escape(blob.name) }' placeholder='${ t('Upload_file_name') }'>
				</div>
				<div class="rc-input__wrapper">
					<input class="rc-input__element" id='file-description' style='display: inherit;' value='' placeholder='${ t('Upload_file_description') }'>
				</div>
			</div>`;
		return modal.open({
			title: t('Upload_file_question'),
			text,
			showCancelButton: true,
			closeOnConfirm: false,
			closeOnCancel: false,
			confirmButtonText: t('Send'),
			cancelButtonText: t('Cancel'),
			html: true,
			onRendered: () => $('#file-name').focus(),
		}, function(isConfirm) {
			const record = {
				name: document.getElementById('file-name').value || blob.name,
				size: blob.size,
				type: blob.type,
				rid: roomId,
				description: document.getElementById('file-description').value,
			};
			modal.close();

			if (!isConfirm) {
				return;
			}

			const upload = fileUploadHandler('Uploads', record, blob);

			let uploading = Session.get('uploading') || [];
			uploading.push({
				id: upload.id,
				name: upload.getFileName(),
				percentage: 0,
			});

			Session.set('uploading', uploading);

			upload.onProgress = function(progress) {
				uploading = Session.get('uploading');

				const item = _.findWhere(uploading, { id: upload.id });
				if (item != null) {
					item.percentage = Math.round(progress * 100) || 0;
					return Session.set('uploading', uploading);
				}
			};

			upload.start(function(error, file, storage) {
				if (error) {
					let uploading = Session.get('uploading');
					if (!Array.isArray(uploading)) {
						uploading = [];
					}

					const item = _.findWhere(uploading, { id: upload.id });

					if (_.isObject(item)) {
						item.error = error.message;
						item.percentage = 0;
					} else {
						uploading.push({
							error: error.error,
							percentage: 0,
						});
					}

					Session.set('uploading', uploading);
					return;
				}

				if (file) {
					Meteor.call('sendFileMessage', roomId, storage, file, () => {
						Meteor.setTimeout(() => {
							const uploading = Session.get('uploading');
							if (uploading !== null) {
								const item = _.findWhere(uploading, {
									id: upload.id,
								});
								return Session.set('uploading', _.without(uploading, item));
							}
						}, 2000);
					});
				}
			});
		});
	},
});

Template.webdavFilePicker.onCreated(function() {
	this.isLoading = new ReactiveVar(true);
});
