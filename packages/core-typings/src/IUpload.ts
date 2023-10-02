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
}
