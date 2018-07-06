/* globals fileUploadHandler, google, Handlebars */
import gapi from './lib/gapi.js';
import _ from 'underscore';

Meteor.startup(function() {
	RocketChat.messageBox.actions.add('Add_files_from', 'Google_drive', {
		id: 'google-drive',
		// icon to be added
		icon: 'google-drive',
		condition() {
			if (!RocketChat.settings.get('Accounts_OAuth_Google') || !RocketChat.settings.get('Accounts_OAuth_Google_Picker')) {
				return false;
			}
			return true;
		},
		action() {
			const roomId = Session.get('openedRoom');

			function pickerCallback(data) {
				let file = null;
				if (data[google.picker.Response.ACTION] === google.picker.Action.PICKED) {
					file = data[google.picker.Response.DOCUMENTS][0];
				}

				if (file && file.id) {
					Meteor.call('fetchFileFromDrive', file, function(error, response) {
						if (error) {
							return toastr.error(t(error.error));
						} else if (!response.success) {
							return toastr.error(t('Failed_to_fetch_file'));
						} else {
							const blob = new Blob([response.data], {type: file.mimeType || 'application/octet-stream'});
							// converting to file object
							blob.lastModified = file.lastEditedUtc;
							blob.lastModifiedDate = new Date(file.lastEditedUtc * 1000);
							blob.name = file.name || '';

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
						}
					});
				}
			}

			function createPicker() {
				const user = RocketChat.models.Users.findOne({_id: Meteor.userId()});
				const picker = new google.picker.PickerBuilder().
					addView(google.picker.ViewId.DOCS).
					setOAuthToken(user.services.google.accessToken).
					setDeveloperKey(RocketChat.settings.get('Accounts_OAuth_Google_Picker_key')).
					setCallback(pickerCallback).
					build();
				picker.setVisible(true);
			}

			function browse() {
				gapi.load('picker', createPicker);
			}

			Meteor.call('checkDriveAccess', (error) => {
				if (error && error.error !== 'error-unauthenticated-user') {
					return toastr.error(t(error.error));
				} else if (error) {
					Meteor.loginWithGoogle({
						requestPermissions: ['profile', 'https://www.googleapis.com/auth/drive']
					}, function(error) {
						if (error) {
							return;
						}
						browse();
					});
				} else {
					browse();
				}
			});
		}
	});

	RocketChat.messageBox.actions.add('Create_new', 'Google_doc', {
		id: 'google-doc',
		// icon to be added
		icon: 'google-doc',
		condition() {
			if (!RocketChat.settings.get('Accounts_OAuth_Google')) {
				return false;
			}
			return true;
		},
		action() {
			const roomId = Session.get('openedRoom');
			const type = 'docs';
			const name = 'RocketChat Google Doc';
			Meteor.call('checkDriveAccess', (error) => {
				if (error && error.error !== 'error-unauthenticated-user') {
					return toastr.error(t(error.error));
				} else if (error) {
					Meteor.loginWithGoogle({
						requestPermissions: ['profile', 'https://www.googleapis.com/auth/drive']
					}, function(error) {
						if (error) {
							return;
						}
						Meteor.call('createGoogleFile', {type, name}, roomId);
					});
				} else {
					Meteor.call('createGoogleFile', {type, name}, roomId);
				}
			});
		}
	});

	RocketChat.messageBox.actions.add('Create_new', 'Google_slide', {
		id: 'google-slide',
		// icon to be added
		icon: 'google-slide',
		condition() {
			if (!RocketChat.settings.get('Accounts_OAuth_Google')) {
				return false;
			}
			return true;
		},
		action() {
			const roomId = Session.get('openedRoom');
			const type = 'slides';
			const name = 'RocketChat Google Slide';
			Meteor.call('checkDriveAccess', (error) => {
				if (error && error.error !== 'error-unauthenticated-user') {
					return toastr.error(t(error.error));
				} else if (error) {
					Meteor.loginWithGoogle({
						requestPermissions: ['profile', 'https://www.googleapis.com/auth/drive']
					}, function(error) {
						if (error) {
							return;
						}
						Meteor.call('createGoogleFile', {type, name}, roomId);
					});
				} else {
					Meteor.call('createGoogleFile', {type, name}, roomId);
				}
			});
		}
	});

	RocketChat.messageBox.actions.add('Create_new', 'Google_sheet', {
		id: 'google-sheet',
		// icon to be added
		icon: 'google-sheet',
		condition() {
			if (!RocketChat.settings.get('Accounts_OAuth_Google')) {
				return false;
			}
			return true;
		},
		action() {
			const roomId = Session.get('openedRoom');
			const type = 'sheets';
			const name = 'RocketChat Google Sheet';
			Meteor.call('checkDriveAccess', (error) => {
				if (error && error.error !== 'error-unauthenticated-user') {
					return toastr.error(t(error.error));
				} else if (error) {
					Meteor.loginWithGoogle({
						requestPermissions: ['profile', 'https://www.googleapis.com/auth/drive']
					}, function(error) {
						if (error) {
							return;
						}
						Meteor.call('createGoogleFile', {type, name}, roomId);
					});
				} else {
					Meteor.call('createGoogleFile', {type, name}, roomId);
				}
			});
		}
	});
});
