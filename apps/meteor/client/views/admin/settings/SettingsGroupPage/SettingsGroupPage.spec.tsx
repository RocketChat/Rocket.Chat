import type { ISetting } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PropsWithChildren } from 'react';

import SettingsGroupPage from './SettingsGroupPage';
import EditableSettingsProvider from '../EditableSettingsProvider';
import SettingsSection from '../SettingsSection';

const mockSettingsDispatch = jest.fn();

jest.mock('@rocket.chat/ui-contexts', () => ({
	...jest.requireActual('@rocket.chat/ui-contexts'),
	useSettingsDispatch: () => mockSettingsDispatch,
}));

jest.mock('@rocket.chat/ui-client', () => ({
	...jest.requireActual('@rocket.chat/ui-client'),
	PageFooter: ({ children }: PropsWithChildren) => <footer>{children}</footer>,
}));

jest.mock('../hooks/useHasSettingModule', () => ({
	useHasSettingModule: () => false,
}));

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
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should show an error toast when saving a cleared integer setting fails', async () => {
		const error = new Error('Invalid integer value');
		const mockDispatchToastMessage = jest.fn();
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
