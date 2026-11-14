import { createFakeMessage } from '..';

describe('fixtures', () => {
	it('should give every message a distinct id', () => {
		const [first, second] = [createFakeMessage(), createFakeMessage()];

		expect(first._id).not.toBe(second._id);
	});

	it('should keep the overrides of nested fields', () => {
		const message = createFakeMessage({ u: { _id: 'someone', username: 'someone' } });

		expect(message.u).toMatchObject({ _id: 'someone', username: 'someone', name: 'Author' });
	});
});
