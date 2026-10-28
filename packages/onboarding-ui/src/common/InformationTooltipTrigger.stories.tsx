import type { Meta, StoryFn } from '@storybook/react-webpack5';

import InformationTooltipTrigger from './InformationTooltipTrigger';

export default {
	title: 'common/InformationTooltipTrigger',
	component: InformationTooltipTrigger,
	argTypes: {
		text: {
			control: { type: 'text' },
			defaultValue: 'Some tooltip text',
		},
	},
} satisfies Meta<typeof InformationTooltipTrigger>;

export const _InformationTooltipTrigger: StoryFn<typeof InformationTooltipTrigger> = (args) => (
	<InformationTooltipTrigger text={args.text} />
);
_InformationTooltipTrigger.storyName = 'InformationTooltipTrigger';
_InformationTooltipTrigger.parameters = {
	layout: 'centered',
};
