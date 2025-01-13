import type { Meta, StoryFn } from '@storybook/react';

import DescriptionList from './DescriptionList';
import DescriptionListEntry from './DescriptionListEntry';

export default {
	title: 'Admin/Info/DescriptionList',
	component: DescriptionList,
	parameters: {
		layout: 'centered',
	},
	decorators: [(fn) => <div>{fn()}</div>],
} satisfies Meta<typeof DescriptionList>;

export const Default: StoryFn<typeof DescriptionList> = (args) => (
	<DescriptionList {...args}>
		<DescriptionListEntry label='Key'>Value</DescriptionListEntry>
		<DescriptionListEntry label='Key'>Value</DescriptionListEntry>
		<DescriptionListEntry label='Key'>Value</DescriptionListEntry>
	</DescriptionList>
);
Default.storyName = 'DescriptionList';
