import { expect } from 'chai';
import { before, describe, it } from 'mocha';

import { getCredentials, request, credentials } from '../../data/api-data';

type OpenAPIOperation = {
	operationId?: string;
	responses: Record<string, { description?: string; content?: Record<string, { schema?: unknown }> }>;
	parameters?: { name?: string; in?: string; schema?: unknown }[];
	requestBody?: { content?: Record<string, { schema?: unknown }> };
	tags?: string[];
};

type OpenAPIDocument = {
	openapi: string;
	info: { title: string; version: string };
	tags: { name: string }[];
	components: { schemas: Record<string, unknown> };
	paths: Record<string, Record<string, OpenAPIOperation>>;
};

const operations = (document: OpenAPIDocument) =>
	Object.entries(document.paths).flatMap(([path, methods]) =>
		Object.entries(methods).map(([method, operation]) => ({ path, method, operation })),
	);

describe('[OpenAPI]', () => {
	let document: OpenAPIDocument;
	let documentWithUndocumented: OpenAPIDocument;

	before((done) => getCredentials(done));

	before(async () => {
		document = (await request.get('/api/docs/json').set(credentials).expect(200)).body;
		documentWithUndocumented = (await request.get('/api/docs/json?withUndocumented=true').set(credentials).expect(200)).body;
	});

	it('should describe every documented route', () => {
		expect(document).to.have.property('openapi', '3.1.0');
		expect(document.info).to.have.property('title', 'Rocket.Chat API');
		expect(document.tags).to.be.an('array').that.is.not.empty;
		expect(Object.keys(document.paths)).to.not.be.empty;
		expect(document.components.schemas).to.include.keys(['ApiFailureV1', 'ApiSuccessV1']);
		expect(document).to.not.have.property('schemas');
	});

	it('should template path parameters instead of leaking express syntax', () => {
		const expressStyle = Object.keys(documentWithUndocumented.paths).filter((path) => path.includes(':'));

		expect(expressStyle).to.be.empty;
	});

	it('should declare a parameter for every path template', () => {
		const missing = operations(documentWithUndocumented)
			.map(({ path, method, operation }) => {
				const templated = [...path.matchAll(/{([^}]+)}/g)].map(([, name]) => name);
				const declared = (operation.parameters ?? []).filter(({ in: location }) => location === 'path').map(({ name }) => name);

				return { route: `${method} ${path}`, missing: templated.filter((name) => !declared.includes(name)) };
			})
			.filter(({ missing }) => missing.length);

		expect(missing).to.be.empty;
	});

	it('should describe at least one response per operation, always with a description', () => {
		const invalid = operations(documentWithUndocumented)
			.filter(
				({ operation }) =>
					!Object.keys(operation.responses ?? {}).length || Object.values(operation.responses).some((response) => !response.description),
			)
			.map(({ path, method }) => `${method} ${path}`);

		expect(invalid).to.be.empty;
	});

	it('should give every operation a unique operationId', () => {
		const ids = operations(documentWithUndocumented).map(({ operation }) => operation.operationId);

		expect(ids.filter((id) => !id)).to.be.empty;
		expect(new Set(ids).size).to.be.equal(ids.length);
	});

	it('should name and schema every parameter', () => {
		const invalid = operations(documentWithUndocumented)
			.flatMap(({ path, method, operation }) =>
				(operation.parameters ?? []).map((parameter) => ({ route: `${method} ${path}`, parameter })),
			)
			.filter(({ parameter }) => !parameter.name || !parameter.in || !parameter.schema)
			.map(({ route, parameter }) => `${route}: ${JSON.stringify(parameter)}`);

		expect(invalid).to.be.empty;
	});

	it('should hide the undocumented routes from the default document', () => {
		const undocumented = (document: OpenAPIDocument) =>
			operations(document)
				.filter(({ operation }) => operation.tags?.includes('Missing Documentation'))
				.map(({ path, method }) => `${method} ${path}`);

		const documented = operations(document).map(({ path, method }) => `${method} ${path}`);

		// stated as a relation, not as a count: the untyped routes are meant to disappear over time
		expect(undocumented(document)).to.be.empty;
		expect(undocumented(documentWithUndocumented).filter((route) => documented.includes(route))).to.be.empty;
	});
});
