import type { Meta, StoryFn } from '@storybook/react';

import WarningModal from './WarningModal';

export default {
	title: 'Components/WarningModal',
	component: WarningModal,
	parameters: {
		layout: 'centered',
		controls: { hideNoControlsWarning: true },
		actions: { argTypesRegex: '^on.*' },
	},
} satisfies Meta<typeof WarningModal>;

const Template: StoryFn<typeof WarningModal> = (args) => <WarningModal {...args} />;

export const Default = Template.bind({});
