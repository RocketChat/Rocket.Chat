// TODO: Lib imports should not exists inside the raw models
import type { IUpload, RocketChatRecordDeleted, IRoom } from '@rocket.chat/core-typings';
import type { FindPaginated, IUploadsModel } from '@rocket.chat/model-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import type { Collection, FindCursor, Db, IndexDescription, WithId, Filter, FindOptions, UpdateResult } from 'mongodb';

import { BaseUploadModelRaw } from './BaseUploadModel';

export class UploadsRaw extends BaseUploadModelRaw implements IUploadsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IUpload>>) {
		super(db, 'uploads', trash);
	}

	protected override modelIndexes(): IndexDescription[] {
		return [
			...super.modelIndexes(),
			{ key: { uploadedAt: -1 } },
			{ key: { rid: 1, _hidden: 1, typeGroup: 1 } },
			{ key: { 'federation.mediaId': 1, 'federation.serverName': 1 }, unique: true, sparse: true },
		];
	}

	findNotHiddenFilesOfRoom(roomId: string, searchText: string, fileType: string, limit: number): FindCursor<IUpload> {
		const fileQuery = {
			rid: roomId,
			complete: true,
			uploading: false,
			_hidden: {
				$ne: true,
			},

			...(searchText && { name: { $regex: new RegExp(escapeRegExp(searchText), 'i') } }),
			...(fileType && fileType !== 'all' && { typeGroup: fileType }),
		};

		return this.find(fileQuery, {
			limit,
			sort: {
				uploadedAt: -1,
			},
			projection: {
				_id: 1,
				userId: 1,
				rid: 1,
				name: 1,
				description: 1,
				type: 1,
				url: 1,
				uploadedAt: 1,
				typeGroup: 1,
			},
		});
	}

	findByFederationMediaIdAndServerName(mediaId: string, serverName: string): Promise<IUpload | null> {
		return this.findOne({ 'federation.mediaId': mediaId, 'federation.serverName': serverName });
	}

	setFederationInfo(fileId: IUpload['_id'], info: Required<IUpload>['federation']): Promise<UpdateResult> {
		return this.updateOne({ _id: fileId }, { $set: { federation: info } });
	}

	findPaginatedWithoutThumbs(query: Filter<IUpload> = {}, options?: FindOptions<IUpload>): FindPaginated<FindCursor<WithId<IUpload>>> {
		return this.findPaginated(
			{
				typeGroup: { $ne: 'thumb' },
				...query,
				_hidden: { $ne: true },
			},
			options,
		);
	}

	findImagesByRoomId(
		rid: IRoom['_id'],
		uploadedAt?: Date,
		options: Omit<FindOptions<IUpload>, 'sort'> = {},
	): FindPaginated<FindCursor<WithId<IUpload>>> {
		return this.findPaginated(
			{
				rid,
				_hidden: { $ne: true },
				typeGroup: 'image',
				...(Boolean(uploadedAt) && {
					uploadedAt: {
						$lte: uploadedAt,
					},
				}),
			},
			{
				...options,
				sort: { uploadedAt: -1 },
			},
		);
	}
}
