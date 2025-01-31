import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';

import { useSettingSelectOptions } from './useSettingSelectOptions';

// TODO: check if the return of items matches the settings we mocked
describe('useSettingSelectOptions', () => {
	it('should return the list of options', async () => {
		const { result } = renderHook(() => useSettingSelectOptions(), {
			wrapper: mockAppRoot()
				.withSetting('test1', true)
				.withSetting('test2', true)
				.withSetting('test3', true)
				.withSetting('test4', true)
				.withSetting('test5', true)
				.withSetting('test6', true)
				.withSetting('test7', true)
				.withSetting('test8', true)
				.withSetting('test9', true)
				.withSetting('test10', true)
				.withSetting('test11', true)
				.withSetting('test12', true)
				.withSetting('test13', true)
				.withSetting('test14', true)
				.withSetting('test15', true)
				.build(),
		});

		await waitFor(() => expect(result.current.itemsList.items).toContainEqual({ _id: 'test1', label: 'test1', value: 'test1' }));
		await waitFor(() => expect(result.current.itemsList.items).toHaveLength(15));
	});

	it('should return the list of filtered options', async () => {
		const { result } = renderHook(() => useSettingSelectOptions('TeSt1'), {
			wrapper: mockAppRoot()
				.withSetting('test1', true)
				.withSetting('test2', true)
				.withSetting('test3', true)
				.withSetting('test4', true)
				.withSetting('test5', true)
				.withSetting('test6', true)
				.withSetting('test7', true)
				.withSetting('test8', true)
				.withSetting('test9', true)
				.withSetting('test10', true)
				.withSetting('test11', true)
				.withSetting('test12', true)
				.withSetting('test13', true)
				.withSetting('test14', true)
				.withSetting('test15', true)
				.build(),
		});

		await waitFor(() => expect(result.current.itemsList.items).toContainEqual({ _id: 'test1', label: 'test1', value: 'test1' }));
		await waitFor(() => expect(result.current.itemsList.items).toContainEqual({ _id: 'test10', label: 'test10', value: 'test10' }));
		await waitFor(() => expect(result.current.itemsList.items).toContainEqual({ _id: 'test11', label: 'test11', value: 'test11' }));
		await waitFor(() => expect(result.current.itemsList.items).toContainEqual({ _id: 'test12', label: 'test12', value: 'test12' }));
		await waitFor(() => expect(result.current.itemsList.items).toContainEqual({ _id: 'test13', label: 'test13', value: 'test13' }));
		await waitFor(() => expect(result.current.itemsList.items).toContainEqual({ _id: 'test14', label: 'test14', value: 'test14' }));
		await waitFor(() => expect(result.current.itemsList.items).toContainEqual({ _id: 'test15', label: 'test15', value: 'test15' }));
		await waitFor(() => expect(result.current.itemsList.items).toHaveLength(7));
	});
});
