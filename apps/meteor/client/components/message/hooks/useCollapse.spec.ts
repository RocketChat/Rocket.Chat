import { renderHook, act } from '@testing-library/react-hooks';

import { useCollapse } from './useCollapse';

jest.mock('@rocket.chat/ui-contexts', () => ({
	useAttachmentIsCollapsedByDefault: () => false,
}));

describe('useCollapse', () => {
	it('should default to collapsed state based on collapseByDefault', () => {
		const { result } = renderHook(() => useCollapse(false));
		expect(result.current[0]).toBe(false);
	});

	it('should toggle collapse state', () => {
		const { result } = renderHook(() => useCollapse(false));
		act(() => {
			result.current[1]();
		});
		expect(result.current[0]).toBe(true);
	});

	it('should persist collapse state across remounts when an ID is provided', () => {
		const attachmentId = 'http://example.com/image.png';

		const { result: firstRender } = renderHook(() => useCollapse(false, attachmentId));
		expect(firstRender.current[0]).toBe(false);

		act(() => {
			firstRender.current[1]();
		});
		expect(firstRender.current[0]).toBe(true);

		// Simulating room switch: remounting component with same attachment ID
		const { result: secondRender } = renderHook(() => useCollapse(false, attachmentId));
		expect(secondRender.current[0]).toBe(true);
	});
});
