import type { ISetting } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SettingField from './SettingField';
import EditableSettingsProvider from '../../settings/EditableSettingsProvider';

const settingStructure = {
	packageValue: false,
	blocked: false,
	public: true,
	type: 'boolean',
	i18nLabel: 'Test_Setting',
	i18nDescription: 'Test_Setting_Description',
	enableQuery: undefined,
	displayQuery: undefined,
} as Partial<ISetting>;

const dispatchMock = jest.fn();

jest.mock('@rocket.chat/ui-contexts', () => ({
	...jest.requireActual('@rocket.chat/ui-contexts'),
	useSettingsDispatch: () => dispatchMock,
}));
jest.mock('@rocket.chat/core-typings', () => ({
	...jest.requireActual('@rocket.chat/core-typings'),
	isSetting: jest.fn().mockReturnValue(true),
}));

describe('SettingField', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		dispatchMock.mockClear();
	});

	afterEach(() => {
		jest.runOnlyPendingTimers();
		jest.useRealTimers();
	});

	it('should call dispatch when setting value is changed', async () => {
		const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

		render(<SettingField settingId='Test_Setting' />, {
			wrapper: mockAppRoot()
				.wrap((children) => <EditableSettingsProvider>{children}</EditableSettingsProvider>)
				.withSetting('Test_Setting', false, settingStructure)
				.build(),
		});

		const checkbox = screen.getByRole('checkbox');
		await user.click(checkbox);

		await waitFor(() => {
			expect(dispatchMock).toHaveBeenCalled();
		});
	});

	it('should dispatch when the setting has an alert (confirmation is handled by the settings dispatch)', async () => {
		const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

		render(<SettingField settingId='Test_Setting' />, {
			wrapper: mockAppRoot()
				.wrap((children) => <EditableSettingsProvider>{children}</EditableSettingsProvider>)
				.withSetting('Test_Setting', false, { ...settingStructure, alert: 'Test_Setting_Alert' })
				.build(),
		});

		await user.click(screen.getByRole('checkbox'));

		await act(async () => {
			jest.runOnlyPendingTimers();
		});

		expect(dispatchMock).toHaveBeenCalledWith([{ _id: 'Test_Setting', value: true }]);
	});
});
