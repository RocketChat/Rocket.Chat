import type { IUpload } from '@rocket.chat/core-typings';

import { RecordList } from './RecordList';

type FilesMessage = Omit<IUpload, 'rid'> & Required<Pick<IUpload, 'rid'>>;

export type FilesListOptions = {
	rid: Required<IUpload>['rid'];
	type: string;
	text: string;
};

const isFileMessageInRoom = (upload: IUpload, rid: IUpload['rid']): upload is FilesMessage => upload.rid === rid && 'rid' in upload;

export class FilesList extends RecordList<IUpload> {
	public constructor(private _options: FilesListOptions) {
		super();
	}

	public get options(): FilesListOptions {
		return this._options;
	}

	public updateFilters(options: FilesListOptions): void {
		this._options = options;
		this.clear();
	}

	protected filter(message: IUpload): boolean {
		const { rid } = this._options;

		if (!isFileMessageInRoom(message, rid)) {
			return false;
		}

		return true;
	}
}
