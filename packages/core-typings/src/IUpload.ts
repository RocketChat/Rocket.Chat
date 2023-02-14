import type { IRocketChatRecord } from './IRocketChatRecord';

export interface IUpload extends IRocketChatRecord {
	typeGroup?: string;
	description?: string;
	type?: string;
	name: string;
	aliases?: string;
	extension?: string;
	complete?: boolean;
	rid?: string;
	uploading?: boolean;
	userId?: string;
	progress?: number;
	etag?: string;
	size?: number;
	identify?: {
		size: {
			width: number;
			height: number;
		};
	};
}
