import type { StoryFn } from '@storybook/react';

import { Collapse } from './Collapse';
import { CollapseButton } from './CollapseButton';
import { CollapsibleRegion } from './CollapsibleRegion';

export default {
	title: 'Components/Collapse',
	component: Collapse,

	args: {
		expanded: true,
	},

	parameters: {
		layout: 'centered',
	},
};

const Template: StoryFn = (args) => {
	return (
		<Collapse>
			<CollapseButton
				onClick={() => {
					args.expanded = !args.expanded;
				}}
				expanded={args.expanded}
				_id='collapse-item'
			>
				Click Me
			</CollapseButton>
			<CollapsibleRegion expanded={args.expanded} _id='collapse-item'>
				<p>This is the content of the panel that can be activated.</p>
				<button>Click Me</button>
				<p>More content can go here.</p>
			</CollapsibleRegion>
		</Collapse>
	);
};

export const Default = Template.bind({});
