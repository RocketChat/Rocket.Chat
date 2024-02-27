import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import { Random } from '@rocket.chat/random';

import { UserAction, USER_ACTIVITIES } from '../../../app/ui/client/lib/UserAction';
import { sdk } from '../../../app/utils/client/lib/SDKClient';
import { getErrorMessage } from '../errorHandling';
import { onClientBeforeSendMessage } from '../onClientBeforeSendMessage';
import type { UploadsAPI } from './ChatAPI';
import type { Upload } from './Upload';

let uploads: readonly Upload[] = [];

const emitter = new Emitter<{ update: void; [x: `cancelling-${Upload['id']}`]: void }>();

const updateUploads = (update: (uploads: readonly Upload[]) => readonly Upload[]): void => {
	uploads = update(uploads);
	emitter.emit('update');
};

const get = (): readonly Upload[] => uploads;

const subscribe = (callback: () => void): (() => void) => emitter.on('update', callback);

const cancel = (id: Upload['id']): void => {
	emitter.emit(`cancelling-${id}`);
};

const wipeFailedOnes = (): void => {
	updateUploads((uploads) => uploads.filter((upload) => !upload.error));
};

const send = async (
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
	const id = Random.id();

	updateUploads((uploads) => [
		...uploads,
		{
			id,
			name: file.name,
			percentage: 0,
		},
	]);

	console.log('upload', { description, msg });

	try {
		// Assuming that only description is available in case of attachments
		const message = description
			? await onClientBeforeSendMessage({
					_id: id,
					msg: description,
					rid,
			  })
			: ({
					msg: description,
			  } as IMessage);

		console.log('attachment encrypted, ', message);

		await new Promise((resolve, reject) => {
			const xhr = sdk.rest.upload(
				`/v1/rooms.upload/${rid}`,
				{
					msg,
					tmid,
					file,
					description: message.msg,
					...(message.t && { t: message.t }),
					...(message.e2e && { e2e: message.e2e }),
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

export const createUploadsAPI = ({ rid, tmid }: { rid: IRoom['_id']; tmid?: IMessage['_id'] }): UploadsAPI => ({
	get,
	subscribe,
	wipeFailedOnes,
	cancel,
	send: (file: File, { description, msg }: { description?: string; msg?: string }): Promise<void> =>
		send(file, { description, msg, rid, tmid }),
});
