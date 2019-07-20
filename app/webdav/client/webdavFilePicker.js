import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import _ from 'underscore';
import toastr from 'toastr';
import { Session } from 'meteor/session';
import { Handlebars } from 'meteor/ui';
import { ReactiveVar } from 'meteor/reactive-var';

import { timeAgo } from '../../ui/client/views/app/helpers';
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

function sortTable(data, sortBy, sortDirection) {
	if (sortDirection === 'desc') {
		if (sortBy === 'name') { data.sort((a, b) => b.basename.localeCompare(a.basename)); }
		if (sortBy === 'size') { data.sort((a, b) => b.size - a.size); }
		if (sortBy === 'date') { data.sort((a, b) => new Date(b.lastmod) - new Date(a.lastmod)); }
	} else {
		if (sortBy === 'name') { data.sort((a, b) => a.basename.localeCompare(b.basename)); }
		if (sortBy === 'size') { data.sort((a, b) => a.size - b.size); }
		if (sortBy === 'date') { data.sort((a, b) => new Date(a.lastmod) - new Date(b.lastmod)); }
	}
	return data;
}

async function showWebdavFileList(directory) {
	const instance = Template.instance();
	const { sortDirection, sortBy } = instance;
	const { accountId } = instance.data;
	instance.isLoading.set(true);
	Session.set('webdavCurrentFolder', directory);
	Session.set('webdavNodes', []);
	const response = await call('getWebdavFileList', accountId, directory);
	instance.isLoading.set(false);
	if (!response.success) {
		modal.close();
		return toastr.error(t(response.message));
	}
	const data = sortTable(response.data, sortBy.get(), sortDirection.get());
	Session.set('webdavNodes', data);
}

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
			type = 'pdf';
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
	listMode() {
		return Template.instance().isListMode.get();
	},
	sortBy(key) {
		return Template.instance().sortBy.get() === key;
	},
	getSortBy() {
		return Template.instance().sortBy.get();
	},
	getSize() {
		if (this.type === 'directory') { return ''; }
		const bytes = this.size;
		if (bytes === 0) { return '0 B'; }
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${ parseFloat((bytes / Math.pow(k, i)).toFixed(2)) } ${ sizes[i] }`;
	},
	getDate() {
		return timeAgo(new Date(this.lastmod), t);
	},
	sortIcon(key) {
		const { sortDirection, sortBy } = Template.instance();
		return key === sortBy.get() && sortDirection.get() === 'asc'
			? 'sort-up'
			: 'sort-down';
	},
	onTableSort() {
		const { sortDirection, sortBy } = Template.instance();
		return function(type) {
			if (sortBy.get() === type) {
				sortDirection.set(sortDirection.get() === 'asc' ? 'desc' : 'asc');
			} else {
				sortBy.set(type);
				sortDirection.set('asc');
			}
			const data = sortTable(Session.get('webdavNodes'), sortBy.get(), sortDirection.get());
			Session.set('webdavNodes', data);
		};
	},
	parentFolders() {
		const currentFolder = Session.get('webdavCurrentFolder');
		return currentFolder ? currentFolder.split('/').filter((s) => s) : [];
	},
	webdavNodes() {
		return Session.get('webdavNodes');
	},
	webdavCurrentFolder() {
		return Session.get('webdavCurrentFolder');
	},
});

Template.webdavFilePicker.events({
	'click .listOrGridMode'() {
		const instance = Template.instance();
		instance.isListMode.set(!instance.isListMode.get());
	},
	'click .webdav-sort-direction'() {
		const { sortDirection, sortBy } = Template.instance();
		sortDirection.set(sortDirection.get() === 'asc' ? 'desc' : 'asc');
		const data = sortTable(Session.get('webdavNodes'), sortBy.get(), sortDirection.get());
		Session.set('webdavNodes', data);
	},
	'change #webdav-select-sort'() {
		const { sortDirection, sortBy } = Template.instance();
		const newSortBy = $('#webdav-select-sort').val();
		sortBy.set(newSortBy);
		const data = sortTable(Session.get('webdavNodes'), sortBy.get(), sortDirection.get());
		Session.set('webdavNodes', data);
	},
	async 'click #webdav-go-back'() {
		let currentFolder = Session.get('webdavCurrentFolder');
		// determine parent directory to go back
		let parentFolder = '/';
		if (currentFolder && currentFolder !== '/') {
			if (currentFolder[currentFolder.length - 1] === '/') {
				currentFolder = currentFolder.slice(0, -1);
			}
			parentFolder = currentFolder.substr(0, currentFolder.lastIndexOf('/') + 1);
		}
		showWebdavFileList(parentFolder);
	},
	async 'click .webdav_directory'() {
		showWebdavFileList(this.filename);
	},
	async 'click .webdav-breadcrumb-folder'(event) {
		const index = $(event.target).data('index');
		const currentFolder = Session.get('webdavCurrentFolder');
		const parentFolders = currentFolder.split('/').filter((s) => s);
		// determine parent directory to go to
		let targetFolder = '/';
		for (let i = 0; i <= index; i++) {
			targetFolder += parentFolders[i];
			targetFolder += '/';
		}
		showWebdavFileList(targetFolder);
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
	this.isListMode = new ReactiveVar(true);
	this.sortBy = new ReactiveVar('name');
	this.sortDirection = new ReactiveVar('asc');
});
