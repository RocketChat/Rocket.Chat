import type { StoryObj, Meta, StoryFn } from '@storybook/react';

import SettingsSection from './SettingsSection';
import SettingsSectionSkeleton from './SettingsSectionSkeleton';

export default {
	component: SettingsSection,
	parameters: {
		layout: 'fullscreen',
		controls: { hideNoControlsWarning: true },
	},
} satisfies Meta<typeof SettingsSection>;

export const Default: StoryObj<typeof SettingsSection> = {
	args: {
		groupId: 'General',
	},
};

export const Skeleton: StoryFn<typeof SettingsSectionSkeleton> = () => <SettingsSectionSkeleton />;
