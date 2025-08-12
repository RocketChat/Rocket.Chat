import { renderHook } from '@testing-library/react';

import { useDocumentTitle } from './useDocumentTitle';

const DEFAULT_TITLE = 'Default Title';
const EXAMPLE_TITLE = 'Example Title';

it('should return the default title', () => {
	const { result } = renderHook(() => useDocumentTitle(DEFAULT_TITLE));

	expect(result.current.title).toBe(DEFAULT_TITLE);
});

it('should return the default title and empty key value if refocus param is false', () => {
	const { result } = renderHook(() => useDocumentTitle(DEFAULT_TITLE, false));

	expect(result.current.title).toBe(DEFAULT_TITLE);
	expect(result.current.key).toBe('');
});

it('should return the default title and the example title concatenated', () => {
	const { result } = renderHook(() => {
		useDocumentTitle(DEFAULT_TITLE);
		return useDocumentTitle(EXAMPLE_TITLE);
	});

	expect(result.current.title).toBe(`${EXAMPLE_TITLE} - ${DEFAULT_TITLE}`);
});
