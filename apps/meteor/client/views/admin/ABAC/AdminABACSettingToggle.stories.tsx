import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';

import AdminABACSettingToggle from './AdminABACSettingToggle';
import { createFakeLicenseInfo } from '../../../../tests/mocks/data';
import EditableSettingsProvider from '../settings/EditableSettingsProvider';

const meta: Meta<typeof AdminABACSettingToggle> = {
	title: 'Admin/ABAC/AdminABACSettingToggle',
	component: AdminABACSettingToggle,
	parameters: {
		layout: 'padded',
	},
	decorators: [
		(Story) => {
			const AppRoot = mockAppRoot()
				.wrap((children) => <EditableSettingsProvider>{children}</EditableSettingsProvider>)
				.withTranslations('en', 'core', {
					ABAC_Enabled: 'Enable ABAC',
					ABAC_Enabled_Description: 'Enable Attribute-Based Access Control',
					ABAC_Warning_Modal_Title: 'Disable ABAC',
					ABAC_Warning_Modal_Confirm_Text: 'Disable',
					Cancel: 'Cancel',
				})
				.withSetting('ABAC_Enabled', true, {
					packageValue: true,
					blocked: false,
					public: true,
					type: 'boolean',
					i18nLabel: 'ABAC_Enabled',
					i18nDescription: 'ABAC_Enabled_Description',
				})
				.withEndpoint('GET', '/v1/licenses.info', () => ({
					license: createFakeLicenseInfo({ activeModules: [] }),
				}))
				.build();

			return (
				<AppRoot>
					<Story />
				</AppRoot>
			);
		},
	],
};

export default meta;
type Story = StoryObj<typeof AdminABACSettingToggle>;

export const Default: Story = {};
