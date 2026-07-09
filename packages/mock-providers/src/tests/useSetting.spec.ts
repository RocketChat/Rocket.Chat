import { useSetting } from '@rocket.chat/ui-contexts';
import { renderHook } from '@testing-library/react';

import { mockAppRoot } from '..';

describe('useSetting', () => {
	it('should return settings from context', () => {
		const { result } = renderHook(() => useSetting('asd'), {
			wrapper: mockAppRoot().withSetting('asd', 'qwe').build(),
		});
		expect(result.current).toEqual('qwe');
	});
});
