/* globals fileUpload, Livechat, Handlebars, showError, sendFileUpload */
/* exported LivechatFileUpload, fileUpload, sendFileUpload */
import { Meteor } from 'meteor/meteor';
import swal from 'sweetalert2';

import visitor from '../../imports/client/visitor';

const handleRequestError = (response) => {
	if (!response.success) {
		let reason = t('FileUpload_Error');
		switch (response.reason) {
			case 'error-type-not-allowed':
				reason = t('FileUpload_MediaType_NotAccepted');
				break;
			case 'error-size-not-allowed':
				reason = t('File_exceeds_allowed_size_of_bytes', { size: response.sizeAllowed });
		}

		swal({
			text: reason,
			type: 'error',
			timer: 4000,
		});
	}
};

function sendFileRequest(file, roomId, token) {
	const url = `${ Meteor.absoluteUrl() }api/v1/livechat/upload/${ roomId }`;
	const form = new FormData();
	form.append('file', file);

	const request = new XMLHttpRequest();
	request.open('POST', url);
	request.responseType = 'json';
	request.setRequestHeader('X-Visitor-Token', token);

	request.onload = () => {
		if (request.status !== 200) {
			handleRequestError(request.response);
		}
	};

	request.onerror = () => {
		handleRequestError(request.response);
	};

	request.send(form);
}

function readAsDataURL(file, callback) {
	const reader = new FileReader();
	reader.onload = (ev) => callback(ev.target.result, file);

	return reader.readAsDataURL(file);
}

function getUploadPreview(file, callback) {
	// If greater then 10MB don't try and show a preview
	if (file.file.size > (10 * 1000000)) {
		return callback(file, null);
	} if (file.file.type == null) {
		callback(file, null);
	} else if ((file.file.type.indexOf('audio') > -1) || (file.file.type.indexOf('video') > -1) || (file.file.type.indexOf('image') > -1)) {
		file.type = file.file.type.split('/')[0];
		return readAsDataURL(file.file, (content) => callback(file, content));
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
		'PB',
	];

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${ parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) } ${ sizes[i] }`;
}

function sendFileMessage(file, roomId) {
	if (visitor.isSubscribed(roomId)) {
		return sendFileRequest(file, roomId, visitor.getToken());
	}

	Meteor.call('livechat:startFileUploadRoom', roomId, visitor.getToken(), (error, result) => {
		if (error) {
			return showError(error.message);
		}

		Livechat.room = result.room._id;
		visitor.subscribeToRoom(result.room._id);
		visitor.setRoom(result.room._id);
		sendFileRequest(file, roomId, visitor.getToken());
		parentCall('callback', 'chat-started');
	});
}

sendFileUpload = (file) => getUploadPreview(file, function(file, preview) {
	let html = '';
	if (file.type === 'audio') {
		html = `<div class='upload-preview'><audio  style="width: 100%;" controls="controls"><source src="${ preview }" type="audio/wav">Your browser does not support the audio element.</audio></div>`;
	} else if (file.type === 'video') {
		html = `<div class='upload-preview'><video  style="width: 100%;" controls="controls"><source src="${ preview }" type="video/webm">Your browser does not support the video element.</video></div>`;
	} else if (file.type === 'image') {
		html = `<div class='upload-preview'><div class='upload-preview-file' style='background-image: url(${ preview })'></div></div>`;
	} else {
		const fileSize = formatBytes(file.file.size);
		html = `<div class='upload-preview'><div>${ Handlebars._escape(file.name) } - ${ fileSize }</div></div>`;
	}

	swal({
		title: t('Upload_file_question'),
		html,
		showCancelButton: true,
		cancelButtonText: t('No'),
		confirmButtonText: t('Yes'),
	}).then((result) => {
		if (!result.value) {
			return;
		}

		const roomId = visitor.getRoom(true);

		if (visitor.getId()) {
			return sendFileMessage(file.file, roomId);
		}

		const guest = {
			token: visitor.getToken(),
		};

		if (Livechat.department) {
			guest.department = Livechat.department;
		}

		Meteor.call('livechat:registerGuest', guest, (error, result) => {
			if (error) {
				return showError(error.reason);
			}

			visitor.setId(result.userId);
			sendFileMessage(file.file, roomId);
		});
	});
});

fileUpload = (file) => {
	if (file.size === 0) {
		swal({
			title: t('FileUpload_File_Empty'),
			text: '',
			type: 'error',
			timer: 1000,
			showConfirmButton: false,
		});

		return;
	}

	return sendFileUpload(file);
};
