import { renderHook, act } from './testing.js';
import { useLocalStorage } from './useStorage.js';

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
