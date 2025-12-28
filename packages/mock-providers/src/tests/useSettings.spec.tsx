import { useSettings } from '@rocket.chat/ui-contexts';
import { renderHook } from '@testing-library/react';

import { mockAppRoot } from '..';

describe('useSettings', () => {
	it('should return all settings', () => {
		const query = {};
		const { result } = renderHook(() => useSettings(query), {
			wrapper: mockAppRoot().withSetting('asd', 'qwe').withSetting('zxc', 'rty').build(),
		});
		expect(result.current).toEqual([
			{
				_id: 'asd',
				value: 'qwe',
			},
			{
				_id: 'zxc',
				value: 'rty',
			},
		]);
	});

	it('should return settings filtered by _id', () => {
		const query = {
			_id: ['asd'],
		};
		const { result } = renderHook(() => useSettings(query), {
			wrapper: mockAppRoot().withSetting('asd', 'qwe').withSetting('zxc', 'rty').build(),
		});
		expect(result.current).toEqual([
			{
				_id: 'asd',
				value: 'qwe',
			},
		]);
	});
});
