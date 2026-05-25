import crypto from 'crypto';

import { Upload } from '@rocket.chat/core-services';
import { Router } from '@rocket.chat/http-router';
import { Users } from '@rocket.chat/models';
import { ajv, ajvQuery } from '@rocket.chat/rest-typings';

import { MatrixMediaService } from '../../services/MatrixMediaService';
import { isAppServiceAuthenticatedMiddleware } from '../middlewares/isAppServiceAuthenticated';

const MatrixErrorSchema = {
	type: 'object',
	properties: {
		errcode: { type: 'string' },
		error: { type: 'string' },
	},
	required: ['errcode', 'error'],
};

const isMatrixErrorProps = ajv.compile(MatrixErrorSchema);

const UploadResponseSchema = {
	type: 'object',
	properties: {
		content_uri: { type: 'string' },
	},
	required: ['content_uri'],
};

const isUploadResponseProps = ajv.compile(UploadResponseSchema);

const UploadQuerySchema = {
	type: 'object',
	properties: {
		filename: { type: 'string' },
		user_id: { type: 'string' },
		access_token: { type: 'string' },
	},
};

const isUploadQueryProps = ajvQuery.compile<{
	filename?: string;
	user_id?: string;
	access_token?: string;
}>(UploadQuerySchema);

const ThumbnailParamsSchema = {
	type: 'object',
	properties: {
		serverName: { type: 'string' },
		mediaId: { type: 'string' },
	},
	required: ['serverName', 'mediaId'],
};

const isThumbnailParamsProps = ajv.compile(ThumbnailParamsSchema);

const ThumbnailQuerySchema = {
	type: 'object',
	properties: {
		width: { oneOf: [{ type: 'number' }, { type: 'string' }] },
		height: { oneOf: [{ type: 'number' }, { type: 'string' }] },
		method: { type: 'string', enum: ['crop', 'scale'] },
		access_token: { type: 'string' },
	},
};

const isThumbnailQueryProps = ajvQuery.compile<{
	width?: number | string;
	height?: number | string;
	method?: 'crop' | 'scale';
	access_token?: string;
}>(ThumbnailQuerySchema);

const DownloadParamsSchema = {
	type: 'object',
	properties: {
		serverName: { type: 'string' },
		mediaId: { type: 'string' },
	},
	required: ['serverName', 'mediaId'],
};

const isDownloadParamsProps = ajv.compile(DownloadParamsSchema);

const BufferResponseSchema = {
	type: 'object',
	description: 'Raw file buffer or multipart response',
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

function createMultipartResponse(
	buffer: Buffer,
	mimeType: string,
	fileName: string,
	metadata: Record<string, unknown> = {},
): { body: Buffer; contentType: string } {
	const boundary = crypto.randomBytes(16).toString('hex');
	const parts: string[] = [];

	parts.push(`--${boundary}`, 'Content-Type: application/json', '', JSON.stringify(metadata));
	parts.push(`--${boundary}`, `Content-Type: ${mimeType}`, `Content-Disposition: attachment; filename="${fileName}"`, '');

	const headerBuffer = Buffer.from(`${parts.join('\r\n')}\r\n`);
	const endBoundary = Buffer.from(`\r\n--${boundary}--\r\n`);

	return {
		body: Buffer.concat([headerBuffer, buffer, endBoundary]),
		contentType: `multipart/mixed; boundary=${boundary}`,
	};
}

const tags = ['Federation', 'Media'];
const license: ['federation'] = ['federation'];

export const getMatrixMediaBridgeRoutes = () => {
	return (
		new Router('/media')

			// POST /_matrix/media/v3/upload
			.post(
				'/v3/upload',
				{
					query: isUploadQueryProps,
					response: {
						200: isUploadResponseProps,
						400: isMatrixErrorProps,
						401: isMatrixErrorProps,
						413: isMatrixErrorProps,
						500: isMatrixErrorProps,
					},
					tags,
					license,
				},
				isAppServiceAuthenticatedMiddleware(),
				async (c) => {
					try {
						const senderId = c.get('impersonatedUserId') as string;
						const fileName = c.req.query('filename') || `upload-${Date.now()}`;
						const mimeType = c.req.header('content-type') || 'application/octet-stream';

						const user = await Users.findOneByUsername(senderId, { projection: { _id: 1 } });
						if (!user) {
							return {
								statusCode: 401,
								body: {
									errcode: 'M_UNKNOWN_TOKEN',
									error: 'Impersonated user not found',
								},
							};
						}

						const arrayBuffer = await c.req.raw.arrayBuffer();
						if (!arrayBuffer.byteLength) {
							return {
								statusCode: 400,
								body: {
									errcode: 'M_BAD_REQUEST',
									error: 'Empty upload body',
								},
							};
						}

						const buffer = Buffer.from(arrayBuffer);

						const { mxcUri } = await MatrixMediaService.uploadFromAppService({
							buffer,
							fileName,
							mimeType,
							userId: user._id,
						});

						return {
							statusCode: 200,
							body: { content_uri: mxcUri },
						};
					} catch (error) {
						return {
							statusCode: 500,
							body: {
								errcode: 'M_UNKNOWN',
								error: 'Failed to upload media',
							},
						};
					}
				},
			)

			// GET /_matrix/media/v3/download/:serverName/:mediaId
			.get(
				'/v3/download/:serverName/:mediaId',
				{
					params: isDownloadParamsProps,
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
						const multipartResponse = createMultipartResponse(buffer, mimeType, fileName);

						return {
							statusCode: 200,
							headers: {
								...SECURITY_HEADERS,
								'content-type': multipartResponse.contentType,
								'content-length': String(multipartResponse.body.length),
							},
							body: multipartResponse.body,
						};
					} catch (error) {
						return {
							statusCode: 500,
							body: { errcode: 'M_UNKNOWN', error: 'Internal server error' },
						};
					}
				},
			)

			// GET /_matrix/media/v3/thumbnail/:serverName/:mediaId
			.get(
				'/v3/thumbnail/:serverName/:mediaId',
				{
					params: isThumbnailParamsProps,
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
						const multipartResponse = createMultipartResponse(buffer, mimeType, fileName);

						return {
							statusCode: 200,
							headers: {
								...SECURITY_HEADERS,
								'content-type': multipartResponse.contentType,
								'content-length': String(multipartResponse.body.length),
							},
							body: multipartResponse.body,
						};
					} catch (error) {
						return {
							statusCode: 500,
							body: { errcode: 'M_UNKNOWN', error: 'Internal server error' },
						};
					}
				},
			)

			// GET /_matrix/media/r0/config (literal r0; matrix-bot-sdk hardcodes this path)
			.get(
				'/r0/config',
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
			)
	);
};
