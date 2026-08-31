import type { StoryObj, Meta } from '@storybook/react';

import DescriptionList from './DescriptionList';
import DescriptionListEntry from './DescriptionListEntry';

export default {
	component: DescriptionList,
	parameters: {
		layout: 'centered',
	},
	decorators: [(fn) => <div>{fn()}</div>],
} satisfies Meta<typeof DescriptionList>;

export const Default: StoryObj<typeof DescriptionList> = {
	render: (args) => (
		<DescriptionList {...args}>
			<DescriptionListEntry label='Key'>Value</DescriptionListEntry>
			<DescriptionListEntry label='Key'>Value</DescriptionListEntry>
			<DescriptionListEntry label='Key'>Value</DescriptionListEntry>
		</DescriptionList>
	),

	name: 'DescriptionList',
};
