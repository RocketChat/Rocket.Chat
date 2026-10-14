import { after, afterEach, before, beforeEach, describe, it, mock } from 'node:test';

import type { ISetting } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'expect';
import { fn } from 'jest-mock';
import type { FunctionLike } from 'jest-mock';
import sinon from 'sinon';

import { enterModuleScope, leaveModuleScope } from '../../../../../tests/mocks/moduleScope';

let SettingField: (typeof import('./SettingField'))['default'];
let EditableSettingsProvider: (typeof import('../../settings/EditableSettingsProvider'))['default'];

let clock: sinon.SinonFakeTimers;

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

const dispatchMock = fn<FunctionLike>();

describe('SettingField', () => {
	before(() => {
		enterModuleScope();
		mock.module(require.resolve('@rocket.chat/ui-contexts'), {
			exports: {
				...require('@rocket.chat/ui-contexts'),
				useSettingsDispatch: () => dispatchMock,
			},
		});
		mock.module(require.resolve('@rocket.chat/core-typings'), {
			exports: {
				...require('@rocket.chat/core-typings'),
				isSetting: fn<FunctionLike>().mockReturnValue(true),
			},
		});
		({ default: SettingField } = require('./SettingField'));
		({ default: EditableSettingsProvider } = require('../../settings/EditableSettingsProvider'));
	});

	after(leaveModuleScope);
	beforeEach(() => {
		clock = sinon.useFakeTimers({
			toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'],
			shouldAdvanceTime: true,
		});
		dispatchMock.mockClear();
	});

	afterEach(() => {
		clock.runToLast();
		clock?.restore();
	});

	it('should call dispatch when setting value is changed', async () => {
		const user = userEvent.setup({ advanceTimers: (ms: number) => clock.tick(ms) });

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
		const user = userEvent.setup({ advanceTimers: (ms: number) => clock.tick(ms) });

		render(<SettingField settingId='Test_Setting' />, {
			wrapper: mockAppRoot()
				.wrap((children) => <EditableSettingsProvider>{children}</EditableSettingsProvider>)
				.withSetting('Test_Setting', false, { ...settingStructure, alert: 'Test_Setting_Alert' })
				.build(),
		});

		await user.click(screen.getByRole('checkbox'));

		await act(async () => {
			clock.runToLast();
		});

		expect(dispatchMock).toHaveBeenCalledWith([{ _id: 'Test_Setting', value: true }]);
	});
});
