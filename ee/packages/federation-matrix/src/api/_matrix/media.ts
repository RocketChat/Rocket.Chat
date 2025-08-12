import type { HomeserverServices } from '@hs/federation-sdk';
import { Router } from '@rocket.chat/http-router';
import { Logger } from '@rocket.chat/logger';
import { Uploads } from '@rocket.chat/models';
import { ajv } from '@rocket.chat/rest-typings/dist/v1/Ajv';
import crypto from 'crypto';

import { MatrixMediaService } from '../../services/MatrixMediaService';
import type { IUploadWithFederation } from '../../types/IUploadWithFederation';

const logger = new Logger('federation-matrix:media');

// Response schemas
const MediaDownloadParamsSchema = {
	type: 'object',
	properties: {
		mediaId: {
			type: 'string',
			description: 'Media ID',
		},
	},
	required: ['mediaId'],
	additionalProperties: false,
};

const isMediaDownloadParamsProps = ajv.compile(MediaDownloadParamsSchema);

const MediaDownloadV3ParamsSchema = {
	type: 'object',
	properties: {
		serverName: {
			type: 'string',
			description: 'Server name',
		},
		mediaId: {
			type: 'string',
			description: 'Media ID',
		},
	},
	required: ['serverName', 'mediaId'],
	additionalProperties: false,
};

const isMediaDownloadV3ParamsProps = ajv.compile(MediaDownloadV3ParamsSchema);

const ErrorResponseSchema = {
	type: 'object',
	properties: {
		errcode: {
			type: 'string',
			description: 'Error code',
		},
		error: {
			type: 'string',
			description: 'Error message',
		},
	},
	required: ['errcode', 'error'],
};

const isErrorResponseProps = ajv.compile(ErrorResponseSchema);

// Since we return raw buffers for success, we don't validate the 200 response
const BufferResponseSchema = {
	type: 'object',
	description: 'Raw file buffer or multipart response',
};

const isBufferResponseProps = ajv.compile(BufferResponseSchema);


/**
 * Create a multipart/mixed response for Matrix federation media
 */
function createMultipartResponse(
	buffer: Buffer,
	mimeType: string,
	fileName: string,
	metadata?: Record<string, any>
): { body: Buffer; contentType: string } {
	// Generate a boundary without quotes or special chars that might cause issues
	const boundary = `${crypto.randomBytes(16).toString('hex')}`;
	const parts: string[] = [];
	
	// Add metadata part if provided
	if (metadata) {
		parts.push(`--${boundary}`);
		parts.push('Content-Type: application/json');
		parts.push('');
		parts.push(JSON.stringify(metadata));
	}
	
	// Add file part
	parts.push(`--${boundary}`);
	parts.push(`Content-Type: ${mimeType}`);
	parts.push(`Content-Disposition: attachment; filename="${fileName}"`);
	parts.push('');
	
	// Combine headers with file buffer
	const headerBuffer = Buffer.from(parts.join('\r\n') + '\r\n');
	const endBoundary = Buffer.from(`\r\n--${boundary}--\r\n`);
	
	const multipartBody = Buffer.concat([headerBuffer, buffer, endBoundary]);
	
	return {
		body: multipartBody,
		contentType: `multipart/mixed; boundary=${boundary}`,  // No quotes around boundary
	};
}

