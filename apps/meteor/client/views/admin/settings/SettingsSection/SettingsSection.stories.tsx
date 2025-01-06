import type { Meta, StoryFn } from '@storybook/react';

import SettingsSection from './SettingsSection';
import SettingsSectionSkeleton from './SettingsSectionSkeleton';

export default {
	title: 'Admin/Settings/SettingsSection',
	component: SettingsSection,
	parameters: {
		layout: 'fullscreen',
		controls: { hideNoControlsWarning: true },
	},
} satisfies Meta<typeof SettingsSection>;

export const Default: StoryFn<typeof SettingsSection> = (args) => <SettingsSection {...args} />;
Default.args = {
	groupId: 'General',
};

export const Skeleton: StoryFn<typeof SettingsSectionSkeleton> = () => <SettingsSectionSkeleton />;
