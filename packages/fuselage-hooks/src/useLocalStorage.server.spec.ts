import { renderHook } from './testing.js';
import { useLocalStorage } from './useStorage.js';

it('returns a default value', () => {
	const { result } = renderHook(() => useLocalStorage('value-key', 'value-default'));

	const [value] = result.current;
	expect(value).toStrictEqual('value-default');
});
