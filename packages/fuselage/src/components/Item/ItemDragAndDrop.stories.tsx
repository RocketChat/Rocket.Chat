import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { ReactNode } from 'react';

import { Box } from '../Box';
import { Icon } from '../Icon';
import Item, { type ItemProps } from './Item';
import ItemActions from './ItemActions';
import ItemContent from './ItemContent';
import ItemDragHandle from './ItemDragHandle';
import ItemDropSlot from './ItemDropSlot';
import ItemGroup from './ItemGroup';
import ItemGroupHeader from './ItemGroupHeader';
import ItemGroupTitle from './ItemGroupTitle';
import ItemLink from './ItemLink';
import ItemMedia from './ItemMedia';
import ItemTitle from './ItemTitle';

export default {
	title: 'Navigation/Item/Drag and drop',
	component: Item,
	subcomponents: { ItemGroup, ItemDragHandle, ItemDropSlot },
	parameters: {
		layout: 'padded',
		docs: {
			description: {
				component:
					'The states a list of `Item` rows shows while a row is dragged with the pointer, held on touch, or moved with the keyboard.\n\n' +
					'**Two list modes**\n' +
					'- *User-ordered*: the row lands in a gap, marked by `dropIndicator` on the row or group next to it.\n' +
					'- *Auto-sorted*: the row only picks the group it goes into, marked by `dropTarget` on the group; the sort decides the position.\n\n' +
					'**Rules**\n' +
					'- The components only paint states; the list decides them (in the app, `useItemListDrag`).\n' +
					'- A row with `dragHandle="none"` drags from anywhere; with a trailing `ItemDragHandle`, only from the grip.\n' +
					'- The grip is never focusable: the keyboard moves the focused row with Cmd+Shift (Ctrl+Shift) and an arrow.',
			},
		},
	},
} satisfies Meta<typeof Item>;

type Story = StoryObj<typeof Item>;

const Section = ({ title, description, children }: { title: string; description: string; children: ReactNode }) => (
	<Box display='flex' flexDirection='column' maxWidth='x720' marginBlockEnd={32}>
		<Box is='h3' fontScale='h4' color='titles-labels' margin={0}>
			{title}
		</Box>
		<Box fontScale='p2' color='hint' marginBlock={4}>
			{description}
		</Box>
		<Box display='flex' flexDirection='column' marginBlockStart={8}>
			{children}
		</Box>
	</Box>
);

const State = ({ name, prop, children }: { name: string; prop?: string; children: ReactNode }) => (
	<Box display='grid' style={{ gridTemplateColumns: '220px 280px', columnGap: 24 }} alignItems='center' marginBlock={8}>
		<Box display='flex' flexDirection='column'>
			<Box fontScale='p2b' color='titles-labels'>
				{name}
			</Box>
			{prop && (
				<Box is='code' fontScale='c1' color='hint'>
					{prop}
				</Box>
			)}
		</Box>
		<Box>{children}</Box>
	</Box>
);

const Surface = ({ children, label }: { children: ReactNode; label: string }) => (
	<Box backgroundColor='sidebar' paddingBlock={8} paddingInline={4} borderRadius='medium' width='x280'>
		<ItemGroup is='ul' aria-label={label}>
			{children}
		</ItemGroup>
	</Box>
);

const Row = ({ title, handle, handleDisabled, ...props }: { title: string; handle?: boolean; handleDisabled?: boolean } & ItemProps) => (
	<Item is='li' inset='md' {...props}>
		<ItemMedia variant='icon'>
			<Icon name='hash' size='x20' />
		</ItemMedia>
		<ItemContent>
			<ItemTitle>
				<ItemLink href={`#${title}`}>{title}</ItemLink>
			</ItemTitle>
		</ItemContent>
		{handle && <ItemDragHandle disabled={handleDisabled} />}
	</Item>
);

const Header = ({ title }: { title: string }) => (
	<ItemGroupHeader is='li' aria-hidden inset='md'>
		<ItemGroupTitle>{title}</ItemGroupTitle>
	</ItemGroupHeader>
);

// The lifted copy is `position: fixed` in a real drag; the stories pin it in place to show it.
const pinned = { position: 'relative', transform: 'none', zIndex: 0 } as const;

// The landing flash lasts 0.6s; the stories hold it near its start so it can be seen.
const frozenFlash = { animationDelay: '-0.1s', animationPlayState: 'paused' } as const;

