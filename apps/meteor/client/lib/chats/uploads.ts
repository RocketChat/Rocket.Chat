import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import { Random } from '@rocket.chat/random';
import fileSize from 'filesize';

import { getErrorMessage } from '../errorHandling';
import type { UploadsAPI, EncryptedFileUploadContent } from './ChatAPI';
import { isEncryptedUpload, type Upload } from './Upload';
import { USER_ACTIVITIES, UserAction } from '../../../app/ui/client/lib/UserAction';
import { fileUploadIsValidContentType } from '../../../app/utils/client';
import { sdk } from '../../../app/utils/client/lib/SDKClient';
import { i18n } from '../../../app/utils/lib/i18n';
import { settings } from '../settings';

class UploadsStore extends Emitter<{ update: void; [x: `cancelling-${Upload['id']}`]: void }> implements UploadsAPI {
	private rid: string;

	private tmid?: string;

	constructor({ rid, tmid }: { rid: IRoom['_id']; tmid?: IMessage['_id'] }) {
		super();
		this.rid = rid;
		this.tmid = tmid;
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

	wipeFailedOnes = (): void => {
		this.set(this.uploads.filter((upload) => !upload.error));
	};

	private updateUpload(id: Upload['id'], patch: Partial<Upload>): void {
		this.set(this.uploads.map((upload) => (upload.id !== id ? upload : { ...upload, ...patch })));
	}

	removeUpload = (id: Upload['id']): void => {
		this.set(this.uploads.filter((upload) => upload.id !== id));

		if (this.uploads.length === 0) {
			UserAction.stop(this.rid, USER_ACTIVITIES.USER_UPLOADING, { tmid: this.tmid });
		}
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

	clear = () => {
		this.set([]);
		UserAction.stop(this.rid, USER_ACTIVITIES.USER_UPLOADING, { tmid: this.tmid });
	};

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
				...(encrypted && {
					encryptedFile: encrypted.encryptedFile,
					metadataForEncryption: encrypted.fileContent.raw,
				}),
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
							this.updateUpload(id, { percentage: Math.round(progress) || 0 });
						},
						error: (event) => {
							this.updateUpload(id, { percentage: 0, error: new Error(xhr.responseText) });
							reject(event);
						},
					},
				);

				xhr.onload = () => {
					try {
						if (xhr.readyState !== xhr.DONE) {
							return;
						}

						if (xhr.status === 400) {
							const error = JSON.parse(xhr.responseText);
							this.updateUpload(id, { percentage: 0, error: new Error(error.error) });
							return;
						}

						if (xhr.status === 200) {
							const result = JSON.parse(xhr.responseText);
							this.updateUpload(id, { id: result.file._id, url: result.file.url });
							return;
						}

						this.updateUpload(id, { percentage: 0, error: new Error(i18n.t('FileUpload_Error')) });
					} catch (error) {
						this.updateUpload(id, { percentage: 0, error: new Error(getErrorMessage(error)) });
					}
				};

				this.once(`cancelling-${id}`, () => {
					xhr.abort();
					this.removeUpload(id);
					reject(new Error(i18n.t('FileUpload_Canceled')));
				});
			});
		} catch (error: unknown) {
			this.updateUpload(id, { percentage: 0, error: new Error(getErrorMessage(error)) });
		}
	}
}

export const createUploadsAPI = ({ rid, tmid }: { rid: IRoom['_id']; tmid?: IMessage['_id'] }): UploadsAPI =>
	new UploadsStore({ rid, tmid });
