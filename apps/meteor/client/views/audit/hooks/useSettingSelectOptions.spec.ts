import type { ISetting } from '@rocket.chat/core-typings';
import { renderHook } from '@testing-library/react';

import { useSettingSelectOptions } from './useSettingSelectOptions';

const getMockSettings = (): ISetting[] => {
	return [
		{
			_id: 'Accounts_AllowAnonymousRead',
			value: false,
			packageValue: false,
			valueSource: 'packageValue',
			secret: false,
			enterprise: false,
			i18nDescription: 'Accounts_AllowAnonymousRead_Description',
			autocomplete: true,
			sorter: -1,
			ts: new Date('2024-12-30T14:18:51.804Z'),
			createdAt: new Date('2024-12-30T14:18:51.804Z'),
			_updatedAt: new Date('2024-12-30T14:18:51.804Z'),
			type: 'boolean',
			group: 'Accounts',
			public: true,
			i18nLabel: 'Accounts_AllowAnonymousRead',
			hidden: false,
			blocked: false,
			requiredOnWizard: false,
			env: false,
		},
		{
			_id: 'Accounts_AllowFeaturePreview',
			value: false,
			packageValue: false,
			valueSource: 'packageValue',
			secret: false,
			enterprise: false,
			i18nDescription: 'Accounts_AllowFeaturePreview_Description',
			autocomplete: true,
			sorter: -1,
			ts: new Date('2024-12-30T14:18:51.804Z'),
			createdAt: new Date('2024-12-30T14:18:51.804Z'),
			_updatedAt: new Date('2024-12-30T14:18:51.804Z'),
			type: 'boolean',
			group: 'Accounts',
			public: true,
			i18nLabel: 'Accounts_AllowFeaturePreview',
			hidden: false,
			blocked: false,
			requiredOnWizard: false,
			env: false,
		},
		{
			_id: 'Accounts_AllowRegistration',
			value: false,
			packageValue: false,
			valueSource: 'packageValue',
			secret: false,
			enterprise: false,
			i18nDescription: 'Accounts_AllowRegistration_Description',
			autocomplete: true,
			sorter: -1,
			ts: new Date('2024-12-30T14:18:51.804Z'),
			createdAt: new Date('2024-12-30T14:18:51.804Z'),
			_updatedAt: new Date('2024-12-30T14:18:51.804Z'),
			type: 'boolean',
			group: 'Accounts',
			public: true,
			i18nLabel: 'Accounts_AllowRegistration',
			hidden: false,
			blocked: false,
			requiredOnWizard: false,
			env: false,
		},
		{
			_id: 'Accounts_AllowSignup',
			value: false,
			packageValue: false,
			valueSource: 'packageValue',
			secret: false,
			enterprise: false,
			i18nDescription: 'Accounts_AllowSignup_Description',
			autocomplete: true,
			sorter: -1,
			ts: new Date('2024-12-30T14:18:51.804Z'),
			createdAt: new Date('2024-12-30T14:18:51.804Z'),
			_updatedAt: new Date('2024-12-30T14:18:51.804Z'),
			type: 'boolean',
			group: 'Accounts',
			public: true,
			i18nLabel: 'Accounts_AllowSignup',
			hidden: false,
			blocked: false,
			requiredOnWizard: false,
			env: false,
		},
	];
};

jest.mock('@rocket.chat/ui-contexts', () => ({
	useSettings: () => getMockSettings(),
	useSettingsCount: () => getMockSettings().length,
}));

describe('useSettingSelectOptions', () => {
	it('should return the list of options', () => {
		const { result } = renderHook(() => useSettingSelectOptions(), {});

		expect(result.current.itemsList.items).toBeDefined();
	});
});
