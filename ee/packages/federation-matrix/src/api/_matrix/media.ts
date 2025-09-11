import crypto from 'crypto';

import type { HomeserverServices } from '@hs/federation-sdk';
import { Router } from '@rocket.chat/http-router';
import { Logger } from '@rocket.chat/logger';
import { Uploads } from '@rocket.chat/models';
import { ajv } from '@rocket.chat/rest-typings/dist/v1/Ajv';

import { MatrixMediaService } from '../../services/MatrixMediaService';
import type { IUploadWithFederation } from '../../types/IUploadWithFederation';

const logger = new Logger('federation-matrix:media');

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

function addSecurityHeaders(headers: Record<string, string>): Record<string, string> {
	return {
		...headers,
		'X-Content-Type-Options': 'nosniff',
		'X-Frame-Options': 'DENY',
		'Content-Security-Policy': "default-src 'none'; img-src 'self'; media-src 'self'",
		'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
	};
}

function createMultipartResponse(
	buffer: Buffer,
	mimeType: string,
	fileName: string,
	metadata?: Record<string, any>,
): { body: Buffer; contentType: string } {
	const boundary = crypto.randomBytes(16).toString('hex');
	const parts: string[] = [];

	if (metadata) {
		parts.push(`--${boundary}`);
		parts.push('Content-Type: application/json');
		parts.push('');
		parts.push(JSON.stringify(metadata));
	}

	parts.push(`--${boundary}`);
	parts.push(`Content-Type: ${mimeType}`);
	parts.push(`Content-Disposition: attachment; filename="${fileName}"`);
	parts.push('');

	const headerBuffer = Buffer.from(`${parts.join('\r\n')}\r\n`);
	const endBoundary = Buffer.from(`\r\n--${boundary}--\r\n`);
	const multipartBody = Buffer.concat([headerBuffer, buffer, endBoundary]);

	return {
		body: multipartBody,
		contentType: `multipart/mixed; boundary=${boundary}`,
	};
}

async function getMediaFile(
	mediaId: string,
	serverName: string,
): Promise<{
	file: IUploadWithFederation | null;
	buffer: Buffer | null;
}> {
	const mxcUri = `mxc://${serverName}/${mediaId}`;
	let file: IUploadWithFederation | null = await MatrixMediaService.getLocalFileForMatrixNode(mxcUri);

	if (!file) {
		const directFile = await Uploads.findOneById(mediaId);
		if (!directFile) {
			return { file: null, buffer: null };
		}
		file = {
			...directFile,
			federation: directFile.federation || { type: 'local', isRemote: false },
		} as IUploadWithFederation;
	}

	const buffer = await MatrixMediaService.getLocalFileBuffer(file._id);
	return { file, buffer };
}

export const getMatrixMediaRoutes = (homeserverServices: HomeserverServices) => {
	const { config } = homeserverServices;
	const router = new Router('/federation');

	router.get(
		'/v1/media/download/:mediaId',
		{
			params: isMediaDownloadParamsProps,
			response: {
				200: isBufferResponseProps,
				401: isErrorResponseProps,
				404: isErrorResponseProps,
				429: isErrorResponseProps,
				500: isErrorResponseProps,
			},
			tags: ['Federation', 'Media'],
		},
		async (context: any) => {
			try {
				const { mediaId } = context.req.param();
				const { serverName } = config;

				const { file, buffer } = await getMediaFile(mediaId, serverName);
				if (!file || !buffer) {
					return {
						statusCode: 404,
						body: { errcode: 'M_NOT_FOUND', error: 'Media not found' },
					};
				}

				const mimeType = file.type || 'application/octet-stream';
				const fileName = file.name || mediaId;

				const multipartResponse = createMultipartResponse(buffer, mimeType, fileName, {
					'content-type': mimeType,
					'content-length': buffer.length,
				});

				return {
					statusCode: 200,
					headers: addSecurityHeaders({
						'content-type': multipartResponse.contentType,
						'content-length': String(multipartResponse.body.length),
					}),
					body: multipartResponse.body,
				};
			} catch (error) {
				logger.error('Federation media download error:', error);
				return {
					statusCode: 500,
					body: { errcode: 'M_UNKNOWN', error: 'Internal server error' },
				};
			}
		},
	);

	router.get(
		'/v1/media/thumbnail/:mediaId',
		{
			params: isMediaDownloadParamsProps,
			response: {
				200: isBufferResponseProps,
				401: isErrorResponseProps,
				404: isErrorResponseProps,
			},
			tags: ['Federation', 'Media'],
		},
		async (context: any) => {
			try {
				const { mediaId } = context.req.param();
				const { serverName } = config;

				const { file, buffer } = await getMediaFile(mediaId, serverName);
				if (!file || !buffer) {
					return {
						statusCode: 404,
						body: { errcode: 'M_NOT_FOUND', error: 'Media not found' },
					};
				}

				const mimeType = file.type || 'application/octet-stream';
				const fileName = file.name || mediaId;

				const multipartResponse = createMultipartResponse(buffer, mimeType, fileName, {
					'content-type': mimeType,
					'content-length': buffer.length,
					'thumbnail': true,
				});

				return {
					statusCode: 200,
					headers: addSecurityHeaders({
						'content-type': multipartResponse.contentType,
						'content-length': String(multipartResponse.body.length),
					}),
					body: multipartResponse.body,
				};
			} catch (error) {
				logger.error('Federation thumbnail error:', error);
				return {
					statusCode: 500,
					body: { errcode: 'M_UNKNOWN', error: 'Internal server error' },
				};
			}
		},
	);

	return router;
};
