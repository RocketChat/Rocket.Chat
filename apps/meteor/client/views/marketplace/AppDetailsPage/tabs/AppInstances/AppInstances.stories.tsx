import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';

import AppInstances from './AppInstances';

const statusPossibleStates = [
	'unknown',
	'constructed',
	'initialized',
	'auto_enabled',
	'manually_enabled',
	'compiler_error_disabled',
	'invalid_license_disabled',
	'invalid_installation_disabled',
	'error_disabled',
	'manually_disabled',
	'invalid_settings_disabled',
	'disabled',
];

const statusTranslations = {
	App_status_auto_enabled: 'Enabled',
	App_status_constructed: 'Constructed',
	App_status_disabled: 'Disabled',
	App_status_error_disabled: 'Disabled: Uncaught Error',
	App_status_initialized: 'Initialized',
	App_status_invalid_license_disabled: 'Disabled: Invalid License',
	App_status_invalid_settings_disabled: 'Disabled: Configuration Needed',
	App_status_manually_disabled: 'Disabled: Manually',
	App_status_manually_enabled: 'Enabled',
	App_status_unknown: 'Unknown',
	App_status_invalid_installation_disabled: 'Disabled: Invalid Installation',
	Workspace_instance: 'Workspace instance',
};

export default {
	title: 'Components/AppInstances',
	component: AppInstances,
} satisfies Meta<typeof AppInstances>;

type Story = StoryObj<typeof AppInstances>;

export const Default: Story = {
	decorators: [
		mockAppRoot()
			.withEndpoint('GET', '/apps/:id/status', () => ({
				status: 'disabled',
				// Using any since the actual values from the AppStatus Enum cannot be used because it was exported as a type
				clusterStatus: statusPossibleStates.map((status, i) => ({ instanceId: `instance-id-${i}`, status })) as any,
			}))
			.withTranslations('en', 'core', statusTranslations)
			.buildStoryDecorator(),
	],
	args: {
		id: 'app-id',
	},
};

export const NoResults: Story = {
	decorators: [
		mockAppRoot()
			.withEndpoint('GET', '/apps/:id/status', () => ({
				status: 'disabled',
				clusterStatus: [],
			}))
			.buildStoryDecorator(),
	],
	args: {
		id: 'app-id',
	},
};
