import type { StoryObj, Meta, StoryFn } from '@storybook/react';

import SettingsGroupPage from './SettingsGroupPage';
import SettingsGroupPageSkeleton from './SettingsGroupPageSkeleton';

export default {
	component: SettingsGroupPage,
	parameters: {
		layout: 'fullscreen',
		controls: { hideNoControlsWarning: true },
	},
} satisfies Meta<typeof SettingsGroupPage>;

export const Default: StoryObj<typeof SettingsGroupPage> = {};

export const WithGroup: StoryObj<typeof SettingsGroupPage> = {
	args: {
		_id: 'General',
		i18nLabel: 'General',
	},
};

export const Skeleton: StoryFn<typeof SettingsGroupPageSkeleton> = () => <SettingsGroupPageSkeleton />;
