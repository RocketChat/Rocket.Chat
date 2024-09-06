import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import SettingsSection from './SettingsSection';
import SettingsSectionSkeleton from './SettingsSectionSkeleton';

export default {
	title: 'Admin/Settings/SettingsSection',
	component: SettingsSection,
	parameters: {
		layout: 'fullscreen',
		controls: { hideNoControlsWarning: true },
	},
} as ComponentMeta<typeof SettingsSection>;

export const Default: ComponentStory<typeof SettingsSection> = (args) => <SettingsSection {...args} />;
Default.args = {
	groupId: 'General',
};

export const Skeleton: ComponentStory<typeof SettingsSectionSkeleton> = () => <SettingsSectionSkeleton />;
