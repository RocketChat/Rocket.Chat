import type { IUpload } from '@rocket.chat/core-typings';

import { RecordList } from './RecordList';

type FilesMessage = Omit<IUpload, 'rid'> & Required<Pick<IUpload, 'rid'>>;

export type ImagesListOptions = {
	roomId: Required<IUpload>['rid'];
	startingFromId?: string;
	count?: number;
	offset?: number;
};

const isFileMessageInRoom = (upload: IUpload, rid: IUpload['rid']): upload is FilesMessage => upload.rid === rid && 'rid' in upload;

export class ImagesList extends RecordList<IUpload> {
	public constructor(private _options: ImagesListOptions) {
		super();
	}

	public get options(): ImagesListOptions {
		return this._options;
	}

	public updateFilters(options: ImagesListOptions): void {
		this._options = options;
		this.clear();
	}

	protected filter(message: IUpload): boolean {
		const { roomId } = this._options;

		if (!isFileMessageInRoom(message, roomId)) {
			return false;
		}

		return true;
	}
}
