import type { Meta, StoryFn } from '@storybook/react';

import GenericNoResults from './GenericNoResults';

export default {
	title: 'Components/GenericNoResults',
	component: GenericNoResults,
	parameters: {
		layout: 'fullscreen',
		controls: { hideNoControlsWarning: true },
		actions: { argTypesRegex: '^on.*' },
	},
} satisfies Meta<typeof GenericNoResults>;

const Template: StoryFn<typeof GenericNoResults> = (args) => <GenericNoResults {...args} />;

export const Default = Template.bind({});
