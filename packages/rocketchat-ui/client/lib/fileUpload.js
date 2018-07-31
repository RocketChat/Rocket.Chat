/* globals fileUploadHandler, Handlebars, fileUpload, modal */
/* exported fileUpload */

import cp from 'crypto-js';
import _ from 'underscore';
import s from 'underscore.string';
import buffer from 'buffer';
import { Meteor } from 'meteor/meteor';

function base64ArrayBuffer(arrayBuffer) {
	let base64 = '';
	const encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

	const bytes = new Uint8Array(arrayBuffer);
	const byteLength = bytes.byteLength;
	const byteRemainder = byteLength % 3;
	const mainLength = byteLength - byteRemainder;

	let a;
	let b;
	let c;
	let d;
	let chunk;

	// Main loop deals with bytes in chunks of 3
	for (let i = 0; i < mainLength; i += 3) {
		// Combine the three bytes into a single integer
		chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
		// Use bitmasks to extract 6-bit segments from the triplet
		a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
		b = (chunk & 258048) >> 12; // 258048   = (2^6 - 1) << 12
		c = (chunk & 4032) >> 6; // 4032     = (2^6 - 1) << 6
		d = chunk & 63; // 63       = 2^6 - 1
		// Convert the raw binary segments to the appropriate ASCII encoding
		base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
	}

	// Deal with the remaining bytes and padding
	if (byteRemainder === 1) {
		chunk = bytes[mainLength];

		a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2

		// Set the 4 least significant bits to zero
		b = (chunk & 3) << 4; // 3   = 2^2 - 1

		base64 += `${ encodings[a] }${ encodings[b] }==`;
	} else if (byteRemainder === 2) {
		chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];

		a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
		b = (chunk & 1008) >> 4; // 1008  = (2^6 - 1) << 4

		// Set the 2 least significant bits to zero
		c = (chunk & 15) << 2; // 15    = 2^4 - 1

		base64 += `${ encodings[a] }${ encodings[b] }${ encodings[c] }=`;
	}

	return base64;
}

function storetoIPFS(file) {
	const IPFSreader = new FileReader();
	IPFSreader.onload = function() {
		const fileName = file.name;
		const fileType = file.type;
		const prefix = `data:${ fileType };base64,`;
		const buf = new buffer.Buffer(IPFSreader.result);

		const base64buf = prefix + base64ArrayBuffer(buf);

		console.log(Meteor.userId());
		console.log(base64buf);
		const encFile = cp.AES.encrypt(base64buf, Meteor.userId());
		console.log(encFile.toString());
		Meteor.call('ipfsaddFile', encFile.toString(), fileName);
	};
	IPFSreader.readAsArrayBuffer(file);
}

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
		<input type= 'password' class="rc-input__element" id='file-description' style='display: inherit;' value='' placeholder='${ t('Upload_file_description') }'>
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
	<div class="rc-input__wrapper">
		 <input type= 'password' class="rc-input__element" id='IPFSSeed' style='display: inherit;' value='' placeholder='${ t('Password') }'>
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
	<div class="rc-input__wrapper">
		 <input type= 'password' class="rc-input__element" id='IPFSSeed' style='display: inherit;' value='' placeholder='${ t('Password') }'>
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
				html: true,
				onRendered: () => $('#file-name').focus()
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
					storetoIPFS(upload.file);
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
