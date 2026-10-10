import { renderHook, act } from './testing';
import { useSessionStorage } from './useStorage';

it('returns a default value', () => {
	const { result } = renderHook(() => useSessionStorage('value-key', 'value-default'));

	const [value] = result.current;
	expect(value).toStrictEqual('value-default');
});

it('returns a new value', () => {
	const { result } = renderHook(() => useSessionStorage('value-key', 'value-default'));
	const [, setValue] = result.current;

	act(() => {
		setValue('value-new');
	});

	const [value] = result.current;
	expect(value).toStrictEqual('value-new');
});
