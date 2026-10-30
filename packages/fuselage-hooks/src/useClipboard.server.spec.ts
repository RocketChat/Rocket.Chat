import { renderHook } from './testing.js';
import { useClipboard } from './useClipboard.js';

it('has hasCopied and copy properties', () => {
	const { result } = renderHook(() => useClipboard('Lorem Ipsum'));

	const { copy, hasCopied } = result.current;

	expect(copy).toBeInstanceOf(Function);
	expect(hasCopied).toBe(false);
});
