import crypto from 'crypto';

import { Router } from '@rocket.chat/http-router';
import { ajv } from '@rocket.chat/rest-typings/dist/v1/Ajv';

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
					response: {
						200: isUploadResponseProps,
						401: isMatrixErrorProps,
						501: isMatrixErrorProps,
					},
					tags,
					license,
				},
				isAppServiceAuthenticatedMiddleware(),
				async () => {
					// TODO: integrate with Rocket.Chat upload pipeline (FileUpload + MatrixMediaService.generateMXCUri)
					return {
						statusCode: 501,
						body: {
							errcode: 'M_UNRECOGNIZED',
							error: 'AS media upload not yet implemented',
						},
					};
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
					params: isDownloadParamsProps,
					response: {
						200: isBufferResponseProps,
						401: isMatrixErrorProps,
						501: isMatrixErrorProps,
					},
					tags,
					license,
				},
				isAppServiceAuthenticatedMiddleware(),
				async () => {
					return {
						statusCode: 501,
						body: {
							errcode: 'M_UNRECOGNIZED',
							error: 'Media thumbnail not yet implemented',
						},
					};
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
