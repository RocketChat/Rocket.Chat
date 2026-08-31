export type FileProp = {
	_id: string;
	name: string;
	type: string;
	format: string;
	size: number;
	// used to filter out thumbnails in email notifications
	// may not exist in old messages
	typeGroup?: string;
};
