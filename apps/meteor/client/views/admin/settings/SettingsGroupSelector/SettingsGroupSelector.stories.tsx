import type { StoryObj, Meta } from '@storybook/react';

import SettingsGroupSelector from './SettingsGroupSelector';

export default {
	component: SettingsGroupSelector,
	parameters: {
		layout: 'fullscreen',
		controls: { hideNoControlsWarning: true },
	},
} satisfies Meta<typeof SettingsGroupSelector>;

export const Default: StoryObj<typeof SettingsGroupSelector> = {
	name: 'GroupSelector',
};
