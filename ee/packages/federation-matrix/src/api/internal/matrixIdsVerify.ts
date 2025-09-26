// '/v1/federation/matrixIds.verify': {
//     GET: (params: FederationVerifyMatrixIdProps) => { results: Map<string, string> };
// };
import type { HomeserverServices } from '@rocket.chat/federation-sdk';
import { Router } from '@rocket.chat/http-router';
import { ajv } from '@rocket.chat/rest-typings/dist/v1/Ajv';

export type FederationVerifyMatrixIdProps = {
	matrixIds: string[];
};

const FederationVerifyMatrixIdPropsSchema = {
	type: 'object',
	properties: {
		matrixIds: {
			type: 'array',
			items: { type: 'string' },
			uniqueItems: true,
			minItems: 1,
			maxItems: 15,
		},
	},
	additionalProperties: false,
	required: ['matrixIds'],
};

export const isFederationVerifyMatrixIdProps = ajv.compile<FederationVerifyMatrixIdProps>(FederationVerifyMatrixIdPropsSchema);

const VerifyMatrixIdsResponseSchema = {
	type: 'object',
	properties: {
		results: { type: 'object' },
	},
};

export const isVerifyMatrixIdsResponseProps = ajv.compile(VerifyMatrixIdsResponseSchema);

// '/v1/federation/matrixIds.verify': {
// 	GET: (params: FederationVerifyMatrixIdProps) => { results: Map<string, string> };
// };
// TODO: After changing the domain setting this route is still reporting the old domain until the server is restarted
// TODO: this is wrong, is siteurl !== domain this path should return 404. this path is to discover the final address, domain being the "proxy" and siteurl the final destination, if domain is different, well-known should be served there, not here.

export const getInternalJoinFederatedRoomsRoutes = (services: HomeserverServices) => {
	const { request } = services;
	return new Router('/').get(
		'/matrixIds.verify',
		{
			response: {
				200: isVerifyMatrixIdsResponseProps,
			},
			query: isFederationVerifyMatrixIdProps,
			tags: ['Well-Known'],
			license: ['federation'],
		},
		async (c) => {
			const matrixIds = c.req.query('matrixIds');

			if (!Array.isArray(matrixIds)) {
				throw new Error('Matrix IDs are required');
			}

			const results = Object.fromEntries(
				await Promise.all(
					matrixIds.map(async (matrixId) => {
						const [userId, homeserverUrl] = matrixId.split(':');
						try {
							const result = await request.get<
								| {
										available: boolean;
								  }
								| {
										errcode: string;
										error: string;
								  }
							>(homeserverUrl, `/_matrix/client/v3/register/available`, { username: userId });

							if ('errcode' in result && result.errcode === 'M_USER_IN_USE') {
								return [matrixId, 'UNVERIFIED'];
							}

							return [matrixId, 'VERIFIED'];
						} catch (e) {
							return [matrixId, 'UNABLE_TO_VERIFY'];
						}
					}),
				),
			);
			return {
				body: {
					results,
				},
				statusCode: 200,
			};
		},
	);
};
