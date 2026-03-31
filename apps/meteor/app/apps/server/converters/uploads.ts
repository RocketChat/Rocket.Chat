import type { IUpload } from '@rocket.chat/core-typings';
import type { IUpload as IAppsUpload } from '@rocket.chat/apps-engine/definition/uploads';
import { Uploads } from '@rocket.chat/models';

import { transformMappedData } from './transformMappedData';

export class AppUploadsConverter {
	private orch: any;

	constructor(orch: any) {
		this.orch = orch;
	}

	async convertById(id: string): Promise<IAppsUpload | undefined> {
		const upload = await Uploads.findOneById(id);

		return this.convertToApp(upload);
	}

	async convertToApp(upload: any): Promise<IAppsUpload | undefined> {
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
			room: async (upload: any) => {
				const result = await this.orch.getConverters().get('rooms').convertById(upload.rid);
				delete upload.rid;
				return result;
			},
			user: async (upload: any) => {
				if (!upload.userId) {
					return undefined;
				}

				const result = await this.orch.getConverters().get('users').convertById(upload.userId);
				delete upload.userId;
				return result;
			},
			visitor: async (upload: any) => {
				if (!upload.visitorToken) {
					return undefined;
				}

				const result = await this.orch.getConverters().get('visitors').convertByToken(upload.visitorToken);
				delete upload.visitorToken;
				return result;
			},
		};

		return transformMappedData(upload, map) as unknown as IAppsUpload;
	}

	convertToRocketChat(upload: any): IUpload | undefined {
		if (!upload) {
			return undefined;
		}

		const { id: userId } = upload.user || {};
		const { token: visitorToken } = upload.visitor || {};
		const { id: rid } = (upload.room || {}) as any;

		const newUpload: any = {
			_id: upload.id,
			name: upload.name,
			size: upload.size,
			type: upload.type,
			extension: upload.extension,
			description: upload.description,
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

		return Object.assign(newUpload, (upload as any)._unmappedProperties_) as IUpload;
	}
} 
