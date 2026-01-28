import type { IUpload } from '@rocket.chat/core-typings';

export type NonEncryptedUpload = {
	readonly id: string;
	readonly file: File;
	readonly url?: string;
	readonly percentage: number;
	readonly error?: Error;
};

export type EncryptedUpload = NonEncryptedUpload & {
	readonly encryptedFile: EncryptedFile;
	readonly metadataForEncryption: Partial<IUpload>;
};

export type Upload = EncryptedUpload | NonEncryptedUpload;

export type EncryptedFile = {
	file: File;
	key: JsonWebKey;
	iv: string;
	type: File['type'];
	hash: string;
};

export const isEncryptedUpload = (upload: Upload): upload is EncryptedUpload => 'encryptedFile' in upload;
