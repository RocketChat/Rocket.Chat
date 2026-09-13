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
	examples?: Record<string, { summary?: string; description?: string; value: unknown }>;
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

type SecurityRequirement = { userId: []; authToken: [] } | Record<string, never>;

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
	'security'?: SecurityRequirement[];
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
	/** Defaults to `<method>-<path>`, matching the ids published at developer.rocket.chat. */
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
	/** Defaults to `application/json`; per status code, for endpoints answering images, text or files. */
	responseContentType?: Partial<Record<number, string>>;
	responseDescriptions?: Partial<Record<number, string>>;
	/** Response headers worth documenting, per status code. Rate limit headers are added on their own. */
	responseHeaders?: Partial<Record<number, Record<string, { description?: string; schema: AnySchema }>>>;
	examples?: {
		query?: Record<string, unknown>;
		params?: Record<string, unknown>;
		/** A single unnamed example, or named scenarios when a payload has several shapes. */
		body?: unknown | NamedExamples;
		response?: Partial<Record<number, unknown | NamedExamples>>;
	};
};

/**
 * Named scenarios for a payload, rendered as OpenAPI Example Objects — the shape used to document
 * alternatives ("room not found" vs "not a member") in a single response.
 */
export type NamedExamples = Record<string, { summary?: string; description?: string; value: unknown }>;

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
	/** The endpoint works with or without credentials — anonymous read, mostly. */
	authOrAnonRequired?: boolean;
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

/**
 * `nullable` is how OpenAPI 3.0 spelled it; 3.1, being JSON Schema 2020, spells it as a `null` member
 * of `type`. AJV understands `nullable`, so the schemas keep it and the conversion happens here, on a
 * copy, while the operation is built — once per route, at startup.
 */
const toOpenAPI31 = <T>(schema: T): T => {
	if (Array.isArray(schema)) {
		return schema.map(toOpenAPI31) as T;
	}

	if (!schema || typeof schema !== 'object') {
		return schema;
	}

	const { nullable, ...rest } = Object.fromEntries(Object.entries(schema).map(([key, value]) => [key, toOpenAPI31(value)])) as Record<
		string,
		unknown
	> & { nullable?: unknown };

	if (nullable !== true) {
		return rest as T;
	}

	if (typeof rest.type === 'string') {
		return { ...rest, type: [rest.type, 'null'] } as T;
	}

	if (Array.isArray(rest.type)) {
		return { ...rest, type: rest.type.includes('null') ? rest.type : [...rest.type, 'null'] } as T;
	}

	// nothing to extend - AJV refuses `nullable` without a `type`, so this is a schema it never saw
	return rest as T;
};

const getSchema = (carrier: unknown): AnySchema => {
	if (carrier && (typeof carrier === 'object' || typeof carrier === 'function') && 'schema' in carrier) {
		return toOpenAPI31((carrier as { schema: AnySchema }).schema);
	}
	return toOpenAPI31(carrier as AnySchema);
};

const sharedSchemas = new Map<string, AnySchema>();

/** Schemas hoisted out of the operations because they carry an `$id`; merge into `components.schemas`. */
export const getSharedSchemas = (): Record<string, AnySchema> => Object.fromEntries(sharedSchemas);

/**
 * A schema with an `$id` is shared by many routes — the error payloads, mostly — so it is hoisted
 * into `components.schemas` and referenced, instead of being inlined in every operation.
 */
