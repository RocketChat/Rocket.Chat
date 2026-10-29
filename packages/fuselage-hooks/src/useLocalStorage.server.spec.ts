import { renderHook } from './testing';
import { useLocalStorage } from './useStorage';

it('returns a default value', () => {
	const { result } = renderHook(() => useLocalStorage('value-key', 'value-default'));

	const [value] = result.current;
	expect(value).toStrictEqual('value-default');
});
