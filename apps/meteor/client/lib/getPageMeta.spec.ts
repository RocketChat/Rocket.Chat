import { getPageMeta } from './getPageMeta';

describe('getPageMeta', () => {
	beforeEach(() => {
		document.head.innerHTML = '';
	});

	it('should return the content attribute of the meta tag', () => {
		const meta = document.createElement('meta');
		meta.setAttribute('name', 'test-meta');
		meta.setAttribute('content', '12345');
		document.head.appendChild(meta);

		const result = getPageMeta('test-meta');
		expect(result).toBe('12345');
	});

	it('should return null when the meta tag does not exist', () => {
		const result = getPageMeta('missing-meta-tag');
		expect(result).toBeNull();
	});

	it('should cache the result and return from cache on subsequent calls', () => {
		const meta = document.createElement('meta');
		meta.setAttribute('name', 'cached-meta');
		meta.setAttribute('content', 'cached-value');
		document.head.appendChild(meta);

		const first = getPageMeta('cached-meta');
		// Remove the meta tag
		document.head.removeChild(meta);
		// Should still return cached value
		const second = getPageMeta('cached-meta');

		expect(first).toBe('cached-value');
		expect(second).toBe('cached-value');
	});
});
