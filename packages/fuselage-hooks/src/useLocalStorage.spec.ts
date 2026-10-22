import { renderHook, act } from './testing';
import { useLocalStorage } from './useStorage';

it('returns a default value', () => {
	const { result } = renderHook(() => useLocalStorage('value-key', 'value-default'));

	const [value] = result.current;
	expect(value).toStrictEqual('value-default');
});

it('returns a new value', () => {
	const { result } = renderHook(() => useLocalStorage('value-key', 'value-default'));
	const [, setValue] = result.current;

	act(() => {
		setValue('value-new');
	});

	const [value] = result.current;
	expect(value).toStrictEqual('value-new');
});

it('falls back to default value when stored item is invalid JSON', () => {
	window.localStorage.setItem('fuselage-localStorage-corrupt-key', 'invalid-json{');

	const { result } = renderHook(() => useLocalStorage('corrupt-key', 'value-fallback'));
	const [value] = result.current;

	expect(value).toStrictEqual('value-fallback');
});

it('does not crash when localStorage.getItem throws an exception', () => {
	const getItemSpy = jest.spyOn(Storage.prototype, 'getItem').mockImplementationOnce(() => {
		throw new Error('SecurityError: Access denied');
	});

	const { result } = renderHook(() => useLocalStorage('blocked-key', 'value-fallback'));
	const [value] = result.current;

	expect(value).toStrictEqual('value-fallback');
	getItemSpy.mockRestore();
});
