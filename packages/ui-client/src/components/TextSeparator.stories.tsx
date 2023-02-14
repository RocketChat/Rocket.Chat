import type { ComponentMeta, ComponentStory } from '@storybook/react';
import type { ReactElement } from 'react';

import TextSeparator from './TextSeparator';

export default {
	title: 'Components/TextSeparator',
	component: TextSeparator,
	parameters: {
		layout: 'centered',
	},
	decorators: [(fn): ReactElement => <div style={{ minWidth: 400 }}>{fn()}</div>],
} as ComponentMeta<typeof TextSeparator>;

const Template: ComponentStory<typeof TextSeparator> = (args) => <TextSeparator {...args} />;

export const Default = Template.bind({});
Default.storyName = 'TextSeparator';
Default.args = {
	label: 'Example label',
	value: 'Example value',
};
