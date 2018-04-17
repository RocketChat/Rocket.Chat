/* globals, fileUpload, swal, Livechat */
/* exported fileUpload */
import visitor from '../../imports/client/visitor';
import _ from 'underscore';
import s from 'underscore.string';
import request from 'request';

function sendFileRequest(file, roomId, visitorToken) {
	const url = `${ Meteor.absoluteUrl() }api/v1/livechat/upload/${ roomId }/${ visitorToken }`;
	const form = new FormData();
	form.append('file', file)
	
	const request = new XMLHttpRequest();
	request.open("POST", url);

	request.onload = function () {
		if (request.status !== 200) {						
			swal({
				title: request.statusText,
				text: request.responseText,
				type: 'error',
				showConfirmButton: true,
				closeOnConfirm: true,
				confirmButtonText: t('Close')
			});					
		}
	};
	
	request.onerror = function () {
		swal({
			title: request.statusText,
			text: request.responseText,
			type: 'error',
			showConfirmButton: true,
			closeOnConfirm: true,
			confirmButtonText: t('Close')
		});			
	};

	request.send(form);		  
}

function sendFileMessage(file, roomId) {
	if (!visitor.isSubscribed(roomId)) {	
		Meteor.call('livechat:startFileUploadRoom', roomId, visitor.getToken(), (error, result) => {
			if (error) {
				return showError(error.message);
			}

			visitor.subscribeToRoom(result.room._id);
			visitor.setRoom(result.room._id);
			sendFileRequest(file, roomId, visitor.getToken());
			parentCall('callback', 'chat-started');
		});
	} else {
		sendFileRequest(file, roomId, visitor.getToken());
	}
}

fileUpload = function(file) {
	Meteor.call('livechat:checkTypeFileUpload', file.type, (error, result) => {
		if (error) {
			return;
		}

		if (!result) {
			swal({
				title: t('FileUpload_MediaType_NotAccepted'),
				text: file.type || `*.${ s.strRightBack(file.name, '.') }`,
				type: 'error',
				timer: 3000
			});
		}	
		return;
	});
	
	if (file.size === 0) {
		swal({
			title: t('FileUpload_File_Empty'),
			type: 'error',
			timer: 1000,
			showConfirmButton: false
		});
	
		return;
	}
	
	let text = file.name;
	swal({
		title: t('Upload_file_question'),
		text,
		showCancelButton: true,
		cancelButtonText: t('Cancel'),
		confirmButtonText: t('Send'),
		closeOnCancel: true,
		closeOnConfirm: true
	}, (isConfirm) => {		
		if (isConfirm) {
			const roomId = visitor.getRoom(true);
			if (!visitor.getId()) {
				const guest = {
					token: visitor.getToken()
				};
	
				if (Livechat.department) {
					guest.department = Livechat.department;
				}

				Meteor.call('livechat:registerGuest', guest, (error, result) => {
					if (error) {
						return showError(error.reason);
					}
	
					visitor.setId(result.userId);
					sendFileMessage(file, roomId);
				});
			} else {
				sendFileMessage(file, roomId);
			}	
		}		
	});	
};
