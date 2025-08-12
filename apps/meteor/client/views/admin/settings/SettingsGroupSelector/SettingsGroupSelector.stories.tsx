import type { Meta, StoryFn } from '@storybook/react';

import SettingsGroupSelector from './SettingsGroupSelector';

export default {
	title: 'Admin/Settings/SettingsGroupSelector',
	component: SettingsGroupSelector,
	parameters: {
		layout: 'fullscreen',
		controls: { hideNoControlsWarning: true },
	},
} satisfies Meta<typeof SettingsGroupSelector>;

export const Default: StoryFn<typeof SettingsGroupSelector> = (args) => <SettingsGroupSelector {...args} />;
Default.storyName = 'GroupSelector';
