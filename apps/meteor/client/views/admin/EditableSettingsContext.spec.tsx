import { mockAppRoot as _mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useEditableSettingVisibilityQuery } from './EditableSettingsContext';
import EditableSettingsProvider from './settings/EditableSettingsProvider';

const mockAppRoot = () => _mockAppRoot().wrap((children) => <EditableSettingsProvider>{children}</EditableSettingsProvider>);

describe('useEditableSettingVisibilityQuery', () => {
	it('should return true when no query is provided', () => {
		const { result } = renderHook(() => useEditableSettingVisibilityQuery(), {
			wrapper: mockAppRoot().build(),
		});

		expect(result.current).toBe(true);
	});

	it('should handle settings with a query', () => {
		const { result } = renderHook(() => useEditableSettingVisibilityQuery({ _id: 'setting1', value: true }), {
			wrapper: mockAppRoot().withSetting('setting1', true).build(),
		});

		expect(result.current).toBe(true);
	});

	it('should handle multiple conditions in enableQuery', () => {
		const { result } = renderHook(
			() =>
				useEditableSettingVisibilityQuery([
					{ _id: 'setting5', value: true },
					{ _id: 'setting6', value: true },
				]),
			{
				wrapper: mockAppRoot().withSetting('setting5', true).withSetting('setting6', true).build(),
			},
		);

		expect(result.current).toBe(true);

		const { result: result2 } = renderHook(
			() =>
				useEditableSettingVisibilityQuery([
					{ _id: 'setting5', value: true },
					{ _id: 'setting6', value: true },
				]),
			{
				wrapper: mockAppRoot().withSetting('setting5', true).withSetting('setting6', false).build(),
			},
		);

		expect(result2.current).toBe(false);
	});

	it('should handle string queries', () => {
		const { result } = renderHook(() => useEditableSettingVisibilityQuery(JSON.stringify({ _id: 'setting7', value: true })), {
			wrapper: mockAppRoot().withSetting('setting7', true).build(),
		});

		expect(result.current).toBe(true);
	});
});
