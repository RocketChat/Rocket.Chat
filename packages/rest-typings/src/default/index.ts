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
	'/v1/passkey/loginOptions': {
        GET: (params: {
            username: string;
        }) => Promise<{
            options: {
                rpId: string;
                challenge: string;
                allowCredentials: Array<{
                    id: string;
                    type: 'public-key';
                    transports?: AuthenticatorTransport[];
                }>;
                timeout?: number;
                userVerification?: UserVerificationRequirement;
            };
            success: boolean;
            error?: string;
        }>;
    };
    '/v1/passkey/loginVerify': {
        POST: (params: {
            username: string;
            authenticationResponse: {
                id: string;
                rawId: string;
                type: 'public-key';
                response: {
                    authenticatorData: string;
                    clientDataJSON: string;
                    signature: string;
                    userHandle?: string;
                };
                clientExtensionResults: AuthenticationExtensionsClientOutputs;
            };
        }) => Promise<{
            success: boolean;
            userId: string | null;
            authToken?: string;
            tokenExpires?: Date;
            error?: string;
        }>;
    };
    
    '/v1/passkey/registerOptions': {
        POST: (params: {
            username: string;
        }) => Promise<{
            options: {
                rp: {
                    name: string;
                    id: string;
                };
                user: {
                    id: string;
                    name: string;
                    displayName: string;
                };
                challenge: string;
                pubKeyCredParams: Array<{
                    type: 'public-key';
                    alg: number;
                }>;
                timeout?: number;
                attestation?: AttestationConveyancePreference;
                excludeCredentials?: Array<{
                    id: string;
                    type: 'public-key';
                    transports?: AuthenticatorTransport[];
                }>;
            };
        }>;
    };
    '/v1/passkey/registerVerify': {
        POST: (params: {
            attestationResponse: {
                id: string;
                rawId: string;
                type: 'public-key';
                response: {
                    attestationObject: string;
                    clientDataJSON: string;
                };
                clientExtensionResults: AuthenticationExtensionsClientOutputs;
            };
            username: string;
        }) => Promise<{
            success: boolean;
            passkeyId?: string;
            error?: string;
        }>;
    };
    '/v1/passkey/remove':{
        POST: (params:{
            username: string;
            passkeyId: string;
        }) => Promise<{
            success: boolean;
            message?: string;
        }>;
    };
    '/v1/users/me': {
        GET: () => Promise<{
            user: any; 
        }>;
    };
}
