import type { IRoom } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import { Random } from '@rocket.chat/random';
import fileSize from 'filesize';

import { getErrorMessage } from '../errorHandling';
import type { UploadsAPI, EncryptedFileUploadContent } from './ChatAPI';
import { isEncryptedUpload, type Upload } from './Upload';
import { fileUploadIsValidContentType } from '../../../app/utils/client';
import { sdk } from '../../../app/utils/client/lib/SDKClient';
import { i18n } from '../../../app/utils/lib/i18n';
import { settings } from '../settings';

class UploadsStore extends Emitter<{
	update: void;
	[x: `cancelling-${Upload['id']}`]: void;
	[x: `pausing-${Upload['id']}`]: void;
	[x: `resuming-${Upload['id']}`]: void;
}> implements UploadsAPI {
	private rid: string;

	constructor({ rid }: { rid: string }) {
		super();

		this.rid = rid;
	}

	private uploads: readonly Upload[] = [];

	private processingUploads: boolean = false;

	set = (uploads: Upload[]): void => {
		this.uploads = uploads;
		this.emit('update');
	};

	get = (): readonly Upload[] => this.uploads;

	subscribe = (callback: () => void): (() => void) => this.on('update', callback);

	setProcessingUploads = (processing: boolean): void => {
		this.processingUploads = processing;
		this.emit('update');
	};

	getProcessingUploads = (): boolean => this.processingUploads;

	cancel = (id: Upload['id']): void => {
		this.emit(`cancelling-${id}`);
	};

	pause = (id: Upload['id']): void => {
		this.emit(`pausing-${id}`);
		this.updateUpload(id, { status: 'paused' });
	};

	resume = (id: Upload['id']): void => {
		this.emit(`resuming-${id}`);
		this.updateUpload(id, { status: 'uploading' });
	};

	wipeFailedOnes = (): void => {
		this.set(this.uploads.filter((upload) => !upload.error));
	};

	private updateUpload(id: Upload['id'], patch: Partial<Upload>): void {
		this.set(this.uploads.map((upload) => (upload.id !== id ? upload : { ...upload, ...patch })));
	}

	removeUpload = (id: Upload['id']): void => {
		this.set(this.uploads.filter((upload) => upload.id !== id));
	};

	editUploadFileName = (uploadId: Upload['id'], fileName: Upload['file']['name']) => {
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
						error: new Error(i18n.t('FileUpload_Update_Failed')),
					};
				}),
			);
		}
	};

	clear = () => this.set([]);

	async send(file: File, encrypted?: EncryptedFileUploadContent): Promise<void> {
		const maxFileSize = settings.peek('FileUpload_MaxFileSize');
		const invalidContentType = !fileUploadIsValidContentType(encrypted ? encrypted.rawFile.type : file.type);
		const id = Random.id();

		this.set([
			...this.uploads,
			{
				id,
				file: encrypted ? encrypted.rawFile : file,
				percentage: 0,
				status: 'uploading',
				...(encrypted && {
					encryptedFile: encrypted.encryptedFile,
					metadataForEncryption: encrypted.fileContent.raw,
				}),
			},
		]);

		const actualFile = encrypted ? encrypted.rawFile : file;
		const totalSize = actualFile.size;
		const chunkSize = 1024 * 1024; // 1MB chunks
		let offset = 0;
		let serverFileId: string | undefined;
		let currentXhr: XMLHttpRequest | undefined;
		let isPaused = false;

		const uploadNextChunk = async (): Promise<void> => {
			if (isPaused) {
				return;
			}

			return new Promise((resolve, reject) => {
				const end = Math.min(offset + chunkSize, totalSize);
				const chunk = actualFile.slice(offset, end);

				const xhr = sdk.rest.upload(
					`/v1/rooms.media/${this.rid}?offset=${offset}&totalSize=${totalSize}${serverFileId ? `&fileId=${serverFileId}` : ''}`,
					{
						file: new File([chunk], actualFile.name, { type: actualFile.type }),
						...(encrypted &&
							offset === 0 && {
								content: JSON.stringify(encrypted.fileContent.encrypted),
							}),
					},
					{
						progress: (event) => {
							if (!event.lengthComputable) {
								return;
							}
							const progress = ((offset + event.loaded) / totalSize) * 100;
							this.updateUpload(id, { percentage: Math.round(progress) || 0 });
						},
						error: (event) => {
							this.updateUpload(id, { percentage: 0, error: new Error(xhr.responseText), status: 'error' });
							reject(event);
						},
					},
				);

				currentXhr = xhr;

				xhr.onload = () => {
					if (xhr.status !== 200) {
						const error = JSON.parse(xhr.responseText || '{}');
						this.updateUpload(id, { percentage: 0, error: new Error(error.error || i18n.t('FileUpload_Error')), status: 'error' });
						return reject(new Error('Upload failed'));
					}

					const result = JSON.parse(xhr.responseText);
					if (result.file.waiting) {
						serverFileId = result.file._id;
						offset = end;
						resolve(uploadNextChunk());
					} else {
						this.updateUpload(id, { id: result.file._id, url: result.file.url, status: 'complete', percentage: 100 });
						resolve();
					}
				};
			});
		};

		const onPause = () => {
			isPaused = true;
			if (currentXhr) {
				currentXhr.abort();
			}
		};

		const onResume = () => {
			if (!isPaused) return;
			isPaused = false;
			uploadNextChunk().catch((e) => console.error('Resume failed', e));
		};

		const onCancel = () => {
			isPaused = true;
			if (currentXhr) {
				currentXhr.abort();
			}
			this.set(this.uploads.filter((upload) => upload.id !== id));
		};

		this.once(`pausing-${id}`, onPause);
		this.on(`resuming-${id}`, onResume);
		this.once(`cancelling-${id}`, onCancel);

		try {
			if (totalSize === 0) {
				throw new Error(i18n.t('FileUpload_File_Empty'));
			}

			if (maxFileSize > -1 && totalSize > maxFileSize) {
				throw new Error(i18n.t('File_exceeds_allowed_size_of_bytes', { size: fileSize(maxFileSize) }));
			}

			if (invalidContentType) {
				throw new Error(i18n.t('FileUpload_MediaType_NotAccepted__type__', { type: actualFile.type }));
			}

			await uploadNextChunk();
		} catch (error: unknown) {
			if (!isPaused) {
				this.updateUpload(id, { percentage: 0, error: new Error(getErrorMessage(error)), status: 'error' });
			}
		} finally {
			this.off(`pausing-${id}`, onPause);
			this.off(`resuming-${id}`, onResume);
			this.off(`cancelling-${id}`, onCancel);
		}
	}
}

export const createUploadsAPI = ({ rid }: { rid: IRoom['_id'] }): UploadsAPI => new UploadsStore({ rid });
