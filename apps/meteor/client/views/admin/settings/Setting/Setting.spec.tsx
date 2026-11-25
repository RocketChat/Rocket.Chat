import type { ISetting } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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

it('shows and saves the opposite of an inverted setting', async () => {
	render(<Setting settingId='Inverted' />, {
		wrapper: mockAppRoot()
			.withSetting('Inverted', true, booleanSetting({ i18nLabel: 'Inverted', packageValue: false, inverted: true }))
			.wrap((children) => <EditableSettingsProvider>{children}</EditableSettingsProvider>)
			.build(),
	});

	const toggle = screen.getByRole('checkbox', { name: 'Inverted' });
	expect(toggle).not.toBeChecked();

	await userEvent.click(toggle);

	expect(toggle).toBeChecked();
});

it('links the docsLink tag of the alert to the alert link', () => {
	render(<Setting settingId='Danger' />, {
		wrapper: mockAppRoot()
			.withSetting('Danger', false, booleanSetting({ i18nLabel: 'Danger', alert: 'Danger_Alert', alertLink: 'https://docs.example.com' }))
			.withTranslations('en', 'core', { Danger_Alert: 'Review the <docsLink>documentation</docsLink>.' })
			.wrap((children) => <EditableSettingsProvider>{children}</EditableSettingsProvider>)
			.build(),
	});

	expect(screen.getByRole('link', { name: 'documentation' })).toHaveAttribute('href', 'https://docs.example.com');
});
