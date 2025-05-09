import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

type OpenAPIJSONEndpoint = { withUndocumented?: boolean };

const OpenAPIJSONEndpointSchema = {
	type: 'object',
	properties: {
		withUndocumented: {
			type: 'boolean',
			nullable: true,
		},
	},
	required: [],
	additionalProperties: false,
};

export const isOpenAPIJSONEndpoint = ajv.compile<OpenAPIJSONEndpoint>(OpenAPIJSONEndpointSchema);

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface DefaultEndpoints {
	'/info': {
		GET: () =>
			| {
					info: {
						build: {
							arch: string;
							cpus: number;
							date: string;
							freeMemory: number;
							nodeVersion: string;
							osRelease: string;
							platform: string;
							totalMemory: number;
						};
						commit: {
							author?: string;
							branch?: string;
							date?: string;
							hash?: string;
							subject?: string;
							tag?: string;
						};
						marketplaceApiVersion: string;
						version: string;
						tag?: string;
						branch?: string;
					};
			  }
			| {
					version: string | undefined;
			  };
	};
	'/ecdh_proxy/initEncryptedSession': {
		POST: () => void;
	};
	'/docs/json': {
		GET: (params: OpenAPIJSONEndpoint) => {
			openapi: string;
			info: {
				title: string;
				description: string;
				version: string;
			};
			servers: {
				url: string;
			}[];
			components: {
				securitySchemes: {
					userId: {
						type: string;
						in: string;
						name: string;
					};
					authToken: {
						type: string;
						in: string;
						name: string;
					};
				};
				schemas: {};
			};
			paths: Record<string, Record<string, unknown>>;
		};
	};
}
