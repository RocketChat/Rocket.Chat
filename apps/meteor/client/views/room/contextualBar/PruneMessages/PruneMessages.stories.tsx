import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import { ContextualbarContainer } from '../../../../components/Contextualbar';
import PruneMessages from './PruneMessages';

export default {
	title: 'Room/Contextual Bar/PruneMessages',
	component: PruneMessages,
	parameters: {
		layout: 'fullscreen',
		actions: { argTypesRegex: '^on.*' },
	},
	decorators: [(fn) => <ContextualbarContainer height='100vh'>{fn()}</ContextualbarContainer>],
} as ComponentMeta<typeof PruneMessages>;

const Template: ComponentStory<typeof PruneMessages> = (args) => <PruneMessages {...args} />;

export const Default = Template.bind({});

export const WithCallout = Template.bind({});
WithCallout.args = {
	values: { pinned: true },
	callOutText: 'This is a callout',
};
