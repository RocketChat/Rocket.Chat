import type { Meta, StoryFn } from '@storybook/react';

import { GenericCard } from './GenericCard';

export default {
	title: 'Components/GenericCard',
	component: GenericCard,
	parameters: {
		layout: 'fullscreen',
		controls: { hideNoControlsWarning: true },
		actions: { argTypesRegex: '^on.*' },
	},
} satisfies Meta<typeof GenericCard>;

const Template: StoryFn<typeof GenericCard> = (args) => <GenericCard {...args} />;

export const Default = Template.bind({});
Default.args = {
	title: 'Card Title',
	body: 'Card Body',
	icon: 'info',
	type: 'info',
};
