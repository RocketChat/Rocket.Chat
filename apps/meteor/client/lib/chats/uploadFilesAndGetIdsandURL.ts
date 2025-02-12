import type { IUpload } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import { Random } from '@rocket.chat/random';

import { UserAction, USER_ACTIVITIES } from '../../../app/ui/client/lib/UserAction';
import { sdk } from '../../../app/utils/client/lib/SDKClient';
import { getErrorMessage } from '../errorHandling';
import type { Upload } from './Upload';

let uploads: readonly Upload[] = [];

const emitter = new Emitter<{ update: void; [x: `cancelling-${Upload['id']}`]: void }>();

const updateUploads = (update: (uploads: readonly Upload[]) => readonly Upload[]): void => {
	uploads = update(uploads);
	emitter.emit('update');
};
export const uploadAndGetIds = async (
	file: File,
	{
		rid,
		tmid,
		fileContent,
	}: {
		rid: string;
		tmid?: string;
		fileContent?: { raw: Partial<IUpload>; encrypted?: { algorithm: string; ciphertext: string } | undefined };
	},
): Promise<{ fileId: string; fileUrl: string }> => {
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
		const result = await new Promise<{ fileId: string; fileUrl: string }>((resolve, reject) => {
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
						console.log('from uploadfiles event', event);
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

			xhr.onload = () => {
				if (xhr.readyState === xhr.DONE && xhr.status === 200) {
					const response = JSON.parse(xhr.responseText);

					resolve({
						fileId: response.file._id,
						fileUrl: response.file.url,
					});
				} else {
					reject(new Error('File upload failed.'));
				}
			};

			if (uploads.length) {
				UserAction.performContinuously(rid, USER_ACTIVITIES.USER_UPLOADING, { tmid });
			}

			emitter.once(`cancelling-${id}`, () => {
				xhr.abort();
				updateUploads((uploads) => uploads.filter((upload) => upload.id !== id));
				reject(new Error('Upload cancelled.'));
			});
		});

		updateUploads((uploads) => uploads.filter((upload) => upload.id !== id));

		return result;
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
		throw error;
	} finally {
		if (!uploads.length) {
			UserAction.stop(rid, USER_ACTIVITIES.USER_UPLOADING, { tmid });
		}
	}
};
