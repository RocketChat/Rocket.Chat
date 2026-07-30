import type { AnySchema, ValidateFunction } from 'ajv';

export type OpenAPIParameter = {
	name: string;
	in: 'query' | 'path' | 'header';
	required?: boolean;
	description?: string;
	deprecated?: boolean;
	schema: AnySchema;
	example?: unknown;
};

export type OpenAPIMediaType = {
	schema: AnySchema;
	example?: unknown;
};

export type OpenAPIResponse = {
	description: string;
	content?: Record<string, OpenAPIMediaType>;
	headers?: Record<string, { description?: string; schema: AnySchema }>;
};

export type OpenAPIExternalDocs = {
	url: string;
	description?: string;
};

export type Route = {
	'summary'?: string;
	'description'?: string;
	'operationId'?: string;
	'deprecated'?: boolean;
	'externalDocs'?: OpenAPIExternalDocs;
	'responses': Record<number, OpenAPIResponse>;
	'parameters'?: OpenAPIParameter[];
	'requestBody'?: {
		required: true;
		content: Record<string, OpenAPIMediaType>;
	};
	'security'?: {
		userId: [];
		authToken: [];
	}[];
	'tags'?: string[];
	'x-permissions'?: string[];
	'x-license'?: string[];
	'x-two-factor-required'?: boolean;
};

type TOperation = 'hasAll' | 'hasAny';

type PermissionsRequired = string[] | Record<string, string[] | { operation: TOperation; permissions: string[] } | undefined> | undefined;

/**
 * Human-facing documentation a route may declare. Everything else in the OpenAPI operation is
 * derived from options the framework already needs (schemas, auth, permissions, license).
 */
export type OpenAPIDocumentation = {
	summary?: string;
	description?: string;
	/** Defaults to `<method><PascalCasePath>`; set it only to keep a published id stable. */
	operationId?: string;
	deprecated?: boolean;
	externalDocs?: OpenAPIExternalDocs;
	/**
	 * Path parameters schema, used for documentation only — path values always arrive as strings.
	 * ponytail: no runtime validation until an endpoint actually needs it.
	 */
	params?: ValidateFunction;
	/** Defaults to `application/json`; use for `multipart/form-data` uploads and friends. */
	bodyContentType?: string;
	responseDescriptions?: Partial<Record<number, string>>;
	examples?: {
		query?: Record<string, unknown>;
		params?: Record<string, unknown>;
		body?: unknown;
		response?: Partial<Record<number, unknown>>;
	};
};

/**
 * Documentation-relevant slice of a route's options. Both `TypedOptions` flavors (http-router and
 * the Meteor API class) structurally satisfy it.
 */
export type OpenAPIDocsOptions = OpenAPIDocumentation & {
	tags?: string[];
	query?: unknown;
	body?: unknown;
	response?: Record<string | number, unknown>;
	authRequired?: boolean;
	twoFactorRequired?: boolean;
	permissionsRequired?: PermissionsRequired;
	license?: readonly string[];
	rateLimiterOptions?: unknown;
	deprecation?: { version: string; alternatives?: readonly string[] };
};

const STATUS_DESCRIPTIONS: Record<number, string> = {
	200: 'Successful response',
	201: 'Resource created',
	202: 'Request accepted',
	204: 'No content',
	304: 'Not modified',
	400: 'Bad request — invalid or missing parameters',
	401: 'Unauthorized — missing or invalid authentication headers',
	403: 'Forbidden — the user lacks the required permission',
	404: 'Resource not found',
	409: 'Conflict',
	413: 'Payload too large',
	429: 'Too many requests — rate limit exceeded',
	500: 'Internal server error',
	501: 'Not implemented',
	503: 'Service unavailable',
};

const ERROR_RESPONSE_REF = { $ref: '#/components/schemas/ApiFailureV1' } as const;

const SUCCESS_RESPONSE_REF = { $ref: '#/components/schemas/ApiSuccessV1' } as const;

/** Schemas referenced by the responses this module injects; merge into `components.schemas`. */
export const openAPIErrorComponents: Record<string, AnySchema> = {
	ApiSuccessV1: {
		type: 'object',
		description: 'Rocket.Chat REST API success payload whose shape is not documented yet',
		properties: {
			success: { type: 'boolean', enum: [true] },
		},
		required: ['success'],
	},
	ApiFailureV1: {
		type: 'object',
		description: 'Standard Rocket.Chat REST API error payload',
		properties: {
			success: { type: 'boolean', enum: [false] },
			error: { type: 'string', example: 'error-invalid-params' },
			errorType: { type: 'string', example: 'error-invalid-params' },
			message: { type: 'string' },
			stack: { type: 'string', description: 'Only present when the server runs in test mode' },
		},
		required: ['success'],
	},
};

const RATE_LIMIT_HEADERS: NonNullable<OpenAPIResponse['headers']> = {
	'X-RateLimit-Limit': { description: 'Requests allowed within the current window', schema: { type: 'integer' } },
	'X-RateLimit-Remaining': { description: 'Requests still available within the current window', schema: { type: 'integer' } },
	'X-RateLimit-Reset': { description: 'Unix timestamp in milliseconds when the window resets', schema: { type: 'integer' } },
};

