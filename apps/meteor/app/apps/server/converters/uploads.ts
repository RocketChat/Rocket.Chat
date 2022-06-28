import type { IRoom, IUser, IVisitor, IUpload } from '@rocket.chat/core-typings';
import { IUpload as IUploadFromAppsEngine } from '@rocket.chat/apps-engine/definition/uploads';
import { Uploads } from '@rocket.chat/models';

import { transformMappedData } from '../../lib/misc/transformMappedData';
import { AppServerOrchestrator } from '../orchestrator';

export class AppUploadsConverter {
	orch: AppServerOrchestrator;

	constructor(orch: AppServerOrchestrator) {
		this.orch = orch;
	}

	convertById(id: string):
		| (IUploadFromAppsEngine & {
				_unmappedProperties_: unknown;
		  })
		| undefined {
		const upload = Promise.await(Uploads.findOneById(id));

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		return this.convertToApp(upload!);
	}

	convertToApp(upload: IUpload):
		| (IUploadFromAppsEngine & {
				_unmappedProperties_: unknown;
		  })
		| undefined {
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
			room: (upload: IRoom): unknown => {
				const result = this.orch.getConverters()?.get('rooms').convertById(upload._id);
				delete (upload as any)._id;
				return result;
			},
			user: (upload: IUser): unknown => {
				if (!upload._id) {
					return undefined;
				}

				const result = this.orch.getConverters()?.get('users').convertById(upload._id);
				delete (upload as any)._id;
				return result;
			},
			visitor: (upload: IVisitor): unknown => {
				if (!upload.token) {
					return undefined;
				}

				const result = this.orch.getConverters()?.get('visitors').convertByToken(upload.token);
				delete (upload as any).token;
				return result;
			},
		};

		return transformMappedData(upload, map) as any;
	}

	convertToRocketChat(upload: IUploadFromAppsEngine): IUpload | undefined {
		if (!upload) {
			return undefined;
		}

		const { id: userId } = upload.user || {};
		const { token: visitorToken } = upload.visitor || {};
		const { id: rid } = upload.room;

		return {
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
			...(upload as any)._unmappedProperties_,
		};
	}
}
