import * as fs from 'fs';
import * as path from 'path';

import type { oas31 } from 'openapi3-ts';
import type { SchemaObjectType } from 'openapi3-ts/dist/oas30';

import apiData from './compiler';
import { schemas } from './schemas';

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
	},
});

// Type mapping
const paramTypeMap: { [key: string]: SchemaObjectType } = {
	"IRoom['_id']": 'string',
	'string': 'string',
	'boolean': 'boolean',
	"IUser['username'][]": 'array',
	'number': 'integer',
};

const paramFormatMap: { [key: string]: string | undefined } = {
	integer: 'int32',
};

// Helper function to create a parameter object
const createParameterObject = (name: string, type: string, isRequired: boolean): oas31.ParameterObject => {
	const isArray = type.endsWith('[]');
	return {
		name,
		in: 'query',
		required: isRequired,
		schema: {
			type: isArray ? 'array' : paramTypeMap[type],
			format: paramFormatMap[paramTypeMap[type]],
			...(isArray ? { items: { type: paramTypeMap[type.slice(0, -2)] } } : {}),
		},
	};
};

// Helper function to create a schema object for requestBody
const createRequestBodySchema = (params: Record<string, string>): oas31.SchemaObject => {
	const schema: oas31.SchemaObject = { type: 'object', properties: {}, required: [] };
	for (const [key, value] of Object.entries(params)) {
		const isArray = value.endsWith('[]');
		const type = paramTypeMap[isArray ? value.slice(0, -2) : value];
		schema.properties![key] = {
			type: isArray ? 'array' : type,
			format: paramFormatMap[type],
			...(isArray ? { items: { type } } : {}),
		};
		if (!value.includes('?')) {
			schema.required!.push(key);
		}
	}
	return schema;
};

// Helper function to create a schema object for responses
const createResponseSchema = (response: Record<string, any>): oas31.SchemaObject => {
	const responseSchema: oas31.SchemaObject = {
		type: 'object',
		properties: {},
	};

	for (const [key, value] of Object.entries(response || {})) {
		let $ref = value;
		// use logic here: If it starts with "I" the use appropriate schema, if it has ["id"] parse it as string //
		if (['IRoom[]', 'IRoom'].includes(value)) {
			$ref = '#/components/schemas/IRoom';
		} else if (['IUser[]', 'IUser'].includes(value)) {
			$ref = '#/components/schemas/IUser';
		}
		responseSchema.properties![key] = { $ref };
	}

	return responseSchema;
};

// Function to process and add endpoints to the OpenAPI spec
const processEndpoints = (endpoints: IEndpoints, tag: string): Record<string, oas31.PathItemObject> => {
	const paths: Record<string, oas31.PathItemObject> = {};

	for (const [endpoint, methods] of Object.entries(endpoints)) {
		const pathItem: oas31.PathItemObject = {};

		// handle delete also //
		for (const [method, methodData] of Object.entries(methods)) {
			const isGetMethod = method === 'GET';
			const parameters = isGetMethod
				? Object.entries(methodData.params || {}).map(([key, value]) => createParameterObject(key, value, !value.includes('?')))
				: undefined;

			const requestBodySchema = isGetMethod ? undefined : createRequestBodySchema(methodData.params || {});
			const responseSchema = createResponseSchema(methodData.response || {});

			const operation: oas31.OperationObject = {
				tags: [tag],
				requestBody: isGetMethod
					? undefined
					: {
							content: {
								'application/json': {
									schema: requestBodySchema,
								},
							},
					  },
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
				},
			};

			pathItem[method.toLowerCase() as keyof oas31.PathItemObject] = operation;
		}

		paths[endpoint] = pathItem;
	}

	return paths;
};

// Generate the OpenAPI document
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
