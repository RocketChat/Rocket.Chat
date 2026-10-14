import { after, before, beforeEach, describe, it, mock } from 'node:test';

import type { ISetting } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'expect';
import type { FunctionLike } from 'jest-mock';
import { ModuleMocker } from 'jest-mock';
import type { PropsWithChildren } from 'react';

import { enterModuleScope, leaveModuleScope } from '../../../../../tests/mocks/moduleScope';

let SettingsGroupPage: (typeof import('./SettingsGroupPage'))['default'];
let EditableSettingsProvider: (typeof import('../EditableSettingsProvider'))['default'];
let SettingsSection: (typeof import('../SettingsSection'))['default'];

const mocker = new ModuleMocker(globalThis);
const fn: ModuleMocker['fn'] = mocker.fn.bind(mocker);

const mockSettingsDispatch = fn<FunctionLike>();

const settingStructure = {
	packageValue: 2,
	blocked: false,
	public: true,
	type: 'int',
	group: 'Test_Group',
	section: '',
	sorter: 0,
	i18nLabel: 'Test_Integer',
} as Partial<ISetting>;

describe('SettingsGroupPage', () => {
	before(() => {
		enterModuleScope();
		mock.module(require.resolve('@rocket.chat/ui-contexts'), {
			exports: {
				...require('@rocket.chat/ui-contexts'),
				useSettingsDispatch: () => mockSettingsDispatch,
			},
		});
		mock.module(require.resolve('@rocket.chat/ui-client'), {
			exports: {
				...require('@rocket.chat/ui-client'),
				PageFooter: ({ children }: PropsWithChildren) => <footer>{children}</footer>,
			},
		});
		mock.module('../hooks/useHasSettingModule', {
			exports: {
				useHasSettingModule: () => false,
			},
		});
		({ default: SettingsGroupPage } = require('./SettingsGroupPage'));
		({ default: EditableSettingsProvider } = require('../EditableSettingsProvider'));
		({ default: SettingsSection } = require('../SettingsSection'));
	});

	after(leaveModuleScope);
	beforeEach(() => {
		mocker.clearAllMocks();
	});

	it('should show an error toast when saving a cleared integer setting fails', async () => {
		const error = new Error('Invalid integer value');
		const mockDispatchToastMessage = fn<FunctionLike>();
		mockSettingsDispatch.mockRejectedValue(error);

		render(
			<SettingsGroupPage _id='Test_Group' i18nLabel='Test_Group'>
				<SettingsSection groupId='Test_Group' sectionName='' solo />
			</SettingsGroupPage>,
			{
				wrapper: mockAppRoot()
					.wrap((children) => <EditableSettingsProvider>{children}</EditableSettingsProvider>)
					.withSetting('Test_Integer', 2, settingStructure)
					.withToastMessageDispatch(mockDispatchToastMessage)
					.build(),
			},
		);

		await userEvent.clear(screen.getByRole('spinbutton'));

		const saveButton = screen.getByRole('button', { name: 'Save_changes' });
		await waitFor(() => expect(saveButton).toBeEnabled());
		await userEvent.click(saveButton);

		await waitFor(() => {
			expect(mockSettingsDispatch).toHaveBeenCalledWith([{ _id: 'Test_Integer', value: NaN }], expect.any(Function));
			expect(mockDispatchToastMessage).toHaveBeenCalledWith({ type: 'error', message: error });
		});
	});
});
