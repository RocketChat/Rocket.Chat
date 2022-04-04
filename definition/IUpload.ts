import { IRocketChatRecord } from './IRocketChatRecord';

export interface IUpload extends IRocketChatRecord {
	typeGroup?: string;
	type?: string;
	name: string;
	aliases?: string;
	extension?: string;
	complete?: boolean;
	uploading?: boolean;
	progress?: number;
}
