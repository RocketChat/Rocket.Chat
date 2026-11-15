import { renderHook } from './testing';
import { useClipboard } from './useClipboard';

it('has hasCopied and copy properties', () => {
	const { result } = renderHook(() => useClipboard('Lorem Ipsum'));

	const { copy, hasCopied } = result.current;

	expect(copy).toBeInstanceOf(Function);
	expect(hasCopied).toBe(false);
});
