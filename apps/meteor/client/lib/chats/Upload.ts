import type { IUpload } from '@rocket.chat/core-typings';

export type NonEncryptedUpload = {
	readonly id: string;
	readonly file: File;
	readonly url?: string;
	readonly percentage: number;
	readonly error?: Error;
	readonly altText?: string;
	readonly restored?: boolean;
};

export type EncryptedUpload = NonEncryptedUpload & {
	readonly encryptedFile: EncryptedFile;
	readonly metadataForEncryption: Partial<IUpload>;
	readonly imageDimensions?: { height: number; width: number };
};

export type Upload = EncryptedUpload | NonEncryptedUpload;

export type EncryptedFile = {
	readonly file: File;
	readonly key: JsonWebKey;
	readonly iv: string;
	readonly type: File['type'];
	readonly hash: string;
};

export const isEncryptedUpload = (upload: Upload): upload is EncryptedUpload =>
	'encryptedFile' in upload && upload.encryptedFile !== undefined;