export const Anatomy: Story = {
	render: () => (
		<Section
			title='Anatomy'
			description='Dragging adds one optional slot. The rest of the row is unchanged, and actions are hidden on the lifted copy.'
		>
			<State name='dragHandle="none"' prop='default'>
				<Surface label='Row without a handle'>
					<Row title='general' grabbable />
				</Surface>
			</State>
			<State name='dragHandle="trailing"' prop='<ItemDragHandle /> as the last slot'>
				<Surface label='Row with a handle'>
					<Item is='li' inset='md'>
						<ItemMedia variant='icon'>
							<Icon name='hash' size='x20' />
						</ItemMedia>
						<ItemContent>
							<ItemTitle>
								<ItemLink href='#marie'>marie.curie</ItemLink>
							</ItemTitle>
						</ItemContent>
						<ItemActions>
							<Icon name='kebab' size='x20' />
						</ItemActions>
						<ItemDragHandle />
					</Item>
				</Surface>
			</State>
		</Section>
	),
};

export const Source: Story = {
	render: () => (
		<Section title='Source' description='The row being moved, from rest to where it lands.'>
			<State name='Rest' prop='—'>
				<Surface label='Rest'>
					<Row title='general' />
				</Surface>
			</State>
			<State name='Grabbable (hover to see the cursor)' prop='grabbable'>
				<Surface label='Grabbable'>
					<Row title='general' grabbable />
				</Surface>
			</State>
			<State name='Dragging (the source)' prop='dragging'>
				<Surface label='Dragging'>
					<Row title='general' dragging />
				</Surface>
			</State>
			<State name='Lifted copy' prop='.rcx-item-drag-preview'>
				<Box width='x240'>
					<Item is='div' inset='md' className='rcx-item-drag-preview' style={pinned}>
						<ItemMedia variant='icon'>
							<Icon name='hash' size='x20' />
						</ItemMedia>
						<ItemContent>
							<ItemTitle>general</ItemTitle>
						</ItemContent>
					</Item>
				</Box>
			</State>
			<State name='Landed' prop='dropped'>
				<Surface label='Landed'>
					<Row title='general' dropped style={frozenFlash} />
				</Surface>
			</State>
		</Section>
	),
};

export const Handle: Story = {
	render: () => (
		<Section
			title='Handle'
			description='Only with dragHandle="trailing". The grip darkens on row hover, shows grabbing while pressed, and is hidden from assistive technologies.'
		>
			<State name='Rest' prop='<ItemDragHandle />'>
				<Surface label='Handle at rest'>
					<Row title='ana.lima' handle />
				</Surface>
			</State>
			<State name='Dragging' prop='Item dragging'>
				<Surface label='Handle while dragging'>
					<Row title='ana.lima' handle dragging />
				</Surface>
			</State>
			<State name='Cannot move' prop='<ItemDragHandle disabled />'>
				<Surface label='Disabled handle'>
					<Row title='ana.lima' handle handleDisabled />
				</Surface>
			</State>
		</Section>
	),
};

export const OrderedDrop: Story = {
	name: 'Ordered drop',
	render: () => (
		<Section
			title='Ordered drop'
			description='User-ordered lists. A 2px line on the gap the row will take; "after" one row and "before" the next draw the same line.'
		>
			<State name='Before a row' prop='dropIndicator="before"'>
				<Surface label='Line before a row'>
					<Row title='roadmap' />
					<Row title='mobile' dropIndicator='before' />
				</Surface>
			</State>
			<State name='After a row' prop='dropIndicator="after"'>
				<Surface label='Line after a row'>
					<Row title='roadmap' dropIndicator='after' />
					<Row title='mobile' />
				</Surface>
			</State>
			<State name='Between groups' prop='ItemGroup dropIndicator'>
				<Box display='flex' flexDirection='column' width='x280'>
					<ItemGroup is='ul' aria-label='Favorites'>
						<Header title='Favorites' />
						<Row title='general' />
					</ItemGroup>
					<ItemGroup is='ul' aria-label='Clients' dropIndicator='before'>
						<Header title='Clients' />
						<Row title='acme-support' />
					</ItemGroup>
				</Box>
			</State>
		</Section>
	),
};

export const BlockDrop: Story = {
	name: 'Drop into',
	render: () => (
		<Section
			title='Drop into'
			description='Auto-sorted lists, folders and categories: the row picks a place to go into, not a position. Every place that can take it is outlined when the drag starts; the one under the pointer fills in.'
		>
			<State name='Row, available' prop='dropTarget="available"'>
				<Surface label='Available row'>
					<Row title='Clients' dropTarget='available' />
				</Surface>
			</State>
			<State name='Row, active' prop='dropTarget="active"'>
				<Surface label='Active row'>
					<Row title='Clients' dropTarget='active' />
				</Surface>
			</State>
			<State name='Group, available' prop='ItemGroup dropTarget="available"'>
				<ItemGroup is='ul' aria-label='Available group' dropTarget='available' style={{ width: 280 }}>
					<Header title='Clients' />
					<Row title='acme-support' />
				</ItemGroup>
			</State>
			<State name='Group, active' prop='ItemGroup dropTarget="active"'>
				<ItemGroup is='ul' aria-label='Active group' dropTarget='active' style={{ width: 280 }}>
					<Header title='Clients' />
					<Row title='acme-support' />
				</ItemGroup>
			</State>
		</Section>
	),
};

