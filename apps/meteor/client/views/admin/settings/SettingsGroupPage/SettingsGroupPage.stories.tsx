import type { Meta, StoryFn } from '@storybook/react';

import SettingsGroupPage from './SettingsGroupPage';
import SettingsGroupPageSkeleton from './SettingsGroupPageSkeleton';

export default {
	title: 'Admin/Settings/SettingsGroupPage',
	component: SettingsGroupPage,
	parameters: {
		layout: 'fullscreen',
		controls: { hideNoControlsWarning: true },
	},
} satisfies Meta<typeof SettingsGroupPage>;

export const Default: StoryFn<typeof SettingsGroupPage> = (args) => <SettingsGroupPage {...args} />;

export const WithGroup: StoryFn<typeof SettingsGroupPage> = (args) => <SettingsGroupPage {...args} />;
WithGroup.args = {
	_id: 'General',
	i18nLabel: 'General',
};

export const Skeleton: StoryFn<typeof SettingsGroupPageSkeleton> = () => <SettingsGroupPageSkeleton />;
