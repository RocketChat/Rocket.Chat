import crypto from 'crypto';

import type { IUpload } from '@rocket.chat/core-typings';
import { federationSDK } from '@rocket.chat/federation-sdk';
import { Router } from '@rocket.chat/http-router';
import { ajv } from '@rocket.chat/rest-typings/dist/v1/Ajv';

import { MatrixMediaService } from '../../services/MatrixMediaService';
import { canAccessResourceMiddleware } from '../middlewares/canAccessResource';

const MediaDownloadParamsSchema = {
	type: 'object',
	properties: {
		mediaId: { type: 'string' },
	},
	required: ['mediaId'],
	additionalProperties: false,
};

const ErrorResponseSchema = {
	type: 'object',
	properties: {
		errcode: { type: 'string' },
		error: { type: 'string' },
	},
	required: ['errcode', 'error'],
};

const BufferResponseSchema = {
	type: 'object',
	description: 'Raw file buffer or multipart response',
};

const isMediaDownloadParamsProps = ajv.compile(MediaDownloadParamsSchema);
const isErrorResponseProps = ajv.compile(ErrorResponseSchema);
const isBufferResponseProps = ajv.compile(BufferResponseSchema);

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
	metadata: Record<string, any> = {},
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

async function getMediaFile(mediaId: string, serverName: string): Promise<{ file: IUpload; buffer: Buffer } | null> {
	const file = await MatrixMediaService.getLocalFileForMatrixNode(mediaId, serverName);
	if (!file) {
		return null;
	}

	const buffer = await MatrixMediaService.getLocalFileBuffer(file);
	return { file, buffer };
}

export const getMatrixMediaRoutes = () => {
	return new Router('/federation')
		.get(
			'/v1/media/download/:mediaId',
			{
				params: isMediaDownloadParamsProps,
				response: {
					200: isBufferResponseProps,
					401: isErrorResponseProps,
					403: isErrorResponseProps,
					404: isErrorResponseProps,
					429: isErrorResponseProps,
					500: isErrorResponseProps,
				},
				tags: ['Federation', 'Media'],
			},
			canAccessResourceMiddleware('media'),
			async (c) => {
				try {
					const { mediaId } = c.req.param();
					const serverName = federationSDK.getConfig('serverName');

					// TODO: Add file streaming support
					const result = await getMediaFile(mediaId, serverName);
					if (!result) {
						return {
							statusCode: 404,
							body: { errcode: 'M_NOT_FOUND', error: 'Media not found' },
						};
					}

					const { file, buffer } = result;

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
		.get(
			'/v1/media/thumbnail/:mediaId',
			{
				params: isMediaDownloadParamsProps,
				response: {
					404: isErrorResponseProps,
				},
				tags: ['Federation', 'Media'],
			},
			canAccessResourceMiddleware('media'),
			async (_c) => ({
				statusCode: 404,
				body: {
					errcode: 'M_UNRECOGNIZED',
					error: 'This endpoint is not implemented on the homeserver side',
				},
			}),
		);
};
