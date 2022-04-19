import { Box } from '@rocket.chat/fuselage';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import { useAutoSequence } from '../../stories/hooks/useAutoSequence';
import PositiveGrowthSymbol from './PositiveGrowthSymbol';

export default {
	title: 'Components/Data/PositiveGrowthSymbol',
	component: PositiveGrowthSymbol,
	parameters: {
		layout: 'centered',
		controls: { hideNoControlsWarning: true },
	},
	decorators: [
		(fn) => {
			const color = useAutoSequence(['neutral-500', 'primary-500', 'danger-500', 'warning-500', 'success-500']);

			return <Box color={color}>{fn()}</Box>;
		},
	],
} as ComponentMeta<typeof PositiveGrowthSymbol>;

const Template: ComponentStory<typeof PositiveGrowthSymbol> = (args) => <PositiveGrowthSymbol {...args} />;

export const Default = Template.bind({});
Default.storyName = 'PositiveGrowthSymbol';
