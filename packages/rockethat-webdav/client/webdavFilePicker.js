import _ from 'underscore';
import toastr from 'toastr';
import { Session } from 'meteor/session'

Template.webdavFilePicker.rendered = function () {
	Session.set('webdavCurrentFolder', "/");
	Meteor.call('getWebdavFileList', "/", function (error, result) {
		Session.set('webdavNodes', result);
	});
};
Template.webdavFilePicker.helpers({
	iconType() {
		//add icon for different types
		let icon = 'file-generic';
		let type = '';

		if (this.type == 'directory') {
			icon = 'icon-folder';
			type = 'icon-folder';
		}
		if (this.mime.match(/application\/pdf/)) {
			icon = 'file-pdf';
			type = 'pdf';
		}
		if (['application/vnd.oasis.opendocument.text', 'application/vnd.oasis.opendocument.presentation'].includes(this.mime)) {
			icon = 'file-document';
			type = 'document';
		}
		if (['application/vnd.ms-excel', 'application/vnd.oasis.opendocument.spreadsheet',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(this.mime)) {
			icon = 'file-sheets';
			type = 'sheets';
		}
		if (['application/vnd.ms-powerpoint', 'application/vnd.oasis.opendocument.presentation'].includes(this.mime)) {
			icon = 'file-sheets';
			type = 'ppt';
		}

		return {icon, type};
	},
	equals(a, b) {
		return a === b;
	},
	webdavNodes() {
		return Session.get('webdavNodes');
	},
	webdavCurrentFolder() {
		return Session.get('webdavCurrentFolder');
	},
});
Template.webdavFilePicker.events({
	'click #webdav-go-back'() {
		let currentFolder = Session.get('webdavCurrentFolder');

		//determine parent directory to go back
		let parentFolder = '/';
		if(currentFolder && currentFolder !== '/' ) {
			if(currentFolder[currentFolder.length-1] === '/') {
				currentFolder = currentFolder.slice(0, -1);
			}
			parentFolder = currentFolder.substr(0, currentFolder.lastIndexOf("/"));
		}
		Session.set('webdavCurrentFolder', parentFolder);
		Meteor.call('getWebdavFileList', parentFolder, function (error, response) {
			Session.set('webdavNodes', response);
		});
	},
	'click .webdav_directory'() {
		Session.set('webdavCurrentFolder', this.filename);
		Meteor.call('getWebdavFileList', this.filename, function (error, response) {
			Session.set('webdavNodes', response);
		});
	},
	'click .webdav_file'() {
		const roomId = Session.get('openedRoom');
		let file = this;
		Meteor.call('getFileFromWebdav', file, function (error, response) {
			if (error) {
				return toastr.error(t(error.error));
			}
			if (!response.success) {
				return toastr.error(t('Failed_to_get_webdav_file'));
			}
			const blob = new Blob([response.data], {type: response.type});
			// converting to file object
			blob.lastModified = file.lastmod;
			blob.name = file.basename;
			const text = `\
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
				onRendered: () => $('#file-name').focus()
			}, function(isConfirm) {
				const record = {
					name: document.getElementById('file-name').value || blob.name,
					size: blob.size,
					type: blob.type,
					rid: roomId,
					description: document.getElementById('file-description').value
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
					percentage: 0
				});

				Session.set('uploading', uploading);

				upload.onProgress = function(progress) {
					uploading = Session.get('uploading');

					const item = _.findWhere(uploading, {id: upload.id});
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
								percentage: 0
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
										id: upload.id
									});
									return Session.set('uploading', _.without(uploading, item));
								}
							}, 2000);
						});
					}
				});
			});

			Session.set('webdavCurrentFolder', '');
			Session.set('webdavNodes', '');
		});
	},
});