const TWO_FACTOR_PARAMETERS: OpenAPIParameter[] = [
	{
		name: 'x-2fa-code',
		in: 'header',
		required: true,
		description: 'Two-factor code, hashed according to the chosen method',
		schema: { type: 'string' },
	},
	{
		name: 'x-2fa-method',
		in: 'header',
		required: true,
		description: 'Method used to generate the two-factor code',
		schema: { type: 'string', enum: ['totp', 'email', 'password'] },
	},
];

type ObjectSchemaLike = {
	properties?: Record<string, Record<string, unknown>>;
	required?: string[];
	allOf?: ObjectSchemaLike[];
	anyOf?: ObjectSchemaLike[];
	oneOf?: ObjectSchemaLike[];
};

type CollectedProperties = { properties: Record<string, Record<string, unknown>>; required: Set<string> };

const getSchema = (carrier: unknown): AnySchema => {
	if (carrier && (typeof carrier === 'object' || typeof carrier === 'function') && 'schema' in carrier) {
		return (carrier as { schema: AnySchema }).schema;
	}
	return carrier as AnySchema;
};

const collectProperties = (schema: unknown): CollectedProperties | undefined => {
	if (!schema || typeof schema !== 'object') {
		return undefined;
	}

	const objectSchema = schema as ObjectSchemaLike;

	if (objectSchema.properties) {
		return { properties: { ...objectSchema.properties }, required: new Set(objectSchema.required ?? []) };
	}

	const branches = objectSchema.allOf ?? objectSchema.anyOf ?? objectSchema.oneOf;
	const collected = branches?.map(collectProperties).filter((entry): entry is CollectedProperties => Boolean(entry));

	if (!collected?.length) {
		return undefined;
	}

	const properties = Object.assign({}, ...collected.map((entry) => entry.properties));
	// `allOf` composes, so every branch's requirements hold; for `anyOf`/`oneOf` only the
	// requirements shared by all branches are guaranteed.
	const required = objectSchema.allOf
		? new Set(collected.flatMap((entry) => [...entry.required]))
		: new Set([...collected[0].required].filter((name) => collected.every((entry) => entry.required.has(name))));

	return { properties, required };
};

/** `/api/v1/rooms/:rid/:fileId` -> `/api/v1/rooms/{rid}/{fileId}` */
export const toOpenAPIPath = (path: string): string => path.replace(/:([A-Za-z0-9_]+)\??/g, '{$1}');

const extractPathParameterNames = (path: string): { name: string; required: boolean }[] =>
	[...path.matchAll(/:([A-Za-z0-9_]+)(\?)?/g)].map(([, name, optional]) => ({ name, required: !optional }));

const buildPathParameters = (path: string, options: OpenAPIDocsOptions): OpenAPIParameter[] => {
	const documented = collectProperties(getSchema(options.params));

	return extractPathParameterNames(path).map(({ name, required }) => {
		const schema = documented?.properties[name];

		return {
			name,
			in: 'path',
			required,
			schema: (schema as AnySchema) ?? { type: 'string' },
			...(typeof schema?.description === 'string' && { description: schema.description }),
			...(options.examples?.params?.[name] !== undefined
				? { example: options.examples.params[name] }
				: schema?.example !== undefined && { example: schema.example }),
		};
	});
};

const buildQueryParameters = (options: OpenAPIDocsOptions): OpenAPIParameter[] => {
	const schema = getSchema(options.query);

	if (!schema) {
		return [];
	}

	const collected = collectProperties(schema);

	if (!collected) {
		// ponytail: non-object query schemas ($ref, primitives) keep the legacy single-parameter
		// shape; explode them too if such a schema ever shows up.
		return [{ name: 'query', in: 'query', required: false, schema }];
	}

	return Object.entries(collected.properties).map(([name, propertySchema]) => ({
		name,
		in: 'query',
		required: collected.required.has(name),
		schema: propertySchema as AnySchema,
		...(typeof propertySchema.description === 'string' && { description: propertySchema.description }),
		...(typeof propertySchema.deprecated === 'boolean' && { deprecated: propertySchema.deprecated }),
		...(options.examples?.query?.[name] !== undefined
			? { example: options.examples.query[name] }
			: propertySchema.example !== undefined && { example: propertySchema.example }),
	}));
};

const normalizePermissions = (method: string, permissionsRequired: PermissionsRequired): string[] => {
	if (!permissionsRequired) {
		return [];
	}

	if (Array.isArray(permissionsRequired)) {
		return permissionsRequired;
	}

	const forMethod = [permissionsRequired[method.toUpperCase()], permissionsRequired['*']].filter(Boolean);

	return forMethod.flatMap((entry) => (Array.isArray(entry) ? entry : (entry?.permissions ?? [])));
};

