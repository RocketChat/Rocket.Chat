import { getQueryPath } from './validate';

describe('getQueryPath', () => {
	it('should generate the correct query path without trailing slash', () => {
		const partialPathname = '/cas';
		const validatePath = 'validate';
		const query = { ticket: 'ST-12345', service: 'https://myapp.com' };

		const result = getQueryPath(partialPathname, validatePath, query);

		expect(result).toBe('/cas/validate?ticket=ST-12345&service=https%3A%2F%2Fmyapp.com');
	});

	it('should generate the correct query path with trailing slash', () => {
		const partialPathname = '/cas/';
		const validatePath = 'validate';
		const query = { ticket: 'ST-12345', service: 'https://myapp.com' };

		const result = getQueryPath(partialPathname, validatePath, query);

		expect(result).toBe('/cas/validate?ticket=ST-12345&service=https%3A%2F%2Fmyapp.com');
	});

	it('should generate the correct query path with `/` partialPathname', () => {
		const partialPathname = '/';
		const validatePath = 'validate';
		const query = { ticket: 'ST-12345', service: 'https://myapp.com' };

		const result = getQueryPath(partialPathname, validatePath, query);

		expect(result).toBe('/validate?ticket=ST-12345&service=https%3A%2F%2Fmyapp.com');
	});

	it('should generate the correct query path with empty partialPathname', () => {
		const partialPathname = '';
		const validatePath = 'validate';
		const query = { ticket: 'ST-12345', service: 'https://myapp.com' };

		const result = getQueryPath(partialPathname, validatePath, query);

		expect(result).toBe('/validate?ticket=ST-12345&service=https%3A%2F%2Fmyapp.com');
	});

	it('should generate the correct query path with empty query', () => {
		const partialPathname = '/cas';
		const validatePath = 'validate';
		const query = {};

		const result = getQueryPath(partialPathname, validatePath, query);

		expect(result).toBe('/cas/validate');
	});
});
