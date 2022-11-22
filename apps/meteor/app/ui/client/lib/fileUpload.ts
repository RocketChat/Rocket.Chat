import { Tracker } from 'meteor/tracker';
import { Session } from 'meteor/session';
import type { IRoom } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import type { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

import { settings } from '../../../settings/client';
import { UserAction, USER_ACTIVITIES } from './UserAction';
import { fileUploadIsValidContentType, APIClient } from '../../../utils/client';
import { imperativeModal } from '../../../../client/lib/imperativeModal';
import FileUploadModal from '../../../../client/views/room/modals/FileUploadModal';
import { prependReplies } from '../../../../client/lib/utils/prependReplies';
import type { ChatMessages } from './ChatMessages';
import { getErrorMessage } from '../../../../client/lib/errorHandling';
import { Rooms } from '../../../models/client';
import { getRandomId } from '../../../../lib/random';

export type Uploading = {
	readonly id: string;
	readonly name: string;
	readonly percentage: number;
	readonly error?: Error;
};

declare module 'meteor/session' {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Session {
		function get(key: 'uploading'): readonly Uploading[];
		function set(key: 'uploading', param: readonly Uploading[]): void;
	}
}

Session.setDefault('uploading', []);

let uploads: readonly Uploading[] = [];

Meteor.startup(() => {
	Tracker.autorun(() => {
		uploads = Session.get('uploading');
	});
});

export const getUploads = (): readonly Uploading[] => uploads;

export const subscribeToUploads = (callback: () => void): (() => void) => {
	const computation = Tracker.autorun(() => {
		Session.get('uploading');
		callback();
	});

	return () => computation.stop();
};

const updateUploads = (update: (uploads: readonly Uploading[]) => readonly Uploading[]) => {
	Session.set('uploading', update(Session.get('uploading')));
};

export const cancelUpload = (id: Uploading['id']) => {
	Session.set(`uploading-cancel-${id}`, true);
};

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
	const id = getRandomId();

	updateUploads((uploads) => [
		...uploads,
		{
			id,
			name: file.name,
			percentage: 0,
		},
	]);

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

						updateUploads((uploads) =>
							uploads.map((upload) => {
								if (upload.id !== id) {
									return upload;
								}

								return {
									...upload,
									percentage: Math.round(progress) || 0,
								};
							}),
						);
					},
					error: (error) => {
						updateUploads((uploads) =>
							uploads.map((upload) => {
								if (upload.id !== id) {
									return upload;
								}

								return {
									...upload,
									percentage: 0,
									error: new Error(xhr.responseText),
								};
							}),
						);
						reject(error);
					},
				},
			);

			if (getUploads().length) {
				UserAction.performContinuously(rid, USER_ACTIVITIES.USER_UPLOADING, { tmid });
			}

			Tracker.autorun((computation) => {
				const abortRequested = Session.get(`uploading-cancel-${id}`);
				if (!abortRequested) {
					return;
				}
				computation.stop();
				Session.delete(`uploading-cancel-${id}`);

				xhr.abort();

				updateUploads((uploads) => uploads.filter((upload) => upload.id !== id));
			});
		});

		updateUploads((uploads) => uploads.filter((upload) => upload.id !== id));
	} catch (error: unknown) {
		updateUploads((uploads) => {
			return uploads.map((upload) => {
				if (upload.id !== id) {
					return upload;
				}

				return {
					...upload,
					percentage: 0,
					error: new Error(getErrorMessage(error)),
				};
			});
		});
	} finally {
		if (!getUploads().length) {
			UserAction.stop(rid, USER_ACTIVITIES.USER_UPLOADING, { tmid });
		}
	}
};

export const wipeFailedUploads = (): void => {
	updateUploads((uploads) => uploads.filter((upload) => !upload.error));
};

/** @deprecated */
export const fileUpload = async (
	files: File[],
	chatMessages: ChatMessages,
	{
		rid,
		tmid,
	}: {
		rid: string;
		tmid?: string;
	},
): Promise<void> => {
	const threadsEnabled = settings.get('Threads_enabled') as boolean;

	const input = chatMessages?.input;

	const replies = chatMessages?.quotedMessages.get() ?? [];
	const mention = input ? $(input).data('mention-user') : false;

	let msg = '';

	if (!mention || !threadsEnabled) {
		msg = await prependReplies('', replies, mention);
	}

	if (mention && threadsEnabled && replies.length) {
		tmid = replies[0]._id;
	}

	const room = (Rooms as Mongo.Collection<IRoom>).findOne({ _id: rid }, { reactive: false });

	const uploadNextFile = (): void => {
		const file = files.pop();
		if (!file) {
			chatMessages?.quotedMessages.clear();
			return;
		}

		imperativeModal.open({
			component: FileUploadModal,
			props: {
				file,
				fileName: file.name,
				fileDescription: input?.value ?? '',
				showDescription: room && !isRoomFederated(room),
				onClose: (): void => {
					imperativeModal.close();
					uploadNextFile();
				},
				onSubmit: (fileName: string, description?: string): void => {
					Object.defineProperty(file, 'name', {
						writable: true,
						value: fileName,
					});
					uploadFileWithMessage(
						rid,
						{
							description,
							msg,
							file,
						},
						tmid,
					);
					chatMessages?.setDraftAndUpdateInput('');
					imperativeModal.close();
					uploadNextFile();
				},
				invalidContentType: Boolean(file.type && !fileUploadIsValidContentType(file.type)),
			},
		});
	};

	uploadNextFile();
};
