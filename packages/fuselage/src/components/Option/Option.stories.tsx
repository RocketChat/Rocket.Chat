import type { Meta, StoryObj } from '@storybook/react-vite';
import { action } from 'storybook/actions';

import { exampleAvatar } from '../../../.storybook/helpers';
import { Avatar } from '../Avatar';
import { Box } from '../Box';
import { MenuItem, Menu } from '../Menu';
import { StatusBullet } from '../StatusBullet';
import { Tile } from '../Tile';
import Option from './Option';
import OptionAvatar from './OptionAvatar';
import OptionColumn from './OptionColumn';
import OptionContent from './OptionContent';
import OptionDescription from './OptionDescription';
import OptionIcon from './OptionIcon';
import OptionMenu from './OptionMenu';
import OptionSkeleton from './OptionSkeleton';

export default {
	title: 'Navigation/Option',
	component: Option,
	subcomponents: {
		OptionAvatar,
		OptionColumn,
		OptionContent,
		OptionDescription,
		OptionIcon,
		OptionMenu,
		OptionSkeleton,
	},
	decorators: [
		(Story, { parameters }) => (
			<Box position='relative' maxWidth={250}>
				<Tile flush>
					<Box
						is='ul'
						role='listbox'
						aria-label='Options'
						aria-busy={parameters.busy || undefined}
						margin='none'
						paddingInline={0}
						paddingBlock={16}
					>
						<Story />
					</Box>
				</Tile>
			</Box>
		),
	],
	argTypes: {
		is: {
			control: 'text',
			description: 'Underlying element or component rendered for the option (defaults to `li`).',
			table: { category: 'Polymorphism', defaultValue: { summary: 'li' } },
		},
		id: {
			control: 'text',
			description: 'HTML id applied to the root element and used as its list key.',
			table: { category: 'Content' },
		},
		children: {
			control: false,
			description: 'Extra content rendered inside the option, after `label` (when both are set and different).',
			table: { category: 'Content' },
		},
		label: {
			control: 'text',
			description: 'Text or node wrapped in `OptionContent` and rendered as the option main content.',
			table: { category: 'Content' },
		},
		description: {
			control: 'text',
			description: 'Secondary content rendered below the label; when set, top-aligns the option wrapper.',
			table: { category: 'Content' },
		},
		icon: {
			control: 'text',
			description: 'Name of the Fuselage icon rendered via `OptionIcon` before the label.',
			table: { category: 'Content' },
		},
		avatar: {
			control: false,
			description: 'Node rendered inside `OptionAvatar`, before the icon and label.',
			table: { category: 'Content' },
		},
		gap: {
			control: 'boolean',
			description: 'Renders an empty `OptionColumn` to reserve icon-width space, useful when mixed with icon-bearing options.',
			table: { category: 'Shape' },
		},
		value: {
			control: 'text',
			description: 'Value associated with the option (not rendered).',
			table: { category: 'Content' },
		},
		title: {
			control: 'text',
			description: 'Native `title` attribute rendered on the root element.',
			table: { category: 'Content' },
		},
		variant: {
			control: 'select',
			options: ['danger', 'success', 'warning', 'primary'],
			description: 'Color kind applied via the `rcx-option--{variant}` class.',
			table: { category: 'Kind' },
		},
		focus: {
			control: 'boolean',
			description: 'Applies the `rcx-option--focus` class to visually highlight the option as focused.',
			table: { category: 'State' },
		},
		selected: {
			control: 'boolean',
			description: 'Marks the option as selected, setting `aria-selected` and the `rcx-option--selected` class.',
			table: { category: 'State' },
		},
		disabled: {
			control: 'boolean',
			description: 'Disables the option, setting `aria-disabled`, the `rcx-option--disabled` class, and blocking `onClick`.',
			table: { category: 'State' },
		},
		className: {
			control: 'text',
			description: 'Additional CSS class name(s) appended to the option.',
			table: { category: 'Content' },
		},
		onClick: {
			control: false,
			description: 'Called when the option is clicked, unless `disabled`.',
			table: { category: 'Events' },
		},
	},
} satisfies Meta<typeof Option>;

type Story = StoryObj<typeof Option>;

const MenuExample = () => (
	<Menu detached size='small' title='More options' items={[{ id: '1', label: 'Option', icon: 'hashtag' }]}>
		<MenuItem key='1'>Profile</MenuItem>
		<MenuItem key='2'>Chats</MenuItem>
		<MenuItem key='3'>Settings</MenuItem>
	</Menu>
);

export const Default: Story = {
	render: () => (
		<>
			<Option role='option' onClick={action('click')}>
				<OptionContent>Lorem Ipsum Lorem</OptionContent>
			</Option>
			<Option role='option'>
				<OptionContent>Lorem Ipsum Lorem Lorem Ipsum Lorem Lorem Ipsum Lorem Lorem Ipsum Lorem</OptionContent>
			</Option>
			<Option role='option'>
				<OptionContent>
					Lorem Ipsum Lorem <OptionDescription>Lorem Lorem Ipsum Lorem Lorem Ipsum Lorem</OptionDescription>
				</OptionContent>
			</Option>
		</>
	),
};

