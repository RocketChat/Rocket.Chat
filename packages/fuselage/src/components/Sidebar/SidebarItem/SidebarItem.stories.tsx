import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { SidebarListItem } from '.';
import { GenericCondensedItem, GenericExtendedItem, GenericMediumItem, decorators } from '../helpers';

export default {
	title: 'Navigation/Sidebar/Item',
	component: SidebarListItem,
	decorators,
	parameters: {
		docs: {
			description: {
				component:
					'A single room row within the chat sidebar.\n\n' +
					'**Rules**\n' +
					'- Use the unread status to highlight rooms with new activity; use badges for counts.\n' +
					'- Shows the room name, an optional avatar/icon, and a trailing timestamp/status.',
			},
		},
	},
	argTypes: {
		selected: {
			control: 'boolean',
			description: 'Marks the list item as the currently selected entry.',
		},
		children: {
			control: false,
			description: 'Content of the list item.',
		},
	},
} satisfies Meta<typeof SidebarListItem>;

type Story = StoryObj<typeof SidebarListItem>;

export const CondensedItems = () => (
	<>
		{Array.from({ length: 8 }).map((_, i) => (
			<GenericCondensedItem key={i} i={i} />
		))}
	</>
);

export const Condensed: Story = {
	render: CondensedItems,
};

export const Medium: Story = {
	render: () => (
		<>
			{Array.from({ length: 8 }).map((_, i) => (
				<GenericMediumItem key={i} i={i} />
			))}
		</>
	),
};

export const Extended: Story = {
	render: () => (
		<>
			{Array.from({ length: 8 }).map((_, i) => (
				<GenericExtendedItem key={i} i={i} />
			))}
		</>
	),
};
