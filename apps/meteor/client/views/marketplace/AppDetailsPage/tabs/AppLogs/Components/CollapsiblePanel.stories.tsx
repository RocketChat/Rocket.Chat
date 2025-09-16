import type { StoryFn } from '@storybook/react';

import { CollapseButton } from './CollapseButton';
import { CollapsiblePanel } from './CollapsiblePanel';
import { CollapsibleRegion } from './CollapsibleRegion';

export default {
	title: 'Marketplace/AppDetailsPage/AppLogs/Components/CollapsiblePanel',
	component: CollapsiblePanel,

	args: {
		expanded: true,
	},

	parameters: {
		layout: 'centered',
	},
};

const Template: StoryFn = (args) => {
	return (
		<CollapsiblePanel>
			<CollapseButton
				onClick={() => {
					args.expanded = !args.expanded;
				}}
				expanded={args.expanded}
				regionId='collapse-item'
			>
				Click Me
			</CollapseButton>
			<CollapsibleRegion expanded={args.expanded} id='collapse-item'>
				<p>This is the content of the panel that can be activated.</p>
				<button>Click Me</button>
				<p>More content can go here.</p>
			</CollapsibleRegion>
		</CollapsiblePanel>
	);
};

export const Default = Template.bind({});
