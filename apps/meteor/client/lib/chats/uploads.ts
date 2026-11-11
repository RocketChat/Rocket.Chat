import type { IMessage, IRoom, IUpload } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import { Random } from '@rocket.chat/random';
import fileSize from 'filesize';

import { getErrorMessage } from '../errorHandling';
import type { UploadsAPI, EncryptedFileUploadContent } from './ChatAPI';
import { isEncryptedUpload, type Upload } from './Upload';
import { i18n } from '../../../lib/i18n';
import { sdk } from '../SDKClient';
import { USER_ACTIVITIES, UserAction } from '../UserAction';
import { settings } from '../settings';
import { fileUploadIsValidContentType } from '../utils/restrictions';

const STORAGE_KEY_PREFIX = 'composer_uploads_';

// The server deletes unconfirmed uploads 24 hours after receiving them; forgetting ours an hour earlier keeps the
// composer from offering a file that no longer exists.
const PERSISTED_UPLOAD_TTL = 23 * 60 * 60 * 1000;

type PersistedUpload = {
	id: string;
	fileName: string;
	fileType: string;
	fileSize: number;
	url: string;
	altText?: string;
	expiresAt: number;
	encryption?: {
		key: JsonWebKey;
		iv: string;
		type: string;
		hash: string;
		metadataForEncryption: Partial<IUpload>;
		imageDimensions?: { height: number; width: number };
	};
};

type PersistedUploadsChange = { removed: readonly PersistedUpload['id'][] };

// Every store of a room or thread hears about writes to its key, including writes from a store whose composer has
// already been left.
const persistedUploadsEvents = new Emitter<Record<string, PersistedUploadsChange>>();

const readPersistedUploads = (storageKey: string): PersistedUpload[] => {
	let persisted: PersistedUpload[];
	try {
		const stored = localStorage.getItem(storageKey);
		persisted = stored ? JSON.parse(stored) : [];
		if (!Array.isArray(persisted)) {
			throw new Error('Invalid persisted uploads');
		}
	} catch {
		writePersistedUploads(storageKey, []);
		return [];
	}

	const now = Date.now();
	const live = persisted.filter((entry) => typeof entry?.expiresAt === 'number' && entry.expiresAt > now);
	if (live.length !== persisted.length) {
		writePersistedUploads(
			storageKey,
			live,
			persisted.filter((entry) => !live.includes(entry)).map((entry) => entry?.id),
		);
	}

	return live;
};

// Keeping uploads is best effort: when storage is full or unavailable, they stay in the composer but won't come back
// on the next visit.
const writePersistedUploads = (storageKey: string, entries: PersistedUpload[], removed: readonly PersistedUpload['id'][] = []): void => {
	try {
		if (entries.length === 0) {
			localStorage.removeItem(storageKey);
		} else {
			localStorage.setItem(storageKey, JSON.stringify(entries));
		}
	} catch {
		return;
	}
	persistedUploadsEvents.emit(storageKey, { removed });
};

// Stands in for a file whose bytes are already on the server: it reports the size the user picked, so the chip and the
// sent message still show it.
const createPlaceholderFile = (name: string, type: string, size: number): File => {
	const file = new File([], name, { type });
	Object.defineProperty(file, 'size', { value: size, configurable: true });
	return file;
};

const toPersistedUpload = (upload: Upload, expiresAt: number): PersistedUpload | undefined => {
	if (!upload.url || upload.error) {
		return undefined;
	}

	return {
		id: upload.id,
		fileName: upload.file.name,
		fileType: upload.file.type,
		fileSize: upload.file.size,
		url: upload.url,
		...(upload.altText && { altText: upload.altText }),
		expiresAt,
		...(isEncryptedUpload(upload) && {
			encryption: {
				key: upload.encryptedFile.key,
				iv: upload.encryptedFile.iv,
				type: upload.encryptedFile.type,
				hash: upload.encryptedFile.hash,
				metadataForEncryption: upload.metadataForEncryption,
				...(upload.imageDimensions && { imageDimensions: upload.imageDimensions }),
			},
		}),
	};
};

