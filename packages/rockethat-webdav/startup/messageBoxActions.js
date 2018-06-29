/* globals fileUpload modal */

RocketChat.messageBox.actions.add('Add_files_from', 'WebDAV', {
	id: 'webdav-upload',
	icon: 'webdav',
	condition: () => RocketChat.settings.get('FileUpload_Enabled'),
	action() {
		modal.open({
			title: t('Webdav_File_Picker'),
			content: 'webdavFilePicker',
			showCancelButton: true,
			showConfirmButton: false,
			closeOnCancel: true,
			html: true,
		});
	}
});