export const Forbidden: Story = {
	render: () => (
		<Section
			title='Forbidden'
			description='Hovered by a drag that cannot land there: no line, no box, no hover surface, and a not-allowed cursor. Over empty space the whole page shows no-drop.'
		>
			<State name='Row' prop='dropDisabled'>
				<Surface label='Forbidden row'>
					<Row title='Unread (pinned on top)' dropDisabled />
				</Surface>
			</State>
			<State name='Group' prop='ItemGroup dropDisabled'>
				<ItemGroup is='ul' aria-label='Forbidden group' dropDisabled style={{ width: 280 }}>
					<Header title='Unread' />
					<Row title='general' />
				</ItemGroup>
			</State>
		</Section>
	),
};

export const EmptyGroup: Story = {
	name: 'Empty group',
	render: () => (
		<Section title='Empty group' description='A group with no rows still needs a place to drop into. The hint text comes from the app.'>
			<State name='Rest' prop='<ItemDropSlot />'>
				<Box width='x280'>
					<ItemGroup is='ul' aria-label='Empty group at rest'>
						<ItemDropSlot is='li'>Drop here</ItemDropSlot>
					</ItemGroup>
				</Box>
			</State>
			<State name='Available' prop='dropTarget="available"'>
				<Box width='x280'>
					<ItemGroup is='ul' aria-label='Empty group available'>
						<ItemDropSlot is='li' dropTarget='available'>
							Drop here
						</ItemDropSlot>
					</ItemGroup>
				</Box>
			</State>
			<State name='Active' prop='dropTarget="active"'>
				<Box width='x280'>
					<ItemGroup is='ul' aria-label='Empty group active'>
						<ItemDropSlot is='li' dropTarget='active'>
							Drop here
						</ItemDropSlot>
					</ItemGroup>
				</Box>
			</State>
		</Section>
	),
};

export const ListModes: Story = {
	name: 'List modes',
	render: () => (
		<Section
			title='List modes'
			description='The same moment in both modes: "design" leaves Projects for Clients. What changes is what the drop target is.'
		>
			<State name='Auto-sorted' prop='ItemGroup dropTarget'>
				<Box display='flex' flexDirection='column' width='x280'>
					<ItemGroup is='ul' aria-label='Projects, auto-sorted'>
						<Header title='Projects' />
						<Row title='roadmap' />
						<Row title='design' dragging />
					</ItemGroup>
					<ItemGroup is='ul' aria-label='Clients, auto-sorted' dropTarget='active'>
						<Header title='Clients' />
						<Row title='acme-support' />
						<Row title='initech' />
					</ItemGroup>
				</Box>
			</State>
			<State name='User-ordered' prop='Item dropIndicator'>
				<Box display='flex' flexDirection='column' width='x280'>
					<ItemGroup is='ul' aria-label='Projects, user-ordered'>
						<Header title='Projects' />
						<Row title='roadmap' />
						<Row title='design' dragging />
					</ItemGroup>
					<ItemGroup is='ul' aria-label='Clients, user-ordered'>
						<Header title='Clients' />
						<Row title='acme-support' dropIndicator='after' />
						<Row title='initech' />
					</ItemGroup>
				</Box>
			</State>
		</Section>
	),
};

export const MovingAGroup: Story = {
	name: 'Moving a group',
	render: () => (
		<Section
			title='Moving a group'
			description='Groups in user order, such as sidebar categories. While a group is dragged its rows are not targets; each group splits at its middle.'
		>
			<State name='1 · Press' prop='—'>
				<Box display='flex' flexDirection='column' width='x280'>
					<ItemGroup is='ul' aria-label='Favorites, press'>
						<Header title='Favorites' />
					</ItemGroup>
					<ItemGroup is='ul' aria-label='Projects, press'>
						<Header title='Projects' />
						<Row title='design' />
					</ItemGroup>
					<ItemGroup is='ul' aria-label='Clients, press'>
						<Header title='Clients' />
					</ItemGroup>
				</Box>
			</State>
			<State name='2 · Over Clients, bottom half' prop='dragging · dropIndicator="after"'>
				<Box display='flex' flexDirection='column' width='x280'>
					<ItemGroup is='ul' aria-label='Favorites, over'>
						<Header title='Favorites' />
					</ItemGroup>
					<ItemGroup is='ul' aria-label='Projects, over' dragging>
						<Header title='Projects' />
						<Row title='design' />
					</ItemGroup>
					<ItemGroup is='ul' aria-label='Clients, over' dropIndicator='after'>
						<Header title='Clients' />
					</ItemGroup>
				</Box>
			</State>
			<State name='3 · Landed' prop='dropped'>
				<Box display='flex' flexDirection='column' width='x280'>
					<ItemGroup is='ul' aria-label='Favorites, landed'>
						<Header title='Favorites' />
					</ItemGroup>
					<ItemGroup is='ul' aria-label='Clients, landed'>
						<Header title='Clients' />
					</ItemGroup>
					<ItemGroup is='ul' aria-label='Projects, landed' dropped style={frozenFlash}>
						<Header title='Projects' />
						<Row title='design' />
					</ItemGroup>
				</Box>
			</State>
		</Section>
	),
};