const buildDescription = (method: string, options: OpenAPIDocsOptions): string | undefined => {
	const permissions = normalizePermissions(method, options.permissionsRequired);
	const notes: string[] = [];

	if (options.deprecation) {
		const alternatives = options.deprecation.alternatives?.length
			? ` Use ${options.deprecation.alternatives.map((alternative) => `\`${alternative}\``).join(' or ')} instead.`
			: '';
		notes.push(`**Deprecated** — scheduled for removal in version ${options.deprecation.version}.${alternatives}`);
	}

	if (permissions.length) {
		notes.push(`Requires the permission(s): ${permissions.map((permission) => `\`${permission}\``).join(', ')}.`);
	}

	if (options.twoFactorRequired) {
		notes.push('Requires two-factor authentication via the `x-2fa-code` and `x-2fa-method` headers.');
	}

	if (options.license?.length) {
		notes.push(`Requires the license module(s): ${options.license.map((module) => `\`${module}\``).join(', ')}.`);
	}

	const description = [options.description, ...notes].filter(Boolean).join('\n\n');

	return description || undefined;
};

/**
 * Only the document builder knows the final path — routers register operations before their parent
 * prefixes them — so ids are filled in by `withOperationIds`, not at registration time.
 */
export const buildOperationId = (method: string, path: string): string =>
	`${method.toLowerCase()}${toOpenAPIPath(path)
		.replace(/[{}]/g, '')
		.split(/[^A-Za-z0-9]+/)
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join('')}`;

const implicitErrorStatuses = (method: string, options: OpenAPIDocsOptions): number[] => {
	const statuses = [400, 500];

	if (options.authRequired) {
		statuses.push(401);
	}

	if (options.twoFactorRequired || normalizePermissions(method, options.permissionsRequired).length || options.license?.length) {
		statuses.push(403);
	}

	if (options.rateLimiterOptions !== false) {
		statuses.push(429);
	}

	return statuses;
};

const describeStatus = (status: number, options: OpenAPIDocsOptions): string =>
	options.responseDescriptions?.[status] ?? STATUS_DESCRIPTIONS[status] ?? `Response with status ${status}`;

/** Builds the OpenAPI operation object for a single route. */
export const buildOperation = (method: string, path: string, options: OpenAPIDocsOptions): Route => {
	const rateLimited = options.rateLimiterOptions !== false;
	const responses: Record<number, OpenAPIResponse> = {};

	for (const [status, validator] of Object.entries(options.response ?? {})) {
		if (!validator) {
			continue;
		}

		const code = Number(status);
		const example = options.examples?.response?.[code];

		responses[code] = {
			description: describeStatus(code, options),
			content: {
				'application/json': {
					schema: getSchema(validator),
					...(example !== undefined && { example }),
				},
			},
			...(rateLimited && { headers: RATE_LIMIT_HEADERS }),
		};
	}

	// `responses` is required by the spec, and undocumented (legacy) routes declare none.
	if (!Object.keys(responses).some((status) => Number(status) < 300)) {
		responses[200] = {
			description: describeStatus(200, options),
			content: { 'application/json': { schema: SUCCESS_RESPONSE_REF } },
			...(rateLimited && { headers: RATE_LIMIT_HEADERS }),
		};
	}

	for (const status of implicitErrorStatuses(method, options)) {
		if (!responses[status]) {
			responses[status] = {
				description: describeStatus(status, options),
				content: { 'application/json': { schema: ERROR_RESPONSE_REF } },
			};
		}
	}

	const parameters = [
		...buildPathParameters(path, options),
		...buildQueryParameters(options),
		...(options.twoFactorRequired ? TWO_FACTOR_PARAMETERS : []),
	];

	const bodySchema = getSchema(options.body);
	const permissions = normalizePermissions(method, options.permissionsRequired);
	const description = buildDescription(method, options);

	return {
		...(options.operationId && { operationId: options.operationId }),
		...(options.summary && { summary: options.summary }),
		...(description && { description }),
		...((options.deprecated ?? Boolean(options.deprecation)) && { deprecated: true }),
		...(options.externalDocs && { externalDocs: options.externalDocs }),
		responses,
		...(parameters.length && { parameters }),
		...(bodySchema && {
			requestBody: {
				required: true as const,
				content: {
					[options.bodyContentType ?? 'application/json']: {
						schema: bodySchema,
						...(options.examples?.body !== undefined && { example: options.examples.body }),
					},
				},
			},
		}),
		...(options.authRequired && {
			security: [
				{
					userId: [] as [],
					authToken: [] as [],
				},
			],
		}),
		...(permissions.length && { 'x-permissions': permissions }),
		...(options.license?.length && { 'x-license': [...options.license] }),
		...(options.twoFactorRequired && { 'x-two-factor-required': true }),
		tags: options.tags,
	};
};

/** Fills in the `operationId` of every operation that did not declare one, using its final path. */
export const withOperationIds = (paths: Record<string, Record<string, Route>>): Record<string, Record<string, Route>> =>
	Object.fromEntries(
		Object.entries(paths).map(([path, methods]) => [
			path,
			Object.fromEntries(
				Object.entries(methods).map(([method, operation]) => [method, { operationId: buildOperationId(method, path), ...operation }]),
			),
		]),
	);
