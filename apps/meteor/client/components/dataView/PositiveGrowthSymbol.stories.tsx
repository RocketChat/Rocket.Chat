import { Box } from '@rocket.chat/fuselage';
import type { Meta } from '@storybook/react';

import PositiveGrowthSymbol from './PositiveGrowthSymbol';
import { useAutoSequence } from '../../stories/hooks/useAutoSequence';

export default {
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
} satisfies Meta<typeof PositiveGrowthSymbol>;

export const Default = {
	name: 'PositiveGrowthSymbol',
};
