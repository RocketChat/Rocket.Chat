import * as fs from 'fs';
import * as path from 'path';

import type { oas31 } from 'openapi3-ts';

import apiData from './compiler';
import { schemas } from './schemas';

const IsArrayREGEX = /\[\]$/;

export interface IMethodData {
	params?: Record<string, string>;
	response?: Record<string, any>;
}

export interface IEndpoints {
	[endpoint: string]: {
		[method: string]: IMethodData;
	};
}

export interface IApiData {
	[section: string]: IEndpoints;
}

// Base Template
const createBasicTemplate = (): oas31.OpenAPIObject => ({
	openapi: '3.0.0',
	info: {
		title: 'Rocket Chat API',
		version: '1.0.0',
		description: 'This is a sample API Documentation',
	},
	servers: [
		{
			url: 'https://apiexplorer.support.rocket.chat/',
		},
	],
	paths: {},
	components: {
		schemas,
		securitySchemes: {
			ApiKeyAuth: {
				type: 'apiKey',
				in: 'header',
				name: 'X-API-Key',
			},
			BearerAuth: {
				type: 'http',
				scheme: 'bearer',
				bearerFormat: 'JWT',
			},
		},
	},
	security: [
		{
			ApiKeyAuth: [],
		},
	],
});

// Type mapping
const paramTypeMap: { [key: string]: oas31.SchemaObjectType } = {
	string: 'string',
	boolean: 'boolean',
	number: 'integer',
};

const createParameterObject = (name: string, type: any, isRequired: boolean): oas31.ParameterObject => {
	const isArray = IsArrayREGEX.test(type);
	const isUnion = name === 'unionTypes';

	if (/\?$/.test(name)) {
		name = name.slice(0, -1);
		isRequired = false;
	}

	return {
		name,
		in: 'query',
		required: isRequired,
		schema: {
			type: isArray ? 'array' : paramTypeMap[type],
			oneOf: isUnion ? type.map((childType: Record<string, string>) => createRequestBodySchema(childType)) : undefined,
			...(isArray ? { items: { type: paramTypeMap[type.slice(0, -2)] } } : {}),
		},
	};
};

const createRequestBodySchema = (params: Record<string, any>): oas31.SchemaObject => {
	const schema: oas31.SchemaObject = { type: 'object', properties: {}, required: [] };

	for (let [key, value] of Object.entries(params)) {
		value = value;
		if (/\?$/.test(key)) {
			key = key.slice(0, -1);
		}

		const isArray = IsArrayREGEX.test(value);
		const isUnion = key === 'unionTypes';
		const type = paramTypeMap[value];

		if (typeof value === 'object' && !isUnion) {
			const nestedSchema = createRequestBodySchema(value);
			schema.properties![key] = {
				type: 'object',
				properties: nestedSchema.properties,
				required: nestedSchema.required,
			};
			if (nestedSchema.required && nestedSchema.required.length > 0) {
				schema.required!.push(key);
			}
		} else {
			schema.properties![key] = {
				// key name is set to "UnionTypes" which may be changed later accordingly! //
				type: isArray ? 'array' : type,
				oneOf: isUnion ? value.map((childType: Record<string, string>) => createRequestBodySchema(childType)) : undefined,
				...(isArray ? { items: { type } } : {}),
			};

			if (!/\?$/.test(key)) {
				schema.required!.push(key);
			}
		}
	}
	return schema;
};

const createResponseSchema = (response: Record<string, any>): oas31.SchemaObject => {
	const responseSchema: oas31.SchemaObject = {
		type: 'object',
		properties: {},
	};

	for (const [key, value] of Object.entries(response || {})) {
		let schemaRef: oas31.ReferenceObject | oas31.SchemaObject;

		if (typeof value === 'object' && !Array.isArray(value)) {
			const nestedSchema = createResponseSchema(value);
			responseSchema.properties![key] = {
				type: 'object',
				properties: nestedSchema.properties,
			};
		} else {
			const regex = /^I[A-Z]/u;
			if (regex.test(value)) {
				const stringRegex = /\[\s*'[^']*'\s*\]/;
				if (stringRegex.test(value)) {
					schemaRef = { type: 'string' };
				} else {
					const refName = value.replace(/\s*\|\s*(null|undefined)/g, '');
					if (refName.endsWith('[]')) {
						schemaRef = {
							type: 'array',
							items: { $ref: `#/components/schemas/${refName.slice(0, -2)}` },
						};
					} else {
						schemaRef = { $ref: `#/components/schemas/${refName}` };
					}
				}
			} else {
				schemaRef = { type: paramTypeMap[value] || 'string' };
			}

			responseSchema.properties![key] = schemaRef;
		}
	}

	return responseSchema;
};

const processEndpoints = (endpoints: IEndpoints, tag: string): Record<string, oas31.PathItemObject> => {
	const paths: Record<string, oas31.PathItemObject> = {};

	for (const [endpoint, methods] of Object.entries(endpoints)) {
		const pathItem: oas31.PathItemObject = {};

		for (const [method, methodData] of Object.entries(methods)) {
			const isPostMethod = method === 'POST';
			const parameters = isPostMethod
				? undefined
				: Object.entries(methodData.params || {}).map(([key, value]) => createParameterObject(key, value, true));

			const requestBodySchema = isPostMethod ? createRequestBodySchema(methodData.params || {}) : undefined;
			const responseSchema = createResponseSchema(methodData.response || {});

			const operation: oas31.OperationObject = {
				tags: [tag],
				requestBody: isPostMethod
					? {
							content: {
								'application/json': {
									schema: requestBodySchema,
								},
							},
					  }
					: undefined,
				parameters,
				responses: {
					'200': {
						description: 'Successful response',
						content: {
							'application/json': {
								schema: responseSchema,
							},
						},
					},
					'400': {
						description: 'Bad request.',
					},
					'401': {
						description: 'Authorization information is missing or invalid.',
					},
				},
				security: [
					{
						ApiKeyAuth: [],
						BearerAuth: [],
					},
				],
			};

			pathItem[method.toLowerCase() as keyof oas31.PathItemObject] = operation;
		}

		paths[endpoint] = pathItem;
	}

	return paths;
};

// main()
const generateApiDoc = (apiData: IApiData): oas31.OpenAPIObject => {
	const openApiTemplate = createBasicTemplate();

	for (const [section, endpoints] of Object.entries(apiData)) {
		const tag = section;
		const paths = processEndpoints(endpoints, tag);
		openApiTemplate.paths = { ...openApiTemplate.paths, ...paths };
	}

	return openApiTemplate;
};

const openApiDoc = generateApiDoc(apiData);
const JsonDoc = JSON.stringify(openApiDoc, null, 2);

// Code to output generated file to folder
const outputFolder = path.join(__dirname, '../../oas');
const outputFilePath = path.join(outputFolder, `apiDoc.json`);

if (!fs.existsSync(outputFolder)) {
	fs.mkdirSync(outputFolder);
}
fs.writeFileSync(outputFilePath, JsonDoc, 'utf-8');
