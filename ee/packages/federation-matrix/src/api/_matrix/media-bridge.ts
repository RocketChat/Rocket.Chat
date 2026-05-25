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

const ConfigResponseSchema = {
	type: 'object',
	properties: {
		'm.upload.size': { type: 'number' },
	},
	additionalProperties: true,
};

const isConfigResponseProps = ajv.compile(ConfigResponseSchema);

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
