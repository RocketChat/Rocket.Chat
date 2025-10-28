import type { ISetting } from '@rocket.chat/apps-engine/definition/settings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { useSettingStructure } from '@rocket.chat/ui-contexts';
import { renderHook } from '@testing-library/react';

describe('useSettingStructure', () => {
	it('should return setting structure from context', () => {
		const settingStructure = {
			_id: 'Force_SSL',
			type: 'boolean' as const,
			public: true,
			env: false,
			blocked: false,
			packageValue: true,
			i18nLabel: 'Force_SSL',
			sorter: 0,
			ts: new Date(),
			createdAt: new Date(),
			required: false,
			id: 'Force_SSL',
			value: true,
		} as ISetting;

		const { result } = renderHook(() => useSettingStructure('Force_SSL'), {
			wrapper: mockAppRoot().withSetting('Force_SSL', true, settingStructure).build(),
		});

		expect(result.current).toEqual(settingStructure);
	});

	it('should return undefined when setting does not exist', () => {
		const { result } = renderHook(() => useSettingStructure('non-existent-setting'), {
			wrapper: mockAppRoot().build(),
		});

		expect(result.current).toBeUndefined();
	});
});
