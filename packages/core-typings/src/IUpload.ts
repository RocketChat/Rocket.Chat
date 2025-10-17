import type { EncryptedContent } from './IMessage';
import type { IUser } from './IUser';

export interface IUpload {
	_id: string;
	typeGroup?: string;
	description?: string;
	type?: string;
	name?: string;
	aliases?: string;
	extension?: string;
	complete?: boolean;
	rid?: string;
	uid?: string;
	uploading?: boolean;
	userId?: string;
	progress?: number;
	etag?: string;
	size?: number;
	identify?: {
		format?: string;
		size?: {
			width: number;
			height: number;
		};
	};
	store?: string;
	path?: string;
	token?: string;
	uploadedAt?: Date;
	modifiedAt?: Date;
	url?: string;
	originalStore?: string;
	originalId?: string;
	message_id?: string;
	instanceId?: string;
	AmazonS3?: {
		path: string;
	};
	s3?: {
		path: string;
	};
	GoogleStorage?: {
		path: string;
	};
	googleCloudStorage?: {
		path: string;
	};
	Webdav?: {
		path: string;
	};
	content?: EncryptedContent;
	encryption?: {
		iv: string;
		key: JsonWebKey;
	};
	hashes?: {
		sha256: string;
	};
	federation?: {
		mxcUri: string;
		mrid: string;
		serverName: string;
		mediaId: string;
	};
}

export interface IUploadWithUser extends IUpload {
	user?: Pick<IUser, '_id' | 'name' | 'username'>;
}

export interface IE2EEUpload extends IUpload {
	content: EncryptedContent;
}

export const isE2EEUpload = (upload: IUpload): upload is IE2EEUpload => Boolean(upload?.content?.ciphertext && upload?.content?.algorithm);
