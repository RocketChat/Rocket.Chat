import type { IAppServerOrchestrator, IAppsUpload } from '@rocket.chat/apps';
import type { IUpload } from '@rocket.chat/core-typings';
import * as z from 'zod';

import { mappedDecodeAsync } from './mappedData';
import { getURL } from '../../../../../server/lib/utils/getURL';

/**
 * Rocket.Chat `IUpload` <-> Apps-Engine `IAppsUpload`.
 *
 * Cross-converter dependent, so it is built via a factory closing over the orchestrator. `decode`
 * (async) mirrors the legacy `convertToApp`: a field rename plus room/user/visitor resolved through
 * their converters, with an `_unmappedProperties_` bucket. `encode` mirrors `convertToRocketChat`.
 */
export function createUploadsCodec(orch: IAppServerOrchestrator) {
	return z.codec(z.custom<IUpload>(), z.custom<IAppsUpload>(), {
		decode: async (upload): Promise<IAppsUpload> => {
			const map = {
				// `url`/`path` are no longer persisted on the upload; derive them from the file id+name,
				// matching the canonical /file-upload route. Declared before `id`/`name` so the source
				// fields are still present on the cloned data when these run.
				url: (upload: Record<string, any>) => {
					const relativePath = `/file-upload/${upload._id}/${encodeURIComponent(upload.name || '')}`;
					delete upload.url;
					return getURL(relativePath, { cdn: false, full: true });
				},
				path: (upload: Record<string, any>) => {
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
				room: async (upload: Record<string, any>) => {
					const result = await orch
						.getConverters()
						.get('rooms')
						.convertById(upload.rid as string);
					delete upload.rid;
					return result;
				},
				user: async (upload: Record<string, any>) => {
					if (!upload.userId) {
						return undefined;
					}

					const result = await orch.getConverters().get('users').convertById(upload.userId);
					delete upload.userId;
					return result;
				},
				visitor: async (upload: Record<string, any>) => {
					const { visitorToken } = upload;
					if (!visitorToken) {
						return undefined;
					}

					const result = await orch.getConverters().get('visitors').convertByToken(visitorToken);
					delete upload.visitorToken;
					return result;
				},
			};

			return mappedDecodeAsync<IAppsUpload>(upload, map);
		},
		encode: (upload): IUpload => {
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
		},
	});
}
