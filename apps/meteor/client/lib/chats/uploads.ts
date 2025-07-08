import type { IRoom } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import { Random } from '@rocket.chat/random';
import fileSize from 'filesize';

import { getErrorMessage } from '../errorHandling';
import type { UploadsAPI, EncryptedFileUploadContent } from './ChatAPI';
import { isEncryptedUpload, type Upload } from './Upload';
import { settings } from '../../../app/settings/client';
import { fileUploadIsValidContentType } from '../../../app/utils/client';
import { sdk } from '../../../app/utils/client/lib/SDKClient';
import { i18n } from '../../../app/utils/lib/i18n';

class UploadsStore extends Emitter<{ update: void; [x: `cancelling-${Upload['id']}`]: void }> implements UploadsAPI {
	private rid: string;

	constructor({ rid }: { rid: string }) {
		super();

		this.rid = rid;
	}

	uploads: readonly Upload[] = [];

	set = (uploads: Upload[]): void => {
		this.uploads = uploads;
		this.emit('update');
	};

	get = (): readonly Upload[] => this.uploads;

	subscribe = (callback: () => void): (() => void) => this.on('update', callback);

	cancel = (id: Upload['id']): void => {
		this.emit(`cancelling-${id}`);
	};

	wipeFailedOnes = (): void => {
		this.set(this.uploads.filter((upload) => !upload.error));
	};

	removeUpload = (id: Upload['id']): void => {
		this.set(this.uploads.filter((upload) => upload.id !== id));
	};

	editUploadFileName = async (uploadId: Upload['id'], fileName: Upload['file']['name']): Promise<void> => {
		try {
			this.set(
				this.uploads.map((upload) => {
					if (upload.id !== uploadId) {
						return upload;
					}

					return {
						...upload,
						file: new File([upload.file], fileName, upload.file),
						...(isEncryptedUpload(upload) && {
							metadataForEncryption: { ...upload.metadataForEncryption, name: fileName },
						}),
					};
				}),
			);
		} catch (error) {
			this.set(
				this.uploads.map((upload) => {
					if (upload.id !== uploadId) {
						return upload;
					}

					return {
						...upload,
						percentage: 0,
						error: new Error('Could not update file name'),
					};
				}),
			);
		}
	};

	clear = () => this.set([]);

	async send(file: File, encrypted?: EncryptedFileUploadContent): Promise<void> {
		const maxFileSize = settings.get('FileUpload_MaxFileSize');
		const invalidContentType = !fileUploadIsValidContentType(file.type);
		const id = Random.id();

		this.set([
			...this.uploads,
			{
				id,
				file: encrypted ? encrypted.rawFile : file,
				percentage: 0,
				encryptedFile: encrypted?.encryptedFile,
				metadataForEncryption: encrypted?.fileContent.raw,
			},
		]);

		try {
			await new Promise((resolve, reject) => {
				if (file.size === 0) {
					return reject(new Error(i18n.t('FileUpload_File_Empty')));
				}

				// -1 maxFileSize means there is no limit
				if (maxFileSize > -1 && (file.size || 0) > maxFileSize) {
					return reject(new Error(i18n.t('File_exceeds_allowed_size_of_bytes', { size: fileSize(maxFileSize) })));
				}

				if (invalidContentType) {
					return reject(new Error(i18n.t('FileUpload_MediaType_NotAccepted__type__', { type: file.type })));
				}

				const xhr = sdk.rest.upload(
					`/v1/rooms.media/${this.rid}`,
					{
						file,
						...(encrypted && {
							content: JSON.stringify(encrypted.fileContent.encrypted),
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
							this.set(
								this.uploads.map((upload) => {
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
							this.set(
								this.uploads.map((upload) => {
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
					if (xhr.readyState === xhr.DONE) {
						if (xhr.status === 400) {
							const error = JSON.parse(xhr.responseText);
							this.set(this.uploads.map((upload) => ({ ...upload, error: new Error(error.error) })));
							return;
						}

						if (xhr.status === 200) {
							const result = JSON.parse(xhr.responseText);
							this.set(
								this.uploads.map((upload) => {
									if (upload.id !== id) {
										return upload;
									}

									return {
										...upload,
										id: result.file._id,
										url: result.file.url,
									};
								}),
							);
						}
					}
				};

				this.once(`cancelling-${id}`, () => {
					xhr.abort();
					this.set(this.uploads.filter((upload) => upload.id !== id));
					reject(new Error('Upload cancelled'));
				});
			});
		} catch (error: unknown) {
			this.set(
				this.uploads.map((upload) => {
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
		}
	}
}

export const createUploadsAPI = ({ rid }: { rid: IRoom['_id'] }): UploadsAPI => new UploadsStore({ rid });
