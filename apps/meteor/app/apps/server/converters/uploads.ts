import { transformMappedData } from '../../lib/misc/transformMappedData';
import { Uploads } from '../../../models/server/raw';
import { AppServerOrchestrator } from '../orchestrator';

import type { IUpload } from '@rocket.chat/core-typings';

export class AppUploadsConverter {
	orch: AppServerOrchestrator;

	constructor(orch: AppServerOrchestrator) {
		this.orch = orch;
	}

	convertById(id: string) {
		const upload = Promise.await(Uploads.findOneById(id));

		return this.convertToApp(upload);
	}

	convertToApp(upload: IUpload) {
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
			room: (upload: IUpload) => {
				const result = this.orch.getConverters()?.get('rooms').convertById(upload.rid);
				delete upload.rid;
				return result;
			},
			user: (upload: IUpload) => {
				if (!upload.userId) {
					return undefined;
				}

				const result = this.orch.getConverters()?.get('users').convertById(upload.userId);
				delete upload.userId;
				return result;
			},
			visitor: (upload: IUpload) => {
				if (!upload.visitorToken) {
					return undefined;
				}

				const result = this.orch.getConverters()?.get('visitors').convertByToken(upload.visitorToken);
				delete upload.visitorToken;
				return result;
			},
		};

		return transformMappedData(upload, map);
	}

	convertToRocketChat(upload: IUpload) {
		if (!upload) {
			return undefined;
		}

		const { id: userId } = upload.user || {};
		const { token: visitorToken } = upload.visitor || {};
		const { id: rid } = upload.room;

		const newUpload = {
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

		return Object.assign(newUpload, upload._unmappedProperties_);
	}
}
