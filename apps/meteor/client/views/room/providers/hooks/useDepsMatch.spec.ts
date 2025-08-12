import { renderHook } from '@testing-library/react';

import { useDepsMatch } from './useDepsMatch';

describe('useDepsMatch', () => {
	it('should return true when dependencies match', () => {
		const { result, rerender } = renderHook(({ deps }) => useDepsMatch(deps), {
			initialProps: { deps: ['dep1', 'dep2'] },
		});

		expect(result.current).toBe(true);

		rerender({ deps: ['dep1', 'dep2'] });

		expect(result.current).toBe(true);
	});

	it('should return false when dependencies do not match', () => {
		const { result, rerender } = renderHook(({ deps }) => useDepsMatch(deps), {
			initialProps: { deps: ['dep1', 'dep2'] },
		});

		expect(result.current).toBe(true);

		rerender({ deps: ['dep1', 'dep3'] });

		expect(result.current).toBe(false);
	});

	it('should return false when dependencies length changes', () => {
		const { result, rerender } = renderHook(({ deps }) => useDepsMatch(deps), {
			initialProps: { deps: ['dep1', 'dep2'] },
		});

		expect(result.current).toBe(true);

		rerender({ deps: ['dep1'] });

		expect(result.current).toBe(false);
	});
});
