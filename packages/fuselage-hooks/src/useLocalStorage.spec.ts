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

it('does not crash and updates state when setItem throws (quota exceeded)', () => {
	const setItemSpy = jest.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
		throw new Error('QuotaExceededError: Storage quota exceeded');
	});

	const { result } = renderHook(() => useLocalStorage('quota-key', 'initial'));
	const [, setValue] = result.current;

	act(() => {
		setValue('updated');
	});

	const [value] = result.current;
	expect(value).toStrictEqual('updated');
	setItemSpy.mockRestore();
});

it('falls back to default value when storage event contains invalid JSON', () => {
	const { result } = renderHook(() => useLocalStorage('event-corrupt-key', 'fallback'));

	act(() => {
		window.dispatchEvent(
			new StorageEvent('storage', {
				storageArea: window.localStorage,
				key: 'fuselage-localStorage-event-corrupt-key',
				newValue: 'invalid-json{',
			}),
		);
	});

	const [value] = result.current;
	expect(value).toStrictEqual('fallback');
});
