import { useRef } from 'react';

import { renderHook } from './testing';
import { useContentBoxSize } from './useContentBoxSize';

it('immediately returns zero size', () => {
	const { result } = renderHook(() => useContentBoxSize(useRef(null)));

	expect(result.current.inlineSize).toStrictEqual(0);
	expect(result.current.blockSize).toStrictEqual(0);
});
