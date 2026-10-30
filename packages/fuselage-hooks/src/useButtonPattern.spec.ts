import { renderHook } from './testing.js';
import { useButtonPattern } from './useButtonPattern.js';

it('should return the button props', () => {
	const fakeAction = () => console.log('fake action dispatched!');
	const { result } = renderHook(() => useButtonPattern(fakeAction));

	expect(result.current.onClick).toBeDefined();
	expect(result.current.onKeyDown).toBeDefined();
	expect(result.current.role).toBeDefined();
	expect(result.current.tabIndex).toBeDefined();
});
