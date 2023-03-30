export type IFile = {
	_id: string;
	name: string;
	store?: string;
	size: number;
	extension: string;
	type: string;
	complete: boolean;
	etag: string;
	path?: string;
	progress: number;
	token: string;
	uploading: boolean;
	uploadedAt: Date;
	modifiedAt?: Date;
	url?: string;
	originalStore?: string;
	originalId?: string;
};
