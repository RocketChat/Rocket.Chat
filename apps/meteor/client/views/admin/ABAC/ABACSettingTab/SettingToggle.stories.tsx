import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';

import AbacEnabledToggle from './AbacEnabledToggle';
import EditableSettingsProvider from '../../settings/EditableSettingsProvider';

const meta: Meta<typeof AbacEnabledToggle> = {
	component: AbacEnabledToggle,
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
					packageValue: false,
					blocked: false,
					public: true,
					type: 'boolean',
					i18nLabel: 'ABAC_Enabled',
					i18nDescription: 'ABAC_Enabled_Description',
				})
				.build();

			return (
				<AppRoot>
					<Story />
				</AppRoot>
			);
		},
	],
	args: {
		hasABAC: true,
	},
};

export default meta;
type Story = StoryObj<typeof AbacEnabledToggle>;

export const Default: Story = {
	args: {
		hasABAC: true,
	},
};

export const Loading: Story = {
	args: {
		hasABAC: 'loading',
	},
};

export const False: Story = {
	args: {
		hasABAC: false,
	},
};
