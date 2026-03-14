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
		this.updateUpload(id, { status: 'paused' });
		this.emit(`pausing-${id}`);
	};

	resume = (id: Upload['id']): void => {
		this.updateUpload(id, { status: 'uploading' });
		this.emit(`resuming-${id}`);
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

		const CHUNK_SIZE = 1024 * 1024; // 1MB

		const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
		let uploadId: string | undefined;
		let xhr: { abort: () => void } | undefined;
		let cancelled = false;

		const cancelHandler = async () => {
			cancelled = true;
			if (xhr) {
				xhr.abort();
			}
			if (uploadId) {
				try {
					await sdk.rest.post('/v1/uploads/cancel', { uploadId });
				} catch (e) {
					// ignore
				}
			}
			this.set(this.uploads.filter((upload) => upload.id !== id));
		};

		this.once(`cancelling-${id}`, cancelHandler);

		try {
			if (file.size === 0) {
				throw new Error(i18n.t('FileUpload_File_Empty'));
			}

			if (maxFileSize > -1 && (file.size || 0) > maxFileSize) {
				throw new Error(i18n.t('File_exceeds_allowed_size_of_bytes', { size: fileSize(maxFileSize) }));
			}

			if (invalidContentType) {
				throw new Error(i18n.t('FileUpload_MediaType_NotAccepted__type__', { type: file.type }));
			}

			// Init resumable upload
			const initResponse = (await sdk.rest.post('/v1/uploads/init', {
				rid: this.rid,
				fileName: file.name,
				fileSize: file.size,
				fileType: file.type,
				chunkSize: CHUNK_SIZE,
			})) as any;

			if (cancelled) return;
			uploadId = initResponse.uploadId;

			for (let i = 0; i < totalChunks; i++) {
				if (cancelled) return;

				// Wait if paused
				const currentUpload = this.uploads.find((u) => u.id === id);
				if (currentUpload?.status === 'paused') {
					await new Promise<void>((resolve) => {
						const resumeHandler = () => {
							this.off(`resuming-${id}`, resumeHandler);
							this.off(`cancelling-${id}`, cancelHandlerInLoop);
							resolve();
						};
						const cancelHandlerInLoop = () => {
							this.off(`resuming-${id}`, resumeHandler);
							this.off(`cancelling-${id}`, cancelHandlerInLoop);
							resolve();
						};
						this.on(`resuming-${id}`, resumeHandler);
						this.on(`cancelling-${id}`, cancelHandlerInLoop);
					});
				}

				if (cancelled) return;

				const chunk = file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);

				await new Promise((resolve, reject) => {
					xhr = sdk.rest.upload(`/v1/uploads/chunk?uploadId=${uploadId}&chunkIndex=${i}`, {
						chunkData: chunk,
					});

					const currentXhr = xhr as XMLHttpRequest;

					currentXhr.onload = () => {
						if (currentXhr.status === 200) {
							resolve(currentXhr.response);
						} else {
							reject(new Error(currentXhr.statusText));
						}
					};

					currentXhr.onerror = () => reject(new Error('Network error'));
				});

				this.updateUpload(id, { percentage: Math.round(((i + 1) / totalChunks) * 100) });
			}

			if (cancelled) return;

			// Complete upload
			const { file: finalFile } = (await sdk.rest.post('/v1/uploads/complete', { uploadId })) as any;
			this.updateUpload(id, { id: finalFile._id, url: finalFile.url, status: 'complete' });
		} catch (error: unknown) {
			if (!cancelled) {
				this.updateUpload(id, { percentage: 0, error: new Error(getErrorMessage(error)), status: 'error' });
			}
		} finally {
			this.off(`cancelling-${id}`, cancelHandler);
		}
	}
}

export const createUploadsAPI = ({ rid }: { rid: IRoom['_id'] }): UploadsAPI => new UploadsStore({ rid });