export const WithAvatar: Story = {
	render: () => (
		<>
			<Option role='option' onClick={action('click')}>
				<OptionAvatar>
					<Avatar url={exampleAvatar} size='x28' />
				</OptionAvatar>
				<OptionContent>Lorem Ipsum Lorem</OptionContent>
			</Option>
			<Option role='option'>
				<OptionAvatar>
					<Avatar url={exampleAvatar} size='x28' />
				</OptionAvatar>
				<OptionContent>Lorem Ipsum Lorem Lorem Ipsum Lorem Lorem Ipsum Lorem Lorem Ipsum Lorem</OptionContent>
			</Option>
			<Option role='option'>
				<OptionAvatar>
					<Avatar url={exampleAvatar} size='x28' />
				</OptionAvatar>
				<OptionContent>
					Lorem Ipsum Lorem <OptionDescription>Lorem Lorem Ipsum Lorem Lorem Ipsum Lorem</OptionDescription>
				</OptionContent>
			</Option>
		</>
	),
};

export const WithPresence: Story = {
	render: () => (
		<>
			<Option role='option' onClick={action('click')}>
				<OptionColumn>
					<StatusBullet />
				</OptionColumn>
				<OptionContent>Lorem Ipsum Lorem</OptionContent>
			</Option>
			<Option role='option'>
				<OptionAvatar>
					<Avatar url={exampleAvatar} size='x28' />
				</OptionAvatar>
				<OptionColumn>
					<StatusBullet />
				</OptionColumn>
				<OptionContent>Lorem Ipsum Lorem Lorem Ipsum Lorem Lorem Ipsum Lorem Lorem Ipsum Lorem</OptionContent>
			</Option>
		</>
	),
};

export const WithMenu: Story = {
	render: () => (
		<>
			<Option role='option' onClick={action('click')}>
				<OptionContent>Lorem Ipsum Lorem</OptionContent>
			</Option>
			<Option role='option'>
				<OptionAvatar>
					<Avatar url={exampleAvatar} size='x28' />
				</OptionAvatar>
				<OptionColumn>
					<StatusBullet />
				</OptionColumn>
				<OptionContent>Lorem Ipsum Lorem Lorem Ipsum Lorem Lorem Ipsum Lorem Lorem Ipsum Lorem</OptionContent>
				<OptionMenu>
					<Menu detached size='small' title='More options' items={[{ id: '1', label: 'Option', icon: 'hashtag' }]}>
						<MenuItem key='1'>Profile</MenuItem>
						<MenuItem key='2'>Chats</MenuItem>
						<MenuItem key='3'>Settings</MenuItem>
					</Menu>
				</OptionMenu>
			</Option>
		</>
	),
	parameters: {
		// A menu inside an option is interactive content nested in another; only rows composed from `Item` parts avoid it.
		a11y: { config: { rules: [{ id: 'nested-interactive', enabled: false }] } },
	},
};

export const WithIcon: Story = {
	render: () => (
		<>
			<Option role='option' onClick={action('click')}>
				<OptionIcon name='bell' />
				<OptionContent>Lorem Ipsum Lorem</OptionContent>
				<OptionMenu>
					<MenuExample />
				</OptionMenu>
			</Option>
			<Option role='option'>
				<OptionAvatar>
					<Avatar url={exampleAvatar} size='x28' />
				</OptionAvatar>
				<OptionIcon name='bell' />
				<OptionColumn>
					<StatusBullet />
				</OptionColumn>
				<OptionContent>Lorem Ipsum Lorem Lorem Ipsum Lorem Lorem Ipsum Lorem Lorem Ipsum Lorem</OptionContent>
				<OptionMenu>
					<MenuExample />
				</OptionMenu>
			</Option>
		</>
	),
	parameters: {
		// A menu inside an option is interactive content nested in another; only rows composed from `Item` parts avoid it.
		a11y: { config: { rules: [{ id: 'nested-interactive', enabled: false }] } },
	},
};

export const WithAndWithoutIcon: Story = {
	render: () => (
		<>
			<Option role='option' onClick={action('click')} icon='star' label='Lorem Ipsum Lorem' />
			<Option role='option' onClick={action('click')} icon='user' label='Lorem Ipsum Lorem' />
			<Option role='option' onClick={action('click')} icon='hashtag' label='Lorem Ipsum Lorem' />
			<Option role='option' onClick={action('click')} gap label='Lorem Ipsum Lorem' />
		</>
	),
	parameters: {
		docs: {
			description: {
				story:
					" When using `Option`, you can also use the `gap` prop to add spacing to the left. If the list is mixed with items **with and without** icons, it's recommended to add the gap.",
			},
		},
	},
};

export const Disabled: Story = {
	render: () => (
		<>
			<Option role='option' onClick={action('click')}>
				<OptionContent>Enabled</OptionContent>
			</Option>
			<Option role='option' disabled={true}>
				<OptionContent>Disabled</OptionContent>
			</Option>
		</>
	),
};

export const AsUserItem: Story = {
	render: () => (
		<>
			<Option role='option' onClick={action('click')}>
				<OptionAvatar>
					<Avatar url={exampleAvatar} size='x28' />
				</OptionAvatar>
				<OptionColumn>
					<StatusBullet />
				</OptionColumn>
				<OptionContent>
					<Box>
						carla.culhane <Box>(carla hune)</Box>
					</Box>
				</OptionContent>
				<OptionMenu>
					<MenuExample />
				</OptionMenu>
			</Option>
		</>
	),
	parameters: {
		// A menu inside an option is interactive content nested in another; only rows composed from `Item` parts avoid it.
		a11y: { config: { rules: [{ id: 'nested-interactive', enabled: false }] } },
	},
};

export const AsSkeleton: Story = {
	render: () => <OptionSkeleton />,
	parameters: { busy: true },
};
