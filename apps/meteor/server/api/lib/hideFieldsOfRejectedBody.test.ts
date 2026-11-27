import { describe, it } from 'node:test';

import Ajv from 'ajv';
import { expect } from 'chai';

import { hideFieldsOfRejectedBody } from './hideFieldsOfRejectedBody';

type Body = { name: string; content: string };

const compile = () =>
	new Ajv().compile<Body>({
		type: 'object',
		properties: { name: { type: 'string' }, content: { type: 'string' } },
		required: ['name', 'content'],
		additionalProperties: false,
	});

describe('hideFieldsOfRejectedBody', () => {
	it('should accept a valid body and leave it untouched', () => {
		const validate = hideFieldsOfRejectedBody(compile(), ['content']);
		const body = { name: 'notes.md', content: 'secret' };

		expect(validate(body)).to.be.true;
		expect(body).to.deep.equal({ name: 'notes.md', content: 'secret' });
	});

	it('should replace the named fields of a rejected body with their length', () => {
		const validate = hideFieldsOfRejectedBody(compile(), ['content']);
		const body = { name: 'notes.md', content: 'secret', unknown: true };

		expect(validate(body)).to.be.false;
		expect(body).to.deep.equal({ name: 'notes.md', content: '[6 characters]', unknown: true });
	});

	it('should report the errors of the validator it wraps', () => {
		const validate = hideFieldsOfRejectedBody(compile(), ['content']);

		validate({ name: 'notes.md' });

		expect(validate.errors?.map(({ message }) => message)).to.deep.equal(["must have required property 'content'"]);
	});

	it('should expose the schema of the validator it wraps', () => {
		const inner = compile();

		expect(hideFieldsOfRejectedBody(inner, ['content']).schema).to.equal(inner.schema);
	});

	it('should reject a body that is not an object without failing', () => {
		const validate = hideFieldsOfRejectedBody(compile(), ['content']);

		expect(validate('secret')).to.be.false;
		expect(validate(null)).to.be.false;
	});
});
