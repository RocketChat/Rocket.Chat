import type { IUpload } from '@rocket.chat/core-typings';
import type { IUpload as IAppsUpload } from '@rocket.chat/apps-engine/definition/uploads';
import { Uploads } from '@rocket.chat/models';

import { transformMappedData } from './transformMappedData';

interface IConverters {
	get(name: 'rooms'): { convertById(id: string): Promise<IAppsUpload['room']| undefined> };
	get(name: 'users'): { convertById(id: string): Promise<IAppsUpload['user']| undefined> };
	get(name: 'visitors'): { convertByToken(token: string): Promise<IAppsUpload['visitor']| undefined> };
}

interface IOrchestrator {
	getConverters(): IConverters;
}

type AppUploadWithUnmapped = IAppsUpload & { _unmappedProperties_?: Partial<IUpload> };
type IUploadWithVisitorToken = IUpload & { visitorToken?: string };
type IAppsUploadWithDescription = IAppsUpload & { description?: string };              

export class AppUploadsConverter {
	private orch: IOrchestrator;

	constructor(orch: IOrchestrator) {
		this.orch = orch;
	}

	async convertById(id: string): Promise<IAppsUpload | undefined> {
		const upload = await Uploads.findOneById(id);

		return this.convertToApp(upload ?? undefined);
	}

	async convertToApp(upload: IUpload | undefined): Promise<IAppsUpload | undefined> {
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
					throw new Error('Invalid upload payload: missing rid');
				}
				const result = await this.orch.getConverters().get('rooms').convertById(upload.rid);
				delete (upload as Partial<IUpload>).rid;              
				return result;
			},
			user: async (upload: IUpload) => {
				if (!upload.userId) {
					return undefined;
				}

				const result = await this.orch.getConverters().get('users').convertById(upload.userId);
				delete (upload as Partial<IUpload>).userId;           
				return result;
			},
			visitor: async (upload: IUpload) => {
				const uploadWithToken = upload as IUploadWithVisitorToken;
				if (!uploadWithToken.visitorToken) {
					return undefined;
				}
				const result = await this.orch.getConverters().get('visitors').convertByToken(uploadWithToken.visitorToken);
				delete (upload as IUploadWithVisitorToken).visitorToken;
				return result;
			},
		};

		return transformMappedData(upload, map) as unknown as IAppsUpload;
	}

	convertToRocketChat(upload: IAppsUpload | undefined): IUpload | undefined {
		if (!upload) {
			return undefined;
		}

		const rid = upload.room?.id;
		if (!rid) {
			throw new Error('Invalid app upload payload: missing room.id');
		}

		const { id: userId } = upload.user ?? {};
		const { token: visitorToken } = upload.visitor ?? {};

		const newUpload: Record<string, unknown> = {
			_id: upload.id,
			name: upload.name,
			size: upload.size as unknown as number,
			type: upload.type,
			extension: upload.extension,
			description: (upload as IAppsUploadWithDescription).description,
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

		return Object.assign(newUpload, (upload as AppUploadWithUnmapped)._unmappedProperties_) as IUpload;
	}
}