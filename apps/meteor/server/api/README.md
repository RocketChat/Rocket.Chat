# API Development Guidelines

## Creating Automatic OpenAPI Specifications

When developing new endpoints or modifying existing ones, follow these guidelines to ensure automatic OpenAPI specification generation and request/response validation.

### Using Status Codes and AJV Schema

1. **Status Codes**: Ensure that each response from your endpoint includes the appropriate HTTP status code.
2. **AJV Schema Validation**: Use the AJV schema to validate the response structure. This ensures that the response adheres to the defined schema.
3. **Query and Body Parameters**: Use the new `query` and `body` parameters to validate the inputs to your endpoints. This ensures that the incoming request data adheres to the defined schema.

### Steps to Follow

1. **Define the Schema**: Create a schema for your endpoint response using AJV. This schema will be used to validate the response structure.
2. **Optional Input Validation**: Optionally, you can validate your input parameters (query and body) using AJV schemas. This helps ensure that the incoming request data adheres to the defined schema.
3. **Validation in Test Environments**: When an endpoint is created or changed, the response will be validated in TEST environments. If the response does not match the schema, an error will be thrown.

### Deprecation Notice

The `addRoute` method is now deprecated. Instead, use the following methods available inside the API instance:

- `.get`
- `.post`
- `.put`
- `.delete`

These methods provide a more structured and clear approach to defining your API endpoints.

The `validateParams` property is now deprecated. Instead, use the `query` and `body` properties to validate the inputs to your endpoints. This change provides a more structured and clear approach to input validation.

### Example

Here is an example of how to define an endpoint using the new methods and schema validation:

```typescript
import { API } from 'path/to/api';
import Ajv from 'ajv';

const ajv = new Ajv();

API.v1
	.get(
		'endpoint-name',
		{
			authRequired: true,
			query: ajv.compile({
					type: 'object',
					properties: {
						param1: { type: 'string' },
						param2: { type: 'number' },
					},
					required: ['param1'],
			}),
			body: ajv.compile({
					type: 'object',
					properties: {
						field1: { type: 'string' },
						field2: { type: 'boolean' },
					},
					required: ['field1'],
			}),
			response: {
				200: ajv.compile({
					additionalProperties: false,
				    type: 'object',
                    properties: {
						count: {
							type: 'number',
							description: 'The number of sounds returned in this response.',
						},
						offset: {
							type: 'number',
							description: 'The number of sounds that were skipped in this response.',
						},
						total: {
							type: 'number',
							description: 'The total number of sounds that match the query.',
						},
						success: {
							type: 'boolean',
							description: 'Indicates if the request was successful.',
						},
						items: {
							type: 'array',
							items: {
								type: 'object',
								properties: {
								_id: {
									type: 'string',
								},
								prop1: {
									type: 'number',
								},
								prop2: {
									type: 'string',
								},
								prop3: {
									type: 'string',
								},
							},
							required: ['_id', 'prop1', 'prop2', 'prop3'],
							},
						},
					},
				}),
				401: ajv.compile({
					additionalProperties: false,
					type: 'object',
					properties: {
						error: {
							type: 'string',
						},
						status: {
							type: 'string',
							nullable: true,
						},
						message: {
							type: 'string',
							nullable: true,
						},
						success: {
							type: 'boolean',
							description: 'Indicates if the request was successful.',
						},
					},
					required: ['success', 'error'],
				}),
			},
		},

		async function action() {
			const result = await anyLogic();
			return API.v1.success(result);
		},
	)
```

By following these guidelines, you ensure that your API endpoints are well-documented, validated, and maintainable.