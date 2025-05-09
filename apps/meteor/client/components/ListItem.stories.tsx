import { Tile, OptionTitle, Box } from '@rocket.chat/fuselage';
import type { Meta, StoryFn } from '@storybook/react';

import ListItem from './Sidebar/ListItem';

export default {
	title: 'Components/ListItem',
	component: Tile,
	parameters: {
		docs: {
			description: {
				component: '`ListItem` can be used on DropDown lists, to render an item with icon and text.',
			},
		},
	},
} satisfies Meta<typeof Tile>;

export const ListWithIcon: StoryFn<typeof Tile> = () => {
	return (
		<Tile elevation='2' p='0' display='flex' flexDirection='column' overflow='auto' w='x240'>
			<Box flexShrink={1} pb={12}>
				<OptionTitle>Title</OptionTitle>
				<ListItem text='Item 1' icon='info' />
				<ListItem text='Item 2' icon='star' />
				<ListItem text='Item 3' icon='hashtag' />
				<ListItem text='Item 4' icon='team' />
			</Box>
		</Tile>
	);
};
export const NoIcon: StoryFn<typeof Tile> = () => {
	return (
		<Tile elevation='2' p='0' display='flex' flexDirection='column' overflow='auto' w='x240'>
			<Box flexShrink={1} pb={12}>
				<OptionTitle>Title</OptionTitle>
				<ListItem text='Item 1' />
				<ListItem text='Item 2' />
				<ListItem text='Item 3' />
				<ListItem text='Item 4' />
			</Box>
		</Tile>
	);
};

export const MixedWithGap: StoryFn<typeof Tile> = () => {
	return (
		<Tile elevation='2' p='0' display='flex' flexDirection='column' overflow='auto' w='x240'>
			<Box flexShrink={1} pb={12}>
				<OptionTitle>Title</OptionTitle>
				<ListItem text='Item 1' icon='hashtag' />
				<ListItem text='Item 2' icon='team' />
				<ListItem text='Item 3' gap />
				<ListItem text='Item 4' icon='airplane' />
			</Box>
		</Tile>
	);
};
MixedWithGap.parameters = {
	docs: {
		description: {
			story:
				" When using `ListItem`, you can also use the `gap` prop to add spacing to the left. If the list is mixed with items **with and without** icons, it's recommended to add the gap.",
		},
	},
};
export const MixedWithoutGap: StoryFn<typeof Tile> = () => {
	return (
		<Tile elevation='2' p='0' display='flex' flexDirection='column' overflow='auto' w='x240'>
			<Box flexShrink={1} pb={12}>
				<OptionTitle>Title</OptionTitle>
				<ListItem text='Item 1' icon='hashtag' />
				<ListItem text='Item 2' icon='team' />
				<ListItem text='Item 3' />
				<ListItem text='Item 4' icon='airplane' />
			</Box>
		</Tile>
	);
};
MixedWithoutGap.parameters = {
	docs: {
		description: {
			story: 'Not recommended. Prefer adding the `gap` prop to the items without icons.',
		},
	},
};
