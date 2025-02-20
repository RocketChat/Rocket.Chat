export type NonEncryptedUpload = {
	readonly id: string;
	readonly file: File;
	readonly url?: string;
	readonly percentage: number;
	readonly error?: Error;
};

export type EncryptedUpload = NonEncryptedUpload & {
	readonly encryptedFile: EncryptedFile;
};

export type Upload = EncryptedUpload | NonEncryptedUpload;

export type EncryptedFile = {
	file: File;
	key: JsonWebKey;
	iv: string;
	type: File['type'];
	hash: string;
};
