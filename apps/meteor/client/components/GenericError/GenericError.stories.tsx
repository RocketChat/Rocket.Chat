import type { Meta, StoryFn } from '@storybook/react';

import GenericError from './GenericError';

export default {
	title: 'Components/GenericError',
	component: GenericError,
	parameters: {
		layout: 'fullscreen',
		controls: { hideNoControlsWarning: true },
		actions: { argTypesRegex: '^on.*' },
	},
} satisfies Meta<typeof GenericError>;

const Template: StoryFn<typeof GenericError> = (args) => <GenericError {...args} />;

export const Default = Template.bind({});
