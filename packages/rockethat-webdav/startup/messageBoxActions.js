/* globals fileUpload modal */

RocketChat.messageBox.actions.add('Add_files_from', 'WebDAV', {
	id: 'webdav-upload',
	icon: 'webdav',
	condition: () => RocketChat.settings.get('FileUpload_Enabled'),
	action() {
		const text = `<div class="upload-preview"><div class="upload-preview-file"</div></div>`;
		modal.open({
			title: t('Webdav_File_Picker'),
			text: '',
			showCancelButton: true,
			closeOnConfirm: true,
			closeOnCancel: true,
			html: true,
		}, function(isConfirm) {
			if (isConfirm !== true) {
				return;
			}
		});
	}
});


