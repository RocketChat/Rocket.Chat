import type { ISetting } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import Setting from './Setting';
import EditableSettingsProvider from '../EditableSettingsProvider';

const booleanSetting = (overrides: Partial<ISetting>) =>
	({
		type: 'boolean',
		i18nLabel: 'Origin',
		packageValue: true,
		public: true,
		blocked: false,
		sorter: 0,
		...overrides,
	}) as Partial<ISetting>;

const renderOriginSetting = ({ parentValue, globalValue = true }: { parentValue: boolean; globalValue?: boolean }) =>
	render(<Setting settingId='Origin' />, {
		wrapper: mockAppRoot()
			.withSetting('Global', globalValue, booleanSetting({ i18nLabel: 'Global' }))
			.withSetting('Parent', parentValue, booleanSetting({ i18nLabel: 'Parent' }))
			.withSetting(
				'Origin',
				false,
				booleanSetting({
					enableQuery: JSON.stringify([
						{ _id: 'Parent', value: true },
						{ _id: 'Global', value: true },
					]),
					disabledValue: { value: true, query: { _id: 'Parent', value: false } },
				}),
			)
			.wrap((children) => <EditableSettingsProvider>{children}</EditableSettingsProvider>)
			.build(),
	});

it('shows the disabled value while its query disables the setting', () => {
	renderOriginSetting({ parentValue: false });

	expect(screen.getByRole('checkbox', { name: 'Origin' })).toBeChecked();
	expect(screen.getByRole('checkbox', { name: 'Origin' })).toBeDisabled();
});

it('shows the stored value while another part of the enable query disables the setting', () => {
	renderOriginSetting({ parentValue: true, globalValue: false });

	expect(screen.getByRole('checkbox', { name: 'Origin' })).not.toBeChecked();
	expect(screen.getByRole('checkbox', { name: 'Origin' })).toBeDisabled();
});

it('shows the stored value while the setting is enabled', () => {
	renderOriginSetting({ parentValue: true });

	expect(screen.getByRole('checkbox', { name: 'Origin' })).not.toBeChecked();
	expect(screen.getByRole('checkbox', { name: 'Origin' })).toBeEnabled();
});
