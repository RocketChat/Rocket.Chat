import { Upload } from '@rocket.chat/core-services';
import { ajv, ajvQuery } from '@rocket.chat/rest-typings';

import type { ClientRouter } from './_shared';
import { isMatrixErrorProps, license, tags } from './_shared';
import { MatrixMediaService } from '../../../services/MatrixMediaService';
import { isAppServiceAuthenticatedMiddleware } from '../../middlewares/isAppServiceAuthenticated';

const MediaParamsSchema = {
	type: 'object',
	properties: {
		serverName: { type: 'string' },
		mediaId: { type: 'string' },
	},
	required: ['serverName', 'mediaId'],
};

const isMediaParamsProps = ajv.compile(MediaParamsSchema);

const ThumbnailQuerySchema = {
	type: 'object',
	properties: {
		width: { oneOf: [{ type: 'number' }, { type: 'string' }] },
		height: { oneOf: [{ type: 'number' }, { type: 'string' }] },
		method: { type: 'string', enum: ['crop', 'scale'] },
		timeout_ms: { oneOf: [{ type: 'number' }, { type: 'string' }] },
	},
};

const isThumbnailQueryProps = ajvQuery.compile<{
	width?: number | string;
	height?: number | string;
	method?: 'crop' | 'scale';
	timeout_ms?: number | string;
}>(ThumbnailQuerySchema);

const BufferResponseSchema = {
	type: 'object',
	description: 'multipart/mixed response',
	additionalProperties: true,
};

const isBufferResponseProps = ajv.compile(BufferResponseSchema);

const ConfigResponseSchema = {
	type: 'object',
	properties: {
		'm.upload.size': { type: 'number' },
	},
	additionalProperties: true,
};

const isConfigResponseProps = ajv.compile(ConfigResponseSchema);

const SECURITY_HEADERS = {
	'X-Content-Type-Options': 'nosniff',
	'X-Frame-Options': 'DENY',
	'Content-Security-Policy': "default-src 'none'; img-src 'self'; media-src 'self'",
	'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

// Builds an RFC 5987-compliant Content-Disposition header. Always emits the
// ASCII-safe `filename=` for legacy clients and additionally emits
// `filename*=UTF-8''…` when the name contains non-ASCII characters.
function contentDispositionHeader(disposition: 'inline' | 'attachment', fileName: string): string {
	const asciiFallback = fileName.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_');
	const isAscii = asciiFallback === fileName;
	if (isAscii) {
		return `${disposition}; filename="${asciiFallback}"`;
	}
	return `${disposition}; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

// MSC3916 says authenticated media downloads should be multipart/mixed, but the
// matrix-bot-sdk used by appservice bridges (e.g. matrix-bifrost) doesn't parse
// that envelope — it just streams the response body straight through to the
// downstream client, which then sees raw multipart text. To stay compatible
// with those bridges, we serve raw bytes here, same as the legacy
// /_matrix/media/v3/download endpoint.
export const addClientMediaRoutes = (router: ClientRouter) => {
	router
		// GET /_matrix/client/v1/media/download/:serverName/:mediaId
		.get(
			'/v1/media/download/:serverName/:mediaId',
			{
				params: isMediaParamsProps,
				response: {
					200: isBufferResponseProps,
					401: isMatrixErrorProps,
					404: isMatrixErrorProps,
					500: isMatrixErrorProps,
				},
				tags,
				license,
			},
			isAppServiceAuthenticatedMiddleware(),
			async (c) => {
				try {
					const serverName = c.req.param('serverName') ?? '';
					const mediaId = c.req.param('mediaId') ?? '';

					const file = await MatrixMediaService.getLocalFileForMatrixNode(mediaId, serverName);
					if (!file) {
						return {
							statusCode: 404,
							body: { errcode: 'M_NOT_FOUND', error: 'Media not found' },
						};
					}

					const buffer = await MatrixMediaService.getLocalFileBuffer(file);
					const mimeType = file.type || 'application/octet-stream';
					const fileName = file.name || mediaId;

					return {
						statusCode: 200,
						headers: {
							...SECURITY_HEADERS,
							'content-type': mimeType,
							'content-length': String(buffer.length),
							'content-disposition': contentDispositionHeader('attachment', fileName),
						},
						body: buffer,
					};
				} catch (error) {
					return {
						statusCode: 500,
						body: { errcode: 'M_UNKNOWN', error: 'Internal server error' },
					};
				}
			},
		)

		// GET /_matrix/client/v1/media/thumbnail/:serverName/:mediaId
		.get(
			'/v1/media/thumbnail/:serverName/:mediaId',
			{
				params: isMediaParamsProps,
				query: isThumbnailQueryProps,
				response: {
					200: isBufferResponseProps,
					400: isMatrixErrorProps,
					401: isMatrixErrorProps,
					404: isMatrixErrorProps,
					500: isMatrixErrorProps,
				},
				tags,
				license,
			},
			isAppServiceAuthenticatedMiddleware(),
			async (c) => {
				try {
					const serverName = c.req.param('serverName') ?? '';
					const mediaId = c.req.param('mediaId') ?? '';
					const width = Number(c.req.query('width'));
					const height = Number(c.req.query('height'));

					if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
						return {
							statusCode: 400,
							body: { errcode: 'M_BAD_REQUEST', error: 'Invalid width or height' },
						};
					}

					const file = await MatrixMediaService.getLocalFileForMatrixNode(mediaId, serverName);
					if (!file) {
						return {
							statusCode: 404,
							body: { errcode: 'M_NOT_FOUND', error: 'Media not found' },
						};
					}

					if (!file.type?.startsWith('image/')) {
						return {
							statusCode: 400,
							body: { errcode: 'M_BAD_REQUEST', error: 'Thumbnails are only supported for images' },
						};
					}

					const stream = await Upload.streamUploadedFile({ file, imageResizeOpts: { width, height } });

					const chunks: Buffer[] = [];
					for await (const chunk of stream) {
						chunks.push(chunk as Buffer);
					}
					const buffer = Buffer.concat(chunks);

					const mimeType = file.type || 'image/jpeg';
					const fileName = file.name || mediaId;

					return {
						statusCode: 200,
						headers: {
							...SECURITY_HEADERS,
							'content-type': mimeType,
							'content-length': String(buffer.length),
							'content-disposition': contentDispositionHeader('inline', fileName),
						},
						body: buffer,
					};
				} catch (error) {
					return {
						statusCode: 500,
						body: { errcode: 'M_UNKNOWN', error: 'Internal server error' },
					};
				}
			},
		)

		// GET /_matrix/client/v1/media/config
		.get(
			'/v1/media/config',
			{
				response: {
					200: isConfigResponseProps,
					401: isMatrixErrorProps,
				},
				tags,
				license,
			},
			isAppServiceAuthenticatedMiddleware(),
			async () => {
				return {
					statusCode: 200,
					body: {
						'm.upload.size': 50 * 1024 * 1024,
					},
				};
			},
		);
};
