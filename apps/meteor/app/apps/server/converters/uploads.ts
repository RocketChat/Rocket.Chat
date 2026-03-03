import type { IAppServerOrchestrator, IAppsUpload, IAppUploadsConverter } from '@rocket.chat/apps';
import type { IUploadDetails } from '@rocket.chat/apps-engine/definition/uploads/IUploadDetails';
import type { IUpload } from '@rocket.chat/core-typings';
import { Uploads } from '@rocket.chat/models';

import { transformMappedData } from './transformMappedData';

export class AppUploadsConverter implements IAppUploadsConverter {
	constructor(public orch: IAppServerOrchestrator) {}

	async convertById(uploadId: string): Promise<IAppsUpload | undefined> {
		const upload = await Uploads.findOneById(uploadId);

		return this.convertToApp(upload);
	}

	convertToApp(upload: undefined | null): Promise<undefined>;

	convertToApp(upload: IUpload): Promise<IAppsUpload>;

	convertToApp(upload: IUpload | undefined | null): Promise<IAppsUpload | undefined>;

	async convertToApp(upload: IUpload | undefined | null): Promise<IAppsUpload | undefined> {
		if (!upload) {
			return undefined;
		}

		const map = {
			id: '_id',
			name: 'name',
			size: 'size',
			type: 'type',
			store: 'store',
			description: 'description',
			complete: 'complete',
			uploading: 'uploading',
			extension: 'extension',
			progress: 'progress',
			etag: 'etag',
			path: 'path',
			token: 'token',
			url: 'url',
			updatedAt: '_updatedAt',
			uploadedAt: 'uploadedAt',
			room: async (upload: IUpload) => {
				const result = await this.orch.getConverters().get('rooms').convertById(upload.rid!);
				delete upload.rid;
				return result!;
			},
			user: async (upload: IUpload) => {
				if (!upload.userId) {
					return undefined;
				}

				const result = await this.orch.getConverters().get('users').convertById(upload.userId);
				delete upload.userId;
				return result;
			},
			visitor: async (upload: IUpload) => {
				if (!(upload as IUploadDetails).visitorToken) {
					return undefined;
				}

				const result = await this.orch
					.getConverters()
					.get('visitors')
					.convertByToken((upload as IUploadDetails).visitorToken!);
				delete (upload as IUploadDetails).visitorToken;
				return result;
			},
		};

		return transformMappedData(upload, map);
	}

	convertToRocketChat(upload: undefined | null): undefined;

	convertToRocketChat(upload: IAppsUpload): IUpload;

	convertToRocketChat(upload: IAppsUpload | undefined | null): IUpload | undefined;

	convertToRocketChat(upload: IAppsUpload | undefined | null): IUpload | undefined {
		if (!upload) {
			return undefined;
		}

		const { id: userId } = upload.user || {};
		const { token: visitorToken } = upload.visitor || {};
		const { id: rid } = upload.room;

		const newUpload: IUpload = {
			_id: upload.id,
			name: upload.name,
			size: Number(upload.size),
			type: upload.type,
			extension: upload.extension,
			description: (upload as any).description,
			store: upload.store,
			etag: upload.etag,
			complete: upload.complete,
			uploading: upload.uploading,
			progress: upload.progress,
			token: upload.token,
			url: upload.url,
			...{ _updatedAt: upload.updatedAt }, // FIXME
			uploadedAt: upload.uploadedAt,
			rid,
			userId,
			...{ visitorToken }, // FIXME
		};

		return Object.assign(newUpload, (upload as { _unmappedProperties_?: unknown })._unmappedProperties_);
	}
}
