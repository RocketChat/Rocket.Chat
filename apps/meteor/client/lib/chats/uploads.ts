import type { IMessage, IRoom, IE2EEMessage, IUpload } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import { Random } from '@rocket.chat/random';

import { UserAction, USER_ACTIVITIES } from '../../../app/ui/client/lib/UserAction';
import { sdk } from '../../../app/utils/client/lib/SDKClient';
import { getErrorMessage } from '../errorHandling';
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
		t,
	}: {
		description?: string;
		msg?: string;
		rid: string;
		tmid?: string;
		t?: IMessage['t'];
	},
	getContent?: (fileId: string, fileUrl: string) => Promise<IE2EEMessage['content']>,
	fileContent?: { raw: Partial<IUpload>; encrypted: IE2EEMessage['content'] },
): Promise<void> => {
	const id = Random.id();

	updateUploads((uploads) => [
		...uploads,
		{
			id,
			name: fileContent?.raw.name || file.name,
			percentage: 0,
		},
	]);

	try {
		await new Promise((resolve, reject) => {
			const xhr = sdk.rest.upload(
				`/v1/rooms.media/${rid}`,
				{
					file,
					...(fileContent && {
						content: JSON.stringify(fileContent.encrypted),
					}),
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

			xhr.onload = async () => {
				if (xhr.readyState === xhr.DONE && xhr.status === 200) {
					const result = JSON.parse(xhr.responseText);
					let content;
					if (getContent) {
						content = await getContent(result.file._id, result.file.url);
					}

					await sdk.rest.post(`/v1/rooms.mediaConfirm/${rid}/${result.file._id}`, {
						msg,
						tmid,
						description,
						t,
						content,
					});
				}
			};

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
	send: (
		file: File,
		{ description, msg, t }: { description?: string; msg?: string; t?: IMessage['t'] },
		getContent?: (fileId: string, fileUrl: string) => Promise<IE2EEMessage['content']>,
		fileContent?: { raw: Partial<IUpload>; encrypted: IE2EEMessage['content'] },
	): Promise<void> => send(file, { description, msg, rid, tmid, t }, getContent, fileContent),
});