export const getMatrixMediaRoutes = (homeserverServices: HomeserverServices) => {
	const { config } = homeserverServices;

	const router = new Router('/federation');

	// Federation v1 media endpoint
	// GET /_matrix/federation/v1/media/download/:mediaId
	router.get(
		'/v1/media/download/:mediaId',
		{
			params: isMediaDownloadParamsProps,
			response: {
				200: isBufferResponseProps,
				404: isErrorResponseProps,
				500: isErrorResponseProps,
			},
			tags: ['Federation', 'Media'],
		},
		async (context) => {
			try {
				const { mediaId } = context.req.param();
				const serverName = config.getServerConfig().name;

				logger.info('Received federation media download request', {
					mediaId,
					serverName,
				});

				// Construct MXC URI
				const mxcUri = `mxc://${serverName}/${mediaId}`;

				// Get the file from local storage
				let file: IUploadWithFederation | null = await MatrixMediaService.getLocalFileForMatrixNode(mxcUri);

				if (!file) {
					// Try direct lookup by ID
					const directFile = await Uploads.findOneById(mediaId);
					if (!directFile) {
						logger.warn('File not found', { mediaId, mxcUri });
						return {
							statusCode: 404,
							body: {
								errcode: 'M_NOT_FOUND',
								error: 'Media not found',
							},
						};
					}
					// Cast to IUploadWithFederation - add missing federation field if needed
					file = {
						...directFile,
						federation: directFile.federation || {
							type: 'local',
							isRemote: false,
						},
					} as IUploadWithFederation;
				}

				// Get file content
				const buffer = await MatrixMediaService.getLocalFileBuffer(file._id);

				if (!buffer) {
					logger.error('Failed to get file buffer', { fileId: file._id });
					return {
						statusCode: 404,
						body: {
							errcode: 'M_NOT_FOUND',
							error: 'Media not found',
						},
					};
				}

				// Set proper headers
				const mimeType = file.type || 'application/octet-stream';
				const fileName = file.name || mediaId;

				logger.info('Serving file for federation', {
					mediaId,
					fileName,
					size: buffer.length,
					mimeType,
				});

				// Create multipart response for federation
				const multipartResponse = createMultipartResponse(
					buffer,
					mimeType,
					fileName,
					{
						'content-type': mimeType,
						'content-length': buffer.length,
					}
				);

				// Return the multipart response
				return {
					statusCode: 200,
					headers: {
						'content-type': multipartResponse.contentType,
						'content-length': String(multipartResponse.body.length),
					},
					body: multipartResponse.body,
				};
			} catch (error) {
				logger.error('Federation media download error:', error);
				return {
					statusCode: 500,
					body: {
						errcode: 'M_UNKNOWN',
						error: 'Internal server error',
					},
				};
			}
		},
	);

	// Federation v1 thumbnail endpoint (optional)
	// GET /_matrix/federation/v1/media/thumbnail/:mediaId
	router.get(
		'/v1/media/thumbnail/:mediaId',
		{
			params: isMediaDownloadParamsProps,
			response: {
				200: isBufferResponseProps,
				404: isErrorResponseProps,
			},
			tags: ['Federation', 'Media'],
		},
		async (context) => {
			try {
				const { mediaId } = context.req.param();
				const serverName = config.getServerConfig().name;

				logger.info('Thumbnail request received', { mediaId });

				// For now, return the full image as thumbnail
				// In the future, we could implement actual thumbnail generation
				const mxcUri = `mxc://${serverName}/${mediaId}`;
				let file: IUploadWithFederation | null = await MatrixMediaService.getLocalFileForMatrixNode(mxcUri);

				if (!file) {
					const directFile = await Uploads.findOneById(mediaId);
					if (!directFile) {
						return {
							statusCode: 404,
							body: {
								errcode: 'M_NOT_FOUND',
								error: 'Media not found',
							},
						};
					}
					file = {
						...directFile,
						federation: directFile.federation || {
							type: 'local',
							isRemote: false,
						},
					} as IUploadWithFederation;
				}

				const buffer = await MatrixMediaService.getLocalFileBuffer(file._id);
				if (!buffer) {
					return {
						statusCode: 404,
						body: {
							errcode: 'M_NOT_FOUND',
							error: 'Media not found',
						},
					};
				}

				const mimeType = file.type || 'application/octet-stream';
				const fileName = file.name || mediaId;

				// Create multipart response for federation
				const multipartResponse = createMultipartResponse(
					buffer,
					mimeType,
					fileName,
					{
						'content-type': mimeType,
						'content-length': buffer.length,
						'thumbnail': true,
					}
				);

				return {
					statusCode: 200,
					headers: {
						'content-type': multipartResponse.contentType,
						'content-length': String(multipartResponse.body.length),
					},
					body: multipartResponse.body,
				};
			} catch (error) {
				logger.error('Thumbnail error:', error);
				return {
					statusCode: 500,
					body: {
						errcode: 'M_UNKNOWN',
						error: 'Internal server error',
					},
				};
			}
		},
	);

	// Also add v3 media endpoints using the same router
	// Federation v3 media endpoint
	// GET /_matrix/media/v3/download/:serverName/:mediaId
	router.get(
		'/../../media/v3/download/:serverName/:mediaId',
		{
			params: isMediaDownloadV3ParamsProps,
			response: {
				200: isBufferResponseProps,
				404: isErrorResponseProps,
				500: isErrorResponseProps,
			},
			tags: ['Federation', 'Media'],
		},
		async (context) => {
			try {
				const { serverName, mediaId } = context.req.param();
				const ourServerName = config.getServerConfig().name;

				logger.info('Received federation media v3 download request', {
					serverName,
					mediaId,
					ourServerName,
				});

				// Check if this is for our server
				if (serverName !== ourServerName) {
					// Per Matrix spec: Servers MUST NOT return remote media from federation endpoints
					// Each server only serves its own media
					return {
						statusCode: 404 as const,
						body: {
							errcode: 'M_NOT_FOUND',
							error: 'This server does not serve media for other servers (per Matrix spec)',
						},
					};
				}

				// Check allow_remote parameter
				const query = context.req.query();
				const allowRemote = query?.allow_remote !== 'false'; // Default true
				if (!allowRemote && serverName !== ourServerName) {
					return {
						statusCode: 404,
						body: {
							errcode: 'M_NOT_FOUND',
							error: 'Remote media not allowed',
						},
					};
				}

				// Construct MXC URI
				const mxcUri = `mxc://${serverName}/${mediaId}`;

				// Get the file from local storage
				let file: IUploadWithFederation | null = await MatrixMediaService.getLocalFileForMatrixNode(mxcUri);

				if (!file) {
					// Try direct lookup by ID
					const directFile = await Uploads.findOneById(mediaId);
					if (!directFile) {
						logger.warn('File not found', {
							mediaId,
							serverName,
							mxcUri,
						});
						return {
							statusCode: 404,
							body: {
								errcode: 'M_NOT_FOUND',
								error: 'Media not found',
							},
						};
					}
					// Cast to IUploadWithFederation - add missing federation field if needed
					file = {
						...directFile,
						federation: directFile.federation || {
							type: 'local',
							isRemote: false,
						},
					} as IUploadWithFederation;
				}

				// Get file content
				const buffer = await MatrixMediaService.getLocalFileBuffer(file._id);

				if (!buffer) {
					logger.error('Failed to get file buffer', {
						fileId: file._id,
						fileName: file.name,
					});
					return {
						statusCode: 404,
						body: {
							errcode: 'M_NOT_FOUND',
							error: 'Media not found',
						},
					};
				}

				// Set proper headers
				const mimeType = file.type || 'application/octet-stream';
				const fileName = file.name || mediaId;

				logger.info('Serving file for federation v3', {
					mediaId,
					serverName,
					fileName,
					size: buffer.length,
					mimeType,
				});

				// Create multipart response for federation
				const multipartResponse = createMultipartResponse(
					buffer,
					mimeType,
					fileName,
					{
						'content-type': mimeType,
						'content-length': buffer.length,
						'cache-control': 'public, max-age=31536000',
					}
				);

				// Return the multipart response
				return {
					statusCode: 200,
					headers: {
						'content-type': multipartResponse.contentType,
						'content-length': String(multipartResponse.body.length),
						'cache-control': 'public, max-age=31536000', // Cache for 1 year
					},
					body: multipartResponse.body,
				};
			} catch (error) {
				logger.error('Federation media v3 download error:', error);
				return {
					statusCode: 500,
					body: {
						errcode: 'M_UNKNOWN',
						error: 'Internal server error',
					},
				};
			}
		},
	);

	// GET /_matrix/media/v3/thumbnail/:serverName/:mediaId
	router.get(
		'/../../media/v3/thumbnail/:serverName/:mediaId',
		{
			params: isMediaDownloadV3ParamsProps,
			response: {
				200: isBufferResponseProps,
				404: isErrorResponseProps,
			},
			tags: ['Federation', 'Media'],
		},
		async (context) => {
			try {
				const { serverName, mediaId } = context.req.param();
				const ourServerName = config.getServerConfig().name;

				logger.info('Thumbnail v3 request received', {
					serverName,
					mediaId,
				});

				if (serverName !== ourServerName) {
					return {
						statusCode: 404,
						body: {
							errcode: 'M_NOT_FOUND',
							error: 'This server does not serve media for other servers',
						},
					};
				}

				const mxcUri = `mxc://${serverName}/${mediaId}`;
				let file: IUploadWithFederation | null = await MatrixMediaService.getLocalFileForMatrixNode(mxcUri);

				if (!file) {
					const directFile = await Uploads.findOneById(mediaId);
					if (!directFile) {
						return {
							statusCode: 404,
							body: {
								errcode: 'M_NOT_FOUND',
								error: 'Media not found',
							},
						};
					}
					file = {
						...directFile,
						federation: directFile.federation || {
							type: 'local',
							isRemote: false,
						},
					} as IUploadWithFederation;
				}

				const buffer = await MatrixMediaService.getLocalFileBuffer(file._id);
				if (!buffer) {
					return {
						statusCode: 404,
						body: {
							errcode: 'M_NOT_FOUND',
							error: 'Media not found',
						},
					};
				}

				const mimeType = file.type || 'application/octet-stream';
				const fileName = file.name || mediaId;

				// Create multipart response for federation
				const multipartResponse = createMultipartResponse(
					buffer,
					mimeType,
					fileName,
					{
						'content-type': mimeType,
						'content-length': buffer.length,
						'thumbnail': true,
						'cache-control': 'public, max-age=31536000',
					}
				);

				return {
					statusCode: 200,
					headers: {
						'content-type': multipartResponse.contentType,
						'content-length': String(multipartResponse.body.length),
						'cache-control': 'public, max-age=31536000',
					},
					body: multipartResponse.body,
				};
			} catch (error) {
				logger.error('Thumbnail v3 error:', error);
				return {
					statusCode: 500,
					body: {
						errcode: 'M_UNKNOWN',
						error: 'Internal server error',
					},
				};
			}
		},
	);

	return router;
};