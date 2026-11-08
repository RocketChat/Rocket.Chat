import { Box } from '@rocket.chat/fuselage';
import type { Meta, StoryFn } from '@storybook/react-webpack5';

import TooltipWrapper from './TooltipWrapper';

export default {
	title: 'components/TooltipWrapper',
	component: TooltipWrapper,
} satisfies Meta<typeof TooltipWrapper>;

export const WithRenderProp: StoryFn<typeof TooltipWrapper> = () => (
	<TooltipWrapper text='An example tooltip'>
		{({ ref, toggle, id }) => (
			<Box
				ref={ref}
				onMouseEnter={() => toggle(true)}
				onMouseLeave={() => toggle(false)}
				onFocus={() => toggle(true)}
				onBlur={() => toggle(false)}
				tabIndex={0}
				aria-describedby={id}
			>
				Text
			</Box>
		)}
	</TooltipWrapper>
);
WithRenderProp.parameters = {
	layout: 'centered',
};

export const WithElement: StoryFn<typeof TooltipWrapper> = () => (
	<TooltipWrapper text='An example tooltip'>
		<Box tabIndex={0}>Text</Box>
	</TooltipWrapper>
);
WithElement.parameters = {
	layout: 'centered',
};
