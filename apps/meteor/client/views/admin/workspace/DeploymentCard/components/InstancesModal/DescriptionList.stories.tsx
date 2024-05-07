import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import DescriptionList from './DescriptionList';
import DescriptionListEntry from './DescriptionListEntry';

export default {
	title: 'Admin/Info/DescriptionList',
	component: DescriptionList,
	parameters: {
		layout: 'centered',
	},
	decorators: [(fn) => <div className='rc-old'>{fn()}</div>],
} as ComponentMeta<typeof DescriptionList>;

export const Default: ComponentStory<typeof DescriptionList> = (args) => (
	<DescriptionList {...args}>
		<DescriptionListEntry label='Key'>Value</DescriptionListEntry>
		<DescriptionListEntry label='Key'>Value</DescriptionListEntry>
		<DescriptionListEntry label='Key'>Value</DescriptionListEntry>
	</DescriptionList>
);
Default.storyName = 'DescriptionList';
