import type { IUpload, RocketChatRecordDeleted, IRoom } from '@rocket.chat/core-typings';
import type {
	FindPaginated,
	IUploadsModel,
	DocumentWithProjection,
	FindOptionsWithProjection,
	UploadHistoryVisibility,
} from '@rocket.chat/model-typings';
import type { Collection, FindCursor, Db, IndexDescription, WithId, Filter, FindOptions, UpdateResult, Document } from 'mongodb';

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

	findByFederationMediaIdAndServerName(mediaId: string, serverName: string): Promise<IUpload | null> {
		return this.findOne({ 'federation.mediaId': mediaId, 'federation.serverName': serverName });
	}

	setFederationInfo(fileId: IUpload['_id'], info: Required<IUpload>['federation']): Promise<UpdateResult> {
		return this.updateOne({ _id: fileId }, { $set: { federation: info } });
	}

	setFederationRoomInfo(fileId: IUpload['_id'], rid: IRoom['_id'], mrid: string): Promise<UpdateResult> {
		return this.updateOne({ _id: fileId }, { $set: { rid, 'federation.mrid': mrid } });
	}

	private filterVisibleTo({ since, hiddenFileIds, followedFileIds }: UploadHistoryVisibility): Filter<IUpload> {
		return {
			$or: [
				{ uploadedAt: { $gte: since }, _id: { $nin: hiddenFileIds } },
				...(followedFileIds.length ? [{ _id: { $in: followedFileIds } }] : []),
			],
		};
	}

	findPaginatedWithoutThumbs(
		query: Filter<IUpload> = {},
		options?: FindOptions<IUpload>,
		visibility?: UploadHistoryVisibility,
	): FindPaginated<FindCursor<WithId<IUpload>>> {
		return this.findPaginated(
			{
				typeGroup: { $ne: 'thumb' },
				...query,
				_hidden: { $ne: true },
				...(visibility && { $and: [this.filterVisibleTo(visibility)] }),
			},
			options,
		);
	}

	findImagesByRoomId(
		rid: IRoom['_id'],
		uploadedAt?: Date,
		options: Omit<FindOptions<IUpload>, 'sort'> = {},
		visibility?: UploadHistoryVisibility,
	): FindPaginated<FindCursor<WithId<IUpload>>> {
		return this.findPaginated(
			{
				rid,
				_hidden: { $ne: true },
				typeGroup: 'image',
				...(uploadedAt && { uploadedAt: { $lte: uploadedAt } }),
				...(visibility && { $and: [this.filterVisibleTo(visibility)] }),
			},
			{
				...options,
				sort: { uploadedAt: -1 },
			},
		);
	}

	findAllByOriginalFileId<T extends Document = IUpload, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		originalFileId: string,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>> {
		return this.find<T, O>({ originalFileId }, options);
	}
}
