import type { IAppServerOrchestrator, IAppUploadsConverter, IAppsUpload } from '@rocket.chat/apps';
import type { IUpload } from '@rocket.chat/core-typings';
import { Uploads } from '@rocket.chat/models';

import { transformMappedData } from './transformMappedData';

export class AppUploadsConverter implements IAppUploadsConverter {
	constructor(protected readonly orch: IAppServerOrchestrator) {
		this.orch = orch;
	}

	async convertById(id: string): Promise<IAppsUpload | undefined> {
		const upload = await Uploads.findOneById(id);

		return this.convertToApp(upload);
	}

	async convertToApp(upload: undefined | null): Promise<undefined>;

	async convertToApp(upload: IUpload): Promise<IAppsUpload>;

	async convertToApp(upload: IUpload | undefined | null): Promise<IAppsUpload | undefined>;

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
				if (!upload.rid) {
					return undefined;
				}

				const result = await this.orch.getConverters().get('rooms').convertById(upload.rid);
				delete (upload as { rid?: string }).rid;
				return result;
			},
			user: async (upload: IUpload) => {
				if (!upload.userId) {
					return undefined;
				}

				const result = await this.orch.getConverters().get('users').convertById(upload.userId);
				delete (upload as { userId?: string }).userId;
				return result;
			},
			visitor: async (upload: IUpload) => {
				const { visitorToken } = upload as { visitorToken?: string };
				if (!visitorToken) {
					return undefined;
				}

				const result = await this.orch.getConverters().get('visitors').convertByToken(visitorToken);
				delete (upload as { visitorToken?: string }).visitorToken;
				return result;
			},
		} as const;

		return transformMappedData(upload, map) as unknown as Promise<IAppsUpload>;
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
		const { id: rid } = upload.room || {};

		const newUpload = {
			_id: upload.id,
			name: upload.name,
			size: upload.size,
			type: upload.type,
			extension: upload.extension,
			description: (upload as { description?: string }).description,
			store: upload.store,
			etag: upload.etag,
			complete: upload.complete,
			uploading: upload.uploading,
			progress: upload.progress,
			token: upload.token,
			url: upload.url,
			_updatedAt: upload.updatedAt,
			uploadedAt: upload.uploadedAt,
			rid,
			userId,
			visitorToken,
		};

		return Object.assign(
			newUpload,
			(upload as { _unmappedProperties_?: Record<string, unknown> })._unmappedProperties_,
		) as unknown as IUpload;
	}
}
