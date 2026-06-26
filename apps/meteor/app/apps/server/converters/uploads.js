import { Uploads } from '@rocket.chat/models';

import { transformMappedData } from './transformMappedData';
import { getURL } from '../../../utils/server/getURL';

export class AppUploadsConverter {
	constructor(orch) {
		this.orch = orch;
	}

	async convertById(id) {
		const upload = await Uploads.findOneById(id);

		return this.convertToApp(upload);
	}

	async convertToApp(upload) {
		if (!upload) {
			return undefined;
		}

		const map = {
			// `url`/`path` are no longer persisted on the upload; derive them from the file id+name,
			// matching the canonical /file-upload route. Declared before `id`/`name` so the source
			// fields are still present on the cloned data when these run.
			url: (upload) => {
				const relativePath = `/file-upload/${upload._id}/${encodeURIComponent(upload.name || '')}`;
				delete upload.url;
				return getURL(relativePath, { cdn: false, full: true });
			},
			path: (upload) => {
				const relativePath = `/file-upload/${upload._id}/${encodeURIComponent(upload.name || '')}`;
				delete upload.path;
				return relativePath;
			},
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
			token: 'token',
			updatedAt: '_updatedAt',
			uploadedAt: 'uploadedAt',
			room: async (upload) => {
				const result = await this.orch.getConverters().get('rooms').convertById(upload.rid);
				delete upload.rid;
				return result;
			},
			user: async (upload) => {
				if (!upload.userId) {
					return undefined;
				}

				const result = await this.orch.getConverters().get('users').convertById(upload.userId);
				delete upload.userId;
				return result;
			},
			visitor: async (upload) => {
				if (!upload.visitorToken) {
					return undefined;
				}

				const result = await this.orch.getConverters().get('visitors').convertByToken(upload.visitorToken);
				delete upload.visitorToken;
				return result;
			},
		};

		return transformMappedData(upload, map);
	}

	convertToRocketChat(upload) {
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
