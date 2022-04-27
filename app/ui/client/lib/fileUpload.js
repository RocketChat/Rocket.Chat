import { Tracker } from 'meteor/tracker';
import { Session } from 'meteor/session';
import { Random } from 'meteor/random';
import { Meteor } from 'meteor/meteor';

import { settings } from '../../../settings/client';
import { UserAction, USER_ACTIVITIES } from '../index';
import { fileUploadIsValidContentType, APIClient } from '../../../utils';
import { imperativeModal } from '../../../../client/lib/imperativeModal';
import FileUploadModal from '../../../../client/views/room/modals/FileUploadModal';
import { prependReplies } from '../../../../client/lib/utils/prependReplies';
import { chatMessages } from '../views/app/room';

export const uploadFileWithMessage = async (rid, tmid, { description, fileName, msg, file }) => {
	const data = new FormData();
	description && data.append('description', description);
	msg && data.append('msg', msg);
	tmid && data.append('tmid', tmid);
	data.append('file', file.file, fileName);

	const uploads = Session.get('uploading') || [];

	const upload = {
		id: Random.id(),
		name: fileName,
		percentage: 0,
	};

	uploads.push(upload);
	Session.set('uploading', uploads);

	const { xhr, promise } = APIClient.upload(`v1/rooms.upload/${rid}`, {}, data, {
		progress(progress) {
			const uploads = Session.get('uploading') || [];

			if (progress === 100) {
				return;
			}
			uploads
				.filter((u) => u.id === upload.id)
				.forEach((u) => {
					u.percentage = Math.round(progress) || 0;
				});
			Session.set('uploading', uploads);
		},
		error(error) {
			const uploads = Session.get('uploading') || [];
			uploads
				.filter((u) => u.id === upload.id)
				.forEach((u) => {
					u.error = error.message;
					u.percentage = 0;
				});
			Session.set('uploading', uploads);
		},
	});
	if (Session.get('uploading').length) {
		UserAction.performContinuously(rid, USER_ACTIVITIES.USER_UPLOADING, { tmid });
	}

	Tracker.autorun((computation) => {
		const isCanceling = Session.get(`uploading-cancel-${upload.id}`);
		if (!isCanceling) {
			return;
		}
		computation.stop();
		Session.delete(`uploading-cancel-${upload.id}`);

		xhr.abort();

		const uploads = Session.get('uploading') || {};
		Session.set(
			'uploading',
			uploads.filter((u) => u.id !== upload.id),
		);
	});

	try {
		await promise;
		const uploads = Session.get('uploading') || [];
		const remainingUploads = Session.set(
			'uploading',
			uploads.filter((u) => u.id !== upload.id),
		);

		if (!Session.get('uploading').length) {
			UserAction.stop(rid, USER_ACTIVITIES.USER_UPLOADING, { tmid });
		}
		return remainingUploads;
	} catch (error) {
		const uploads = Session.get('uploading') || [];
		uploads
			.filter((u) => u.id === upload.id)
			.forEach((u) => {
				u.error = (error.xhr && error.xhr.responseJSON && error.xhr.responseJSON.error) || error.message;
				u.percentage = 0;
			});
		if (!uploads.length) {
			UserAction.stop(rid, USER_ACTIVITIES.USER_UPLOADING, { tmid });
		}
		Session.set('uploading', uploads);
	}
};

export const fileUpload = async (files, input, { rid, tmid }) => {
	const threadsEnabled = settings.get('Threads_enabled');

	files = [].concat(files);

	const replies = $(input).data('reply') || [];
	const mention = $(input).data('mention-user') || false;

	let msg = '';

	if (!mention || !threadsEnabled) {
		msg = await prependReplies('', replies, mention);
	}

	if (mention && threadsEnabled && replies.length) {
		tmid = replies[0]._id;
	}

	const key = ['messagebox', rid, tmid].filter(Boolean).join('_');
	const messageBoxText = Meteor._localStorage.getItem(key) || '';

	const uploadNextFile = () => {
		const file = files.pop();
		if (!file) {
			return;
		}

		imperativeModal.open({
			component: FileUploadModal,
			props: {
				file: file.file,
				fileName: file.name,
				fileDescription: messageBoxText,
				onClose: () => {
					imperativeModal.close();
					uploadNextFile();
				},
				onSubmit: (fileName, description) => {
					uploadFileWithMessage(rid, tmid, {
						description,
						fileName,
						msg: msg || undefined,
						file,
					});
					const localStorageKey = ['messagebox', rid, tmid].filter(Boolean).join('_');
					const chatMessageKey = [rid, tmid].filter(Boolean).join('-');
					const { input } = chatMessages[chatMessageKey];
					input.value = null;
					$(input).trigger('input');
					Meteor._localStorage.removeItem(localStorageKey);
					imperativeModal.close();
					uploadNextFile();
				},
				invalidContentType: file.file.type && !fileUploadIsValidContentType(file.file.type),
			},
		});
	};

	uploadNextFile();
};
