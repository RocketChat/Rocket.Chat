import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import DescriptionList from './DescriptionList';

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
		<DescriptionList.Entry label='Key'>Value</DescriptionList.Entry>
		<DescriptionList.Entry label='Key'>Value</DescriptionList.Entry>
		<DescriptionList.Entry label='Key'>Value</DescriptionList.Entry>
	</DescriptionList>
);
Default.storyName = 'DescriptionList';
