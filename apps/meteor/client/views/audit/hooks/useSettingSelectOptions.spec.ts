import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';

import { useSettingSelectOptions } from './useSettingSelectOptions';

// TODO: check if the return of items matches the settings we mocked
describe('useSettingSelectOptions', () => {
	it('should return the ordered list of options', async () => {
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

		await waitFor(() => expect(result.current?.data?.pages[0][0]).toEqual({ _id: 'test1', label: 'test1', value: 'test1' }));
		await waitFor(() => expect(result.current?.data?.pages[0][1]).toEqual({ _id: 'test2', label: 'test2', value: 'test2' }));
		await waitFor(() => expect(result.current?.data?.pages[0][2]).toEqual({ _id: 'test3', label: 'test3', value: 'test3' }));
		await waitFor(() => expect(result.current?.data?.pages[0][3]).toEqual({ _id: 'test4', label: 'test4', value: 'test4' }));
		await waitFor(() => expect(result.current?.data?.pages[0][4]).toEqual({ _id: 'test5', label: 'test5', value: 'test5' }));
		await waitFor(() => expect(result.current?.data?.pages[0][5]).toEqual({ _id: 'test6', label: 'test6', value: 'test6' }));
		await waitFor(() => expect(result.current?.data?.pages[0][6]).toEqual({ _id: 'test7', label: 'test7', value: 'test7' }));
		await waitFor(() => expect(result.current?.data?.pages[0][7]).toEqual({ _id: 'test8', label: 'test8', value: 'test8' }));
		await waitFor(() => expect(result.current?.data?.pages[0][8]).toEqual({ _id: 'test9', label: 'test9', value: 'test9' }));
		await waitFor(() => expect(result.current?.data?.pages[0][9]).toEqual({ _id: 'test10', label: 'test10', value: 'test10' }));
		await waitFor(() => expect(result.current?.data?.pages[0][10]).toEqual({ _id: 'test11', label: 'test11', value: 'test11' }));
		await waitFor(() => expect(result.current?.data?.pages[0][11]).toEqual({ _id: 'test12', label: 'test12', value: 'test12' }));
		await waitFor(() => expect(result.current?.data?.pages[0][12]).toEqual({ _id: 'test13', label: 'test13', value: 'test13' }));
		await waitFor(() => expect(result.current?.data?.pages[0][13]).toEqual({ _id: 'test14', label: 'test14', value: 'test14' }));
		await waitFor(() => expect(result.current?.data?.pages[0][14]).toEqual({ _id: 'test15', label: 'test15', value: 'test15' }));

		await waitFor(() => expect(result.current?.data?.pages[0]).toHaveLength(15));
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

		await waitFor(() => expect(result.current?.data?.pages[0][0]).toEqual({ _id: 'test1', label: 'test1', value: 'test1' }));
		await waitFor(() => expect(result.current?.data?.pages[0][1]).toEqual({ _id: 'test10', label: 'test10', value: 'test10' }));
		await waitFor(() => expect(result.current?.data?.pages[0][2]).toEqual({ _id: 'test11', label: 'test11', value: 'test11' }));
		await waitFor(() => expect(result.current?.data?.pages[0][3]).toEqual({ _id: 'test12', label: 'test12', value: 'test12' }));
		await waitFor(() => expect(result.current?.data?.pages[0][4]).toEqual({ _id: 'test13', label: 'test13', value: 'test13' }));
		await waitFor(() => expect(result.current?.data?.pages[0][5]).toEqual({ _id: 'test14', label: 'test14', value: 'test14' }));
		await waitFor(() => expect(result.current?.data?.pages[0][6]).toEqual({ _id: 'test15', label: 'test15', value: 'test15' }));
		await waitFor(() => expect(result.current?.data?.pages[0]).toHaveLength(7));
	});
});
