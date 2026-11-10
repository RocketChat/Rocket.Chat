import { renderHook } from '@testing-library/react';

import { useAutoCompleteKey } from './useAutoCompleteKey';

it('changes the key once the selected options load, and keeps it when a later search leaves them out', () => {
	const { result, rerender } = renderHook(({ options }) => useAutoCompleteKey(['general'], options), {
		initialProps: { options: [] as { value: string }[] },
	});

	expect(result.current).toBe('selection-loading');

	rerender({ options: [{ value: 'general' }] });
	expect(result.current).toBe('selection-loaded');

	rerender({ options: [{ value: 'random' }] });
	expect(result.current).toBe('selection-loaded');
});
