import type { Meta, StoryObj } from '@storybook/preact';
import type { ComponentProps } from 'preact';
import { action } from 'storybook/actions';

import { Menu, MenuGroup, MenuItem } from '.';
import BellIcon from '../../icons/bell.svg';
import ChangeIcon from '../../icons/change.svg';
import CloseIcon from '../../icons/close.svg';
import FinishIcon from '../../icons/finish.svg';

export default {
	component: MenuItem,
	args: {
		children: 'A menu item',
		onClick: action('clicked'),
	},
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<ComponentProps<typeof MenuItem>>;

type Story = StoryObj<ComponentProps<typeof MenuItem>>;

export const Simple: Story = {
	name: 'simple',
	render: (args) => (
		<Menu>
			<MenuGroup>
				<MenuItem {...args} />
				<MenuItem>Another menu item</MenuItem>
			</MenuGroup>
		</Menu>
	),
};

export const Primary: Story = {
	name: 'primary',
	args: {
		primary: true,
	},
	render: (args) => (
		<Menu>
			<MenuGroup>
				<MenuItem {...args} />
				<MenuItem>Another menu item</MenuItem>
			</MenuGroup>
		</Menu>
	),
};

export const Danger: Story = {
	name: 'danger',
	args: {
		danger: true,
	},
	render: (args) => (
		<Menu>
			<MenuGroup>
				<MenuItem {...args} />
				<MenuItem>Another menu item</MenuItem>
			</MenuGroup>
		</Menu>
	),
};

export const Disabled: Story = {
	name: 'disabled',
	args: {
		disabled: true,
	},
	render: (args) => (
		<Menu>
			<MenuGroup>
				<MenuItem {...args} />
				<MenuItem>Another menu item</MenuItem>
			</MenuGroup>
		</Menu>
	),
};

export const WithIcon: Story = {
	name: 'with icon',
	args: {
		children: 'Simple',
		icon: CloseIcon,
	},
	render: (args) => (
		<Menu>
			<MenuGroup>
				<MenuItem {...args} />
				<MenuItem primary icon={ChangeIcon} onClick={action('clicked')}>
					Primary
				</MenuItem>
				<MenuItem danger icon={FinishIcon} onClick={action('clicked')}>
					Danger
				</MenuItem>
				<MenuItem disabled icon={BellIcon} onClick={action('clicked')}>
					Disabled
				</MenuItem>
			</MenuGroup>
		</Menu>
	),
};
