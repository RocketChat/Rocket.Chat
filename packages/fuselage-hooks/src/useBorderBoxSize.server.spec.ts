import { useRef } from 'react';

import { renderHook } from './testing.js';
import { useBorderBoxSize } from './useBorderBoxSize.js';

it('immediately returns zero size', () => {
	const { result } = renderHook(() => useBorderBoxSize(useRef(null)));

	expect(result.current.inlineSize).toStrictEqual(0);
	expect(result.current.blockSize).toStrictEqual(0);
});