const fromPersistedUpload = (entry: PersistedUpload): Upload => ({
	id: entry.id,
	file: createPlaceholderFile(entry.fileName, entry.fileType, entry.fileSize),
	url: entry.url,
	percentage: 100,
	restored: true,
	...(entry.altText && { altText: entry.altText }),
	...(entry.encryption && {
		encryptedFile: {
			file: createPlaceholderFile(entry.fileName, entry.encryption.type, entry.fileSize),
			key: entry.encryption.key,
			iv: entry.encryption.iv,
			type: entry.encryption.type,
			hash: entry.encryption.hash,
		},
		metadataForEncryption: entry.encryption.metadataForEncryption,
		...(entry.encryption.imageDimensions && { imageDimensions: entry.encryption.imageDimensions }),
	}),
});

// Leaving the page loses whatever is still uploading, so the browser asks first. The desktop app is left out: there,
// blocking the unload keeps the window from closing without asking anything.
let uploadsInFlight = 0;

const warnBeforeUnload = (event: BeforeUnloadEvent): void => {
	event.preventDefault();
	event.returnValue = '';
};

const trackUploadInFlight = (): (() => void) => {
	if (window.RocketChatDesktop) {
		return () => undefined;
	}

	uploadsInFlight++;
	if (uploadsInFlight === 1) {
		window.addEventListener('beforeunload', warnBeforeUnload);
	}

	let done = false;
	return () => {
		if (done) {
			return;
		}
		done = true;
		uploadsInFlight--;
		if (uploadsInFlight === 0) {
			window.removeEventListener('beforeunload', warnBeforeUnload);
		}
	};
};

class UploadsStore extends Emitter<{ update: void; [x: `cancelling-${Upload['id']}`]: void }> implements UploadsAPI {
	private rid: string;

	private tmid?: string;

	private storageKey: string;

	constructor({ rid, tmid }: { rid: IRoom['_id']; tmid?: IMessage['_id'] }) {
		super();
		this.rid = rid;
		this.tmid = tmid;
		this.storageKey = `${STORAGE_KEY_PREFIX}${rid}${tmid ? `-${tmid}` : ''}`;
	}

	private uploads: readonly Upload[] = [];

	private processingUploads: boolean = false;

	private attachments = 0;

	private stopListeningToStorage?: () => void;

	private expiryTimer?: ReturnType<typeof setTimeout>;

	attach = (): void => {
		this.attachments++;
		if (this.attachments > 1) {
			return;
		}

		this.stopListeningToStorage = persistedUploadsEvents.on(this.storageKey, this.syncWithStorage);
		this.syncWithStorage();
	};

	detach = (): void => {
		this.attachments = Math.max(0, this.attachments - 1);
		if (this.attachments > 0) {
			return;
		}

		this.stopListeningToStorage?.();
		this.stopListeningToStorage = undefined;
		clearTimeout(this.expiryTimer);
		this.expiryTimer = undefined;
		this.set([]);
		UserAction.stop(this.rid, USER_ACTIVITIES.USER_UPLOADING, { tmid: this.tmid });
	};

	// An open composer shows what is kept for its room or thread: uploads kept elsewhere appear, and uploads discarded
	// elsewhere or expired disappear.
	private syncWithStorage = ({ removed }: PersistedUploadsChange = { removed: [] }): void => {
		const entries = readPersistedUploads(this.storageKey);
		const kept = this.uploads.filter((upload) => !removed.includes(upload.id));
		const missing = entries.filter((entry) => !kept.some((upload) => upload.id === entry.id));

		if (kept.length !== this.uploads.length || missing.length > 0) {
			this.set([...kept, ...missing.map(fromPersistedUpload)]);
		}

		this.scheduleExpiry(entries);
	};

	private scheduleExpiry(entries: PersistedUpload[]): void {
		clearTimeout(this.expiryTimer);
		this.expiryTimer = undefined;
		if (entries.length === 0) {
			return;
		}

		const nextExpiry = Math.min(...entries.map((entry) => entry.expiresAt));
		this.expiryTimer = setTimeout(() => readPersistedUploads(this.storageKey), Math.max(0, nextExpiry - Date.now()));
	}

