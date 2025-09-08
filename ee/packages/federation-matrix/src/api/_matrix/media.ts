import crypto from 'crypto';

import { extractSignaturesFromHeader, validateAuthorizationHeader } from '@hs/core';
import type { HomeserverServices } from '@hs/federation-sdk';
import { Router } from '@rocket.chat/http-router';
import { Logger } from '@rocket.chat/logger';
import { Uploads } from '@rocket.chat/models';
import { ajv } from '@rocket.chat/rest-typings/dist/v1/Ajv';

import { MatrixMediaService } from '../../services/MatrixMediaService';
import type { IUploadWithFederation } from '../../types/IUploadWithFederation';

const logger = new Logger('federation-matrix:media');
const ENFORCE_FEDERATION_VERIFICATION = process.env.ENFORCE_FEDERATION_VERIFICATION === 'true';
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

// TODO: Move to homeserver
async function verifyMatrixSignature(
	homeserverServices: HomeserverServices,
	authHeader: string,
	method: string,
	uri: string,
	body?: any,
): Promise<{ isValid: boolean; origin?: string; error?: string }> {
	try {
		const { origin, destination, key, signature } = extractSignaturesFromHeader(authHeader);
		const ourServerName = homeserverServices.config.serverName;

		if (destination !== ourServerName) {
			return {
				isValid: false,
				error: `Destination mismatch: expected ${ourServerName}, got ${destination}`,
			};
		}

		let publicKey: string;
		try {
			const keyResponse = await fetch(`https://${origin}/_matrix/key/v2/server`);
			if (!keyResponse.ok) {
				throw new Error(`Failed to fetch keys from ${origin}: ${keyResponse.status}`);
			}

			const keyData = (await keyResponse.json()) as any;
			if (!keyData.verify_keys || !keyData.verify_keys[key]) {
				throw new Error(`Key ${key} not found in response from ${origin}`);
			}

			publicKey = keyData.verify_keys[key].key;
		} catch (fetchError) {
			logger.error('Failed to fetch public key from origin server', {
				origin,
				keyId: key,
				error: fetchError instanceof Error ? fetchError.message : 'Unknown error',
			});

			if (!ENFORCE_FEDERATION_VERIFICATION) {
				logger.warn('Allowing request despite key fetch failure (development mode)');
				return { isValid: true, origin };
			}
			return { isValid: false, error: 'Failed to fetch public key from origin server' };
		}

		try {
			const isValid = await validateAuthorizationHeader(origin, publicKey, destination, method, uri, signature, body);
			if (isValid) {
				logger.info('X-Matrix signature verified successfully', { origin, keyId: key });
				return { isValid: true, origin };
			}
			logger.warn('X-Matrix signature validation returned false', { origin, keyId: key });
		} catch (validationError) {
			logger.warn('X-Matrix signature verification failed', {
				origin,
				keyId: key,
				method,
				uri,
				destination,
				error: validationError instanceof Error ? validationError.message : 'Unknown error',
			});

			if (!ENFORCE_FEDERATION_VERIFICATION) {
				logger.warn('Allowing request despite verification failure (development mode)');
				return { isValid: true, origin };
			}
			return { isValid: false, error: 'Invalid signature' };
		}

		return { isValid: false, error: 'Signature verification failed' };
	} catch (error) {
		logger.error('Error during X-Matrix signature verification', {
			error,
			errorMessage: error instanceof Error ? error.message : 'Unknown error',
			errorStack: error instanceof Error ? error.stack : undefined,
		});
		return {
			isValid: false,
			error: error instanceof Error ? error.message : 'Signature verification error',
		};
	}
}

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

async function handleFederationAuth(
	context: any,
	homeserverServices: HomeserverServices,
): Promise<{ isValid: boolean; requestingServer: string; errorResponse?: any }> {
	const authHeader = context.req.header('Authorization');
	let requestingServer = 'unknown';

	if (!authHeader || (!authHeader.startsWith('X-Matrix') && !ENFORCE_FEDERATION_VERIFICATION)) {
		return { isValid: true, requestingServer };
	}

	const verificationResult = await verifyMatrixSignature(
		homeserverServices,
		authHeader,
		context.req.method,
		context.req.path,
		context.req.body,
	);

	if (!verificationResult.isValid) {
		return {
			isValid: false,
			requestingServer,
			errorResponse: {
				statusCode: 401,
				body: {
					errcode: 'M_UNAUTHORIZED',
					error: verificationResult.error || 'Invalid X-Matrix signature',
				},
			},
		};
	}

	requestingServer = verificationResult.origin || 'unknown';

	return { isValid: true, requestingServer };
}

export const getMatrixMediaRoutes = (homeserverServices: HomeserverServices) => {
	const { config } = homeserverServices;
	const router = new Router('/federation');

	// Federation V1 Download Endpoint
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

				const authResult = await handleFederationAuth(context, homeserverServices);
				if (!authResult.isValid) {
					return authResult.errorResponse;
				}

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

	// Federation V1 Thumbnail Endpoint
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

				const authResult = await handleFederationAuth(context, homeserverServices);
				if (!authResult.isValid) {
					return authResult.errorResponse;
				}

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
