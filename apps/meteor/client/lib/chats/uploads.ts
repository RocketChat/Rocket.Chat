import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import type { Mongo } from 'meteor/mongo';

import { Rooms } from '../../../app/models/client';
import { settings } from '../../../app/settings/client';
import type { ChatMessages } from '../../../app/ui/client/lib/ChatMessages';
import { UserAction, USER_ACTIVITIES } from '../../../app/ui/client/lib/UserAction';
import { fileUploadIsValidContentType, APIClient } from '../../../app/utils/client';
import { getRandomId } from '../../../lib/random';
import FileUploadModal from '../../views/room/modals/FileUploadModal';
import { getErrorMessage } from '../errorHandling';
import { imperativeModal } from '../imperativeModal';
import { prependReplies } from '../utils/prependReplies';
import type { Upload } from './Upload';

let uploads: readonly Upload[] = [];

const emitter = new Emitter<{ update: void; [x: `cancelling-${Upload['id']}`]: void }>();

const updateUploads = (update: (uploads: readonly Upload[]) => readonly Upload[]): void => {
	uploads = update(uploads);
	emitter.emit('update');
};

export const getUploads = (): readonly Upload[] => uploads;

export const subscribeToUploads = (callback: () => void): (() => void) => emitter.on('update', callback);

export const cancelUpload = (id: Upload['id']): void => {
	emitter.emit(`cancelling-${id}`);
};

export const uploadFile = async (
	file: File,
	{
		description,
		msg,
		rid,
		tmid,
	}: {
		description?: string;
		msg?: string;
		rid: string;
		tmid?: string;
	},
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
						resolve(event);
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
					error: (event) => {
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
						reject(event);
					},
				},
			);

			if (uploads.length) {
				UserAction.performContinuously(rid, USER_ACTIVITIES.USER_UPLOADING, { tmid });
			}

			emitter.once(`cancelling-${id}`, () => {
				xhr.abort();
				updateUploads((uploads) => uploads.filter((upload) => upload.id !== id));
			});
		});

		updateUploads((uploads) => uploads.filter((upload) => upload.id !== id));
	} catch (error: unknown) {
		updateUploads((uploads) =>
			uploads.map((upload) => {
				if (upload.id !== id) {
					return upload;
				}

				return {
					...upload,
					percentage: 0,
					error: new Error(getErrorMessage(error)),
				};
			}),
		);
	} finally {
		if (!uploads.length) {
			UserAction.stop(rid, USER_ACTIVITIES.USER_UPLOADING, { tmid });
		}
	}
};

export const wipeFailedUploads = (): void => {
	updateUploads((uploads) => uploads.filter((upload) => !upload.error));
};

export const uploadFiles = async (
	files: readonly File[],
	{ chat, rid, tmid }: { chat: ChatMessages; rid: IRoom['_id']; tmid?: IMessage['_id'] },
): Promise<void> => {
	const threadsEnabled = settings.get('Threads_enabled') as boolean;

	const replies = chat.composer?.quotedMessages.get() ?? [];
	const mention = false;

	let msg = '';

	if (!mention || !threadsEnabled) {
		msg = await prependReplies('', replies, mention);
	}

	if (mention && threadsEnabled && replies.length) {
		tmid = replies[0]._id;
	}

	const room = (Rooms as Mongo.Collection<IRoom>).findOne({ _id: rid }, { reactive: false });

	const queue = [...files];

	const uploadNextFile = (): void => {
		const file = queue.pop();
		if (!file) {
			chat.composer?.dismissAllQuotedMessages();
			return;
		}

		imperativeModal.open({
			component: FileUploadModal,
			props: {
				file,
				fileName: file.name,
				fileDescription: chat.composer?.text ?? '',
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
					uploadFile(file, {
						description,
						msg,
						rid,
						tmid,
					});
					chat.composer?.clear();
					imperativeModal.close();
					uploadNextFile();
				},
				invalidContentType: Boolean(file.type && !fileUploadIsValidContentType(file.type)),
			},
		});
	};

	uploadNextFile();
};