const referenceSchema = (schema: AnySchema): AnySchema => {
	if (!schema || typeof schema !== 'object' || !('$id' in schema) || typeof schema.$id !== 'string' || /[#/]/.test(schema.$id)) {
		return schema;
	}

	const { $id, ...definition } = schema;

	sharedSchemas.set($id, definition as AnySchema);

	return { $ref: `#/components/schemas/${$id}` };
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

/**
 * `/api/v1/rooms/:rid/:fileId` -> `/api/v1/rooms/{rid}/{fileId}`, collapsing the duplicate slashes
 * that show up when a router prefixes a subpath that already starts with one.
 */
export const toOpenAPIPath = (path: string): string => path.replace(/:([A-Za-z0-9_]+)\??/g, '{$1}').replace(/\/{2,}/g, '/');

/** Every path parameter is required: an optional express segment is a different path, not an optional one. */
const extractPathParameterNames = (path: string): string[] => [...path.matchAll(/:([A-Za-z0-9_]+)\??/g)].map(([, name]) => name);

const buildPathParameters = (path: string, options: OpenAPIDocsOptions): OpenAPIParameter[] => {
	const documented = collectProperties(getSchema(options.params));

	return extractPathParameterNames(path).map((name) => {
		const schema = documented?.properties[name];

		return {
			name,
			in: 'path',
			required: true,
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

	// the method's own entry wins over the wildcard, the way `checkPermissionsForInvocation` reads it
	const entry = permissionsRequired[method.toUpperCase()] ?? permissionsRequired['*'];

	if (!entry) {
		return [];
	}

	return Array.isArray(entry) ? entry : entry.permissions;
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
	[method.toLowerCase(), ...toOpenAPIPath(path).replace(/[{}]/g, '').split('/').filter(Boolean)].join('-');

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

const AUTH_HEADERS: SecurityRequirement = { userId: [] as [], authToken: [] as [] };

const buildSecurity = (options: OpenAPIDocsOptions): SecurityRequirement[] => {
	if (options.authOrAnonRequired) {
		return [AUTH_HEADERS, {}];
	}

	return options.authRequired ? [AUTH_HEADERS] : [];
};

const describeStatus = (status: number, options: OpenAPIDocsOptions): string =>
	options.responseDescriptions?.[status] ?? STATUS_DESCRIPTIONS[status] ?? `Response with status ${status}`;

const isNamedExamples = (examples: unknown): examples is NamedExamples =>
	Boolean(examples) &&
	typeof examples === 'object' &&
	!Array.isArray(examples) &&
	Object.values(examples as Record<string, unknown>).every(
		(entry) => Boolean(entry) && typeof entry === 'object' && !Array.isArray(entry) && 'value' in (entry as object),
	) &&
	Object.keys(examples as object).length > 0;

const buildResponseHeaders = (status: number, options: OpenAPIDocsOptions, rateLimited: boolean): Pick<OpenAPIResponse, 'headers'> => {
	const headers = {
		...(rateLimited && RATE_LIMIT_HEADERS),
		...options.responseHeaders?.[status],
	};

	return Object.keys(headers).length ? { headers } : {};
};

/** Named scenarios become an `examples` map; anything else is a single unnamed `example`. */
const buildMediaExamples = (examples: unknown): Pick<OpenAPIMediaType, 'example' | 'examples'> => {
	if (examples === undefined) {
		return {};
	}

	return isNamedExamples(examples) ? { examples } : { example: examples };
};

/** Builds the OpenAPI operation object for a single route. */
export const buildOperation = (method: string, path: string, options: OpenAPIDocsOptions): Route => {
	const rateLimited = options.rateLimiterOptions !== false;
	const responses: Record<number, OpenAPIResponse> = {};

	for (const [status, validator] of Object.entries(options.response ?? {})) {
		if (!validator) {
			continue;
		}

		const code = Number(status);

		responses[code] = {
			description: describeStatus(code, options),
			content: {
				[options.responseContentType?.[code] ?? 'application/json']: {
					schema: referenceSchema(getSchema(validator)),
					...buildMediaExamples(options.examples?.response?.[code]),
				},
			},
			...buildResponseHeaders(code, options, rateLimited),
		};
	}

	// `responses` is required by the spec, and undocumented (legacy) routes declare none. A declared
	// redirect counts as documented: the route answers it and never answers a 200.
	if (!Object.keys(responses).some((status) => Number(status) < 400)) {
		responses[200] = {
			description: describeStatus(200, options),
			content: { 'application/json': { schema: SUCCESS_RESPONSE_REF } },
			...buildResponseHeaders(200, options, rateLimited),
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
						schema: referenceSchema(bodySchema),
						...buildMediaExamples(options.examples?.body),
					},
				},
			},
		}),
		// spelled out even when empty: the document declares security schemes, so an operation without
		// a requirement is indistinguishable from one that forgot to declare it
		security: buildSecurity(options),
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
