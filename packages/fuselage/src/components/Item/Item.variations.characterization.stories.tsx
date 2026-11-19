import type { Meta, StoryObj } from '@storybook/react';
import { expect } from 'storybook/test';

import Item from './Item';
import ItemActions from './ItemActions';
import ItemContent from './ItemContent';
import ItemDescription from './ItemDescription';
import ItemGroup from './ItemGroup';
import ItemGroupHeader from './ItemGroupHeader';
import ItemGroupTitle from './ItemGroupTitle';
import ItemIcon from './ItemIcon';
import ItemLink from './ItemLink';
import ItemMedia from './ItemMedia';
import ItemTitle from './ItemTitle';
import { Box } from '../Box';
import { IconButton } from '../Button';

// G0 characterization of what the Item family declares since its rows stopped asking the browser what they hold: a row
// with a link says `interactive`, groups in a column are spaced by their holder, and the variations added for the
// families built on Item. See src/testing/README.md.
export default {
	title: 'Characterization/Item/Variations',
	component: Item,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof Item>;

type Story = StoryObj<typeof Item>;

export const LinkedRow: Story = {
	render: () => (
		<>
			<Item id='linked-row' interactive>
				<ItemIcon label='Away' id='away-icon' />
				<ItemTitle>
					<ItemLink href='#x' id='linked-link' aria-describedby='mine'>
						Linked
					</ItemLink>
				</ItemTitle>
				<ItemActions reveal='hover'>
					<IconButton size='mini' icon='kebab' aria-label='Options' />
				</ItemActions>
			</Item>
			<ItemGroupHeader interactive>
				<ItemGroupTitle is='button' id='collapse'>
					Favorites
				</ItemGroupTitle>
			</ItemGroupHeader>
		</>
	),
	play: async ({ canvasElement }) => {
		await expect(canvasElement.querySelector('#linked-row')).toHaveClass('rcx-item', 'rcx-item--interactive');
		await expect(canvasElement.querySelector('#collapse')).toHaveAttribute('type', 'button');
	},
};

export const GroupsInAColumn: Story = {
	render: () => (
		<Box display='flex' flexDirection='column' rowGap='x8' width='x240'>
			<ItemGroup is='ul' aria-label='Favorites'>
				<Item is='li'>
					<ItemContent>
						<ItemTitle>general</ItemTitle>
					</ItemContent>
				</Item>
			</ItemGroup>
			<ItemGroup is='ul' aria-label='Clients'>
				<Item is='li'>
					<ItemContent>
						<ItemTitle>acme-support</ItemTitle>
					</ItemContent>
				</Item>
			</ItemGroup>
		</Box>
	),
};

const Wrapped = ({ description }: { description: string }) => (
	<ItemContent>
		<ItemTitle>Behind a component</ItemTitle>
		<ItemDescription>{description}</ItemDescription>
	</ItemContent>
);

export const Lines: Story = {
	render: () => (
		<ItemGroup is='ul' aria-label='Lines'>
			<Item is='li' id='one-line'>
				<ItemMedia variant='slot' />
				<ItemContent>
					<ItemTitle>One line</ItemTitle>
				</ItemContent>
			</Item>
			<Item is='li' id='two-lines'>
				<ItemMedia variant='slot' />
				<ItemContent>
					<ItemTitle>Two lines</ItemTitle>
					<ItemDescription>Counted by the row</ItemDescription>
				</ItemContent>
			</Item>
			<Item is='li' id='reported'>
				<ItemMedia variant='slot' />
				<Wrapped description='Reported by the content' />
			</Item>
			<Item is='li' id='declared' multiline>
				<ItemMedia variant='slot' />
				<Wrapped description='Declared by the row' />
			</Item>
		</ItemGroup>
	),
};

export const States: Story = {
	render: () => (
		<ItemGroup is='ul' aria-label='States'>
			<Item is='li' id='editing' editing>
				<ItemContent>
					<ItemTitle>Editing</ItemTitle>
				</ItemContent>
			</Item>
			<Item is='li' variant='success'>
				<ItemContent>
					<ItemTitle>Success</ItemTitle>
				</ItemContent>
			</Item>
			<Item is='li' variant='warning'>
				<ItemContent>
					<ItemTitle>Warning</ItemTitle>
				</ItemContent>
			</Item>
			<Item is='li'>
				<ItemContent>
					<ItemTitle>Actions at the end</ItemTitle>
				</ItemContent>
				<ItemActions justify='end'>
					<IconButton size='mini' icon='kebab' aria-label='Options' />
				</ItemActions>
			</Item>
		</ItemGroup>
	),
	play: async ({ canvasElement }) => {
		await expect(canvasElement.querySelector('#editing')).toHaveClass('rcx-item', 'rcx-item--editing');
	},
};
