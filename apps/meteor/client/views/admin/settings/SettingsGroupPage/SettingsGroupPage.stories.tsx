import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import SettingsGroupPage from './SettingsGroupPage';
import SettingsGroupPageSkeleton from './SettingsGroupPageSkeleton';

export default {
	title: 'Admin/Settings/SettingsGroupPage',
	component: SettingsGroupPage,
	parameters: {
		layout: 'fullscreen',
		controls: { hideNoControlsWarning: true },
	},
} as ComponentMeta<typeof SettingsGroupPage>;

export const Default: ComponentStory<typeof SettingsGroupPage> = (args) => <SettingsGroupPage {...args} />;

export const WithGroup: ComponentStory<typeof SettingsGroupPage> = (args) => <SettingsGroupPage {...args} />;
WithGroup.args = {
	_id: 'General',
	i18nLabel: 'General',
};

export const Skeleton: ComponentStory<typeof SettingsGroupPageSkeleton> = () => <SettingsGroupPageSkeleton />;