export const Keyboard: Story = {
	render: () => (
		<Section
			title='Keyboard'
			description='Cmd+Shift (Ctrl+Shift) with Up or Down moves the focused row one step. Focus follows the row, the row flashes where it lands, and a polite live region says where.'
		>
			<State name='1 · Focused' prop='focusVisible'>
				<Surface label='Focused row'>
					<Row title='general' />
					<Row title='design' focusVisible />
					<Row title='engineering' />
				</Surface>
			</State>
			<State name='2 · After Cmd+Shift+Down' prop='focusVisible · dropped'>
				<Surface label='Moved row'>
					<Row title='general' />
					<Row title='engineering' />
					<Row title='design' focusVisible dropped style={frozenFlash} />
				</Surface>
			</State>
			<State name='3 · Announced' prop='.rcx-item-drag-announcer'>
				<Box fontScale='c1' color='hint'>
					“design moved to position 3 of 3” — or “… cannot move further” at either end
				</Box>
			</State>
		</Section>
	),
};

export const Overlay: Story = {
	name: 'Overlay (virtualized lists)',
	render: () => (
		<Section
			title='Overlay (virtualized lists)'
			description='In a virtualized list a group’s rows render outside its element, so the list draws the line and boxes over the rows with these classes instead of the props.'
		>
			<State name='Drop line' prop='.rcx-item-drop-line'>
				<Box position='relative' width='x280'>
					<Surface label='Overlay line'>
						<Row title='roadmap' />
						<Row title='mobile' />
					</Surface>
					<Box className='rcx-item-drop-line' style={{ position: 'absolute', top: 36, left: 0, right: 0, width: 'auto' }} />
				</Box>
			</State>
			<State name='Drop box, available' prop='.rcx-item-drop-box--available'>
				<Box position='relative' width='x280'>
					<Surface label='Overlay available box'>
						<Row title='acme-support' />
					</Surface>
					<Box className='rcx-item-drop-box rcx-item-drop-box--available' style={{ position: 'absolute', inset: 0, zIndex: 0 }} />
				</Box>
			</State>
			<State name='Drop box, active' prop='.rcx-item-drop-box'>
				<Box position='relative' width='x280'>
					<Surface label='Overlay active box'>
						<Row title='acme-support' />
					</Surface>
					<Box className='rcx-item-drop-box' style={{ position: 'absolute', inset: 0, zIndex: 0 }} />
				</Box>
			</State>
		</Section>
	),
};

export const Playground: StoryObj<
	ItemProps & { handle: boolean; handleDisabled: boolean; groupDropTarget?: 'available' | 'active'; groupDropDisabled: boolean }
> = {
	args: {
		grabbable: false,
		dragging: false,
		dropIndicator: undefined,
		dropTarget: undefined,
		dropDisabled: false,
		dropped: false,
		handle: false,
		handleDisabled: false,
		groupDropTarget: undefined,
		groupDropDisabled: false,
	},
	argTypes: {
		dropIndicator: { control: 'inline-radio', options: [undefined, 'before', 'after'] },
		dropTarget: { control: 'inline-radio', options: [undefined, 'available', 'active'] },
		groupDropTarget: { control: 'inline-radio', options: [undefined, 'available', 'active'] },
	},
	render: ({ handle, handleDisabled, groupDropTarget, groupDropDisabled, ...props }) => (
		<Box width='x280'>
			<ItemGroup is='ul' aria-label='Playground' dropTarget={groupDropTarget} dropDisabled={groupDropDisabled}>
				<Row title='general' />
				<Row title='design' handle={handle} handleDisabled={handleDisabled} {...props} />
				<Row title='engineering' />
			</ItemGroup>
		</Box>
	),
};
