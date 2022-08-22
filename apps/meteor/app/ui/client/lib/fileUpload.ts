import { Tracker } from 'meteor/tracker';
import { Session } from 'meteor/session';
import { Random } from 'meteor/random';
import { Meteor } from 'meteor/meteor';

import { settings } from '../../../settings/client';
import { UserAction, USER_ACTIVITIES } from '../index';
import { fileUploadIsValidContentType, APIClient } from '../../../utils/client';
import { imperativeModal } from '../../../../client/lib/imperativeModal';
import FileUploadModal from '../../../../client/views/room/modals/FileUploadModal';
import { prependReplies } from '../../../../client/lib/utils/prependReplies';
import { chatMessages } from '../views/app/room';
import { getErrorMessage } from '../../../../client/lib/errorHandling';

type Uploading = {
	id: string;
	name: string;
	percentage: number;
	error?: Error;
};

declare module 'meteor/session' {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Session {
		function get(key: 'uploading'): Uploading[];
		function set(key: 'uploading', param: Uploading[]): void;
	}
}

Session.setDefault('uploading', []);

export const uploadFileWithMessage = async (
	rid: string,
	{
		description,
		msg,
		file,
	}: {
		file: File;
		description?: string;
		msg?: string;
	},
	tmid?: string,
): Promise<void> => {
	const uploads = Session.get('uploading');

	const upload = {
		id: Random.id(),
		name: file.name,
		percentage: 0,
	};

	uploads.push(upload);
	Session.set('uploading', uploads);

	try {
		await new Promise((resolve, reject) => {
			const xhr = APIClient.upload(
				`/v1/rooms.upload/${rid}`,
				{
					msg,
					tmid,
					file,
					description,
				},
				{
					load: (event) => {
						return resolve(event);
					},
					progress: (event) => {
						if (!event.lengthComputable) {
							return;
						}
						const progress = (event.loaded / event.total) * 100;
						if (progress === 100) {
							return;
						}

						const uploads = Session.get('uploading');

						uploads
							.filter((u) => u.id === upload.id)
							.forEach((u) => {
								u.percentage = Math.round(progress) || 0;
							});
						Session.set('uploading', uploads);
					},
					error: (error) => {
						const uploads = Session.get('uploading');
						uploads
							.filter((u) => u.id === upload.id)
							.forEach((u) => {
								u.error = new Error(xhr.responseText);
								u.percentage = 0;
							});
						Session.set('uploading', uploads);
						reject(error);
					},
				},
			);

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

				const uploads = Session.get('uploading');
				Session.set(
					'uploading',
					uploads.filter((u) => u.id !== upload.id),
				);
			});
		});

		const uploads = Session.get('uploading');
		Session.set(
			'uploading',
			uploads.filter((u) => u.id !== upload.id),
		);

		if (!Session.get('uploading').length) {
			UserAction.stop(rid, USER_ACTIVITIES.USER_UPLOADING, { tmid });
		}
	} catch (error: unknown) {
		const uploads = Session.get('uploading');
		uploads
			.filter((u) => u.id === upload.id)
			.forEach((u) => {
				u.error = new Error(getErrorMessage(error));
				u.percentage = 0;
			});
		if (!uploads.length) {
			UserAction.stop(rid, USER_ACTIVITIES.USER_UPLOADING, { tmid });
		}
		Session.set('uploading', uploads);
	}
};

type SingleOrArray<T> = T | T[];

type FileUploadProp = SingleOrArray<{
	file: File;
	name: string;
}>;

/* @deprecated */
export const fileUpload = async (
	f: FileUploadProp,
	input: HTMLInputElement,
	{
		rid,
		tmid,
	}: {
		rid: string;
		tmid?: string;
	},
): Promise<void> => {
	if (!f) {
		throw new Error('No files to upload');
	}

	const threadsEnabled = settings.get('Threads_enabled');

	const files = Array.isArray(f) ? f : [f];

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

	const uploadNextFile = (): void => {
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
				onClose: (): void => {
					imperativeModal.close();
					uploadNextFile();
				},
				onSubmit: (fileName: string, description?: string): void => {
					Object.defineProperty(file.file, 'name', {
						writable: true,
						value: fileName,
					});
					uploadFileWithMessage(
						rid,
						{
							description,
							msg,
							file: file.file,
						},
						tmid,
					);
					const localStorageKey = ['messagebox', rid, tmid].filter(Boolean).join('_');
					const chatMessageKey = [rid, tmid].filter(Boolean).join('-');
					const { input } = chatMessages[chatMessageKey];
					input.value = null;
					$(input).trigger('input');
					Meteor._localStorage.removeItem(localStorageKey);
					imperativeModal.close();
					uploadNextFile();
				},
				invalidContentType: Boolean(file.file.type && !fileUploadIsValidContentType(file.file.type)),
			},
		});
	};

	uploadNextFile();
};