	private persistUpload(upload: Upload): void {
		const entries = readPersistedUploads(this.storageKey);
		const existing = entries.find((entry) => entry.id === upload.id);
		const entry = toPersistedUpload(upload, existing?.expiresAt ?? Date.now() + PERSISTED_UPLOAD_TTL);
		if (!entry) {
			return;
		}

		writePersistedUploads(this.storageKey, existing ? entries.map((e) => (e.id === upload.id ? entry : e)) : [...entries, entry]);
	}

	private forgetUpload(id: Upload['id']): void {
		const entries = readPersistedUploads(this.storageKey);
		if (!entries.some((entry) => entry.id === id)) {
			return;
		}

		writePersistedUploads(
			this.storageKey,
			entries.filter((entry) => entry.id !== id),
			[id],
		);
	}

	private persistUploadById(id: Upload['id']): void {
		const upload = this.uploads.find((upload) => upload.id === id);
		if (upload) {
			this.persistUpload(upload);
		}
	}

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
		this.forgetUpload(id);

		if (this.uploads.length === 0) {
			UserAction.stop(this.rid, USER_ACTIVITIES.USER_UPLOADING, { tmid: this.tmid });
		}
	};

	editUploadAltText = (uploadId: Upload['id'], altText: string) => {
		this.set(
			this.uploads.map((upload) => {
				if (upload.id !== uploadId) {
					return upload;
				}

				return {
					...upload,
					altText,
					...(isEncryptedUpload(upload) && {
						metadataForEncryption: { ...upload.metadataForEncryption, altText },
					}),
				};
			}),
		);
		this.persistUploadById(uploadId);
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
						file: upload.restored
							? createPlaceholderFile(fileName, upload.file.type, upload.file.size)
							: new File([upload.file], fileName, upload.file),
						...(isEncryptedUpload(upload) && {
							metadataForEncryption: { ...upload.metadataForEncryption, name: fileName },
						}),
					};
				}),
			);
			this.persistUploadById(uploadId);
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
		this.uploads.filter((upload) => !upload.url && !upload.error).forEach((upload) => this.cancel(upload.id));
		this.set([]);
		writePersistedUploads(
			this.storageKey,
			[],
			readPersistedUploads(this.storageKey).map((entry) => entry.id),
		);
		UserAction.stop(this.rid, USER_ACTIVITIES.USER_UPLOADING, { tmid: this.tmid });
	};

	async send(file: File, encrypted?: EncryptedFileUploadContent): Promise<void> {
		const maxFileSize = settings.peek('FileUpload_MaxFileSize');
		const invalidContentType = !fileUploadIsValidContentType(encrypted ? encrypted.rawFile.type : file.type);
		const id = Random.id();
		const pending: Upload = {
			id,
			file: encrypted ? encrypted.rawFile : file,
			percentage: 0,
			...(encrypted && {
				encryptedFile: encrypted.encryptedFile,
				metadataForEncryption: encrypted.fileContent.raw,
				...(encrypted.imageDimensions && { imageDimensions: encrypted.imageDimensions }),
			}),
		};

		this.set([...this.uploads, pending]);
		const untrackUploadInFlight = trackUploadInFlight();

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
							this.updateUpload(id, { percentage: Math.min(Math.round(progress), 99) || 0 });
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

						if (xhr.status === 400 || xhr.status === 403) {
							const error = JSON.parse(xhr.responseText);
							this.updateUpload(id, { percentage: 0, error: new Error(error.error) });
							return;
						}

						if (xhr.status === 200) {
							const result = JSON.parse(xhr.responseText);
							const uploaded = { id: result.file._id, url: result.file.url, percentage: 100 };
							const upload = this.uploads.find((upload) => upload.id === id);
							this.updateUpload(id, uploaded);
							// The composer may have been left while this was uploading; the file still waits for it there.
							this.persistUpload({ ...(upload ?? pending), ...uploaded });
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
		} finally {
			untrackUploadInFlight();
		}
	}
}

export const createUploadsAPI = ({ rid, tmid }: { rid: IRoom['_id']; tmid?: IMessage['_id'] }): UploadsAPI =>
	new UploadsStore({ rid, tmid });
