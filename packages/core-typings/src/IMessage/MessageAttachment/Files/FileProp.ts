import type { IUpload } from '../../../IUpload';

export type FileProp = {
	_id: IUpload['_id'];
	name: string;
	type: string;
	format: string;
	size: number;
};
