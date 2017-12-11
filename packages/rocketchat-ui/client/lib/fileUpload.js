/* globals fileUploadHandler, Handlebars, fileUpload, modal */
/* exported fileUpload */
import _ from 'underscore';
import s from 'underscore.string';

function readAsDataURL(file, callback) {
	const reader = new FileReader();
	reader.onload = ev => callback(ev.target.result, file);

	return reader.readAsDataURL(file);
}

function getUploadPreview(file, callback) {
	// If greater then 10MB don't try and show a preview
	if (file.file.size > (10 * 1000000)) {
		return callback(file, null);
	} else if (file.file.type == null) {
		callback(file, null);
	} else if ((file.file.type.indexOf('audio') > -1) || (file.file.type.indexOf('video') > -1) || (file.file.type.indexOf('image') > -1)) {
		file.type = file.file.type.split('/')[0];

		return readAsDataURL(file.file, content => callback(file, content));
	} else {
		return callback(file, null);
	}
}

function formatBytes(bytes, decimals) {
	if (bytes === 0) {
		return '0 Bytes';
	}

	const k = 1000;
	const dm = (decimals + 1) || 3;

	const sizes = [
		'Bytes',
		'KB',
		'MB',
		'GB',
		'TB',
		'PB'
	];

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${ parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) } ${ sizes[i] }`;
}

fileUpload = function(filesToUpload) {
	const roomId = Session.get('openedRoom');
	const files = [].concat(filesToUpload);

	function consume() {
		const file = files.pop();
		if ((file == null)) {
			modal.close();
			return;
		}

		if (!RocketChat.fileUploadIsValidContentType(file.file.type)) {
			modal.open({
				title: t('FileUpload_MediaType_NotAccepted'),
				text: file.file.type || `*.${ s.strRightBack(file.file.name, '.') }`,
				type: 'error',
				timer: 3000
			});
			return;
		}

		if (file.file.size === 0) {
			modal.open({
				title: t('FileUpload_File_Empty'),
				type: 'error',
				timer: 1000
			});
			return;
		}

		return getUploadPreview(file, function(file, preview) {
			let text = '';

			if (file.type === 'audio') {
				text = `\
<div class='upload-preview'>
	<audio  style="width: 100%;" controls="controls">
		<source src="${ preview }" type="audio/wav">
		Your browser does not support the audio element.
	</audio>
</div>
<div class='upload-preview-title'>
	<div class="rc-input__wrapper">
		<input class="rc-input__element" id='file-name' style='display: inherit;' value='${ Handlebars._escape(file.name) }' placeholder='${ t('Upload_file_name') }'>
	</div>
	<div class="rc-input__wrapper">
		<input class="rc-input__element" id='file-description' style='display: inherit;' value='' placeholder='${ t('Upload_file_description') }'>
	</div>
</div>`;
			} else if (file.type === 'video') {
				text = `\
<div class='upload-preview'>
	<video  style="width: 100%;" controls="controls">
		<source src="${ preview }" type="video/webm">
		Your browser does not support the video element.
	</video>
</div>
<div class='upload-preview-title'>
	<div class="rc-input__wrapper">
		<input class="rc-input__element" id='file-name' style='display: inherit;' value='${ Handlebars._escape(file.name) }' placeholder='${ t('Upload_file_name') }'>
	</div>
	<div class="rc-input__wrapper">
		<input class="rc-input__element" id='file-description' style='display: inherit;' value='' placeholder='${ t('Upload_file_description') }'>
	</div>
</div>`;
			} else if (file.type === 'image') {
				text = `\
<div class='upload-preview'>
	<div class='upload-preview-file' style='background-image: url(${ preview })'></div>
</div>
<div class='upload-preview-title'>
	<div class="rc-input__wrapper">
		<input class="rc-input__element" id='file-name' style='display: inherit;' value='${ Handlebars._escape(file.name) }' placeholder='${ t('Upload_file_name') }'>
	</div>
	<div class="rc-input__wrapper">
		<input class="rc-input__element" id='file-description' style='display: inherit;' value='' placeholder='${ t('Upload_file_description') }'>
	</div>
</div>`;
			} else {
				const fileSize = formatBytes(file.file.size);

				text = `\
<div class='upload-preview'>
	<div>${ Handlebars._escape(file.name) } - ${ fileSize }</div>
</div>
<div class='upload-preview-title'>
	<div class="rc-input__wrapper">
		<input class="rc-input__element" id='file-name' style='display: inherit;' value='${ Handlebars._escape(file.name) }' placeholder='${ t('Upload_file_name') }'>
	</div>
	<div class="rc-input__wrapper">
		<input class="rc-input__element" id='file-description' style='display: inherit;' value='' placeholder='${ t('Upload_file_description') }'>
	</div>
</div>`;
			}

			return modal.open({
				title: t('Upload_file_question'),
				text,
				showCancelButton: true,
				closeOnConfirm: false,
				closeOnCancel: false,
				confirmButtonText: t('Send'),
				cancelButtonText: t('Cancel'),
				html: true
			}, function(isConfirm) {

				const record = {
					name: document.getElementById('file-name').value || file.name || file.file.name,
					size: file.file.size,
					type: file.file.type,
					rid: roomId,
					description: document.getElementById('file-description').value
				};

				consume();
				if (!isConfirm) {
					return;
				}
				const upload = fileUploadHandler('Uploads', record, file.file);

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

				Tracker.autorun(function(c) {
					const cancel = Session.get(`uploading-cancel-${ upload.id }`);
					if (cancel) {
						let item;
						upload.stop();
						c.stop();

						uploading = Session.get('uploading');
						if (uploading != null) {
							item = _.findWhere(uploading, {id: upload.id});
							if (item != null) {
								item.percentage = 0;
							}
							Session.set('uploading', uploading);
						}

						return Meteor.setTimeout(function() {
							uploading = Session.get('uploading');
							if (uploading != null) {
								item = _.findWhere(uploading, {id: upload.id});
								return Session.set('uploading', _.without(uploading, item));
							}
						}, 1000);
					}
				});
			});
		});
	}

	consume();
};
