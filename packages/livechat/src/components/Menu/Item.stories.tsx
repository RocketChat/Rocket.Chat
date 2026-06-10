import { action } from '@storybook/addon-actions';
import type { Meta, StoryFn } from '@storybook/preact';
import type { ComponentProps } from 'preact';

import { Menu, MenuGroup, MenuItem } from '.';
import BellIcon from '../../icons/bell.svg';
import ChangeIcon from '../../icons/change.svg';
import CloseIcon from '../../icons/close.svg';
import FinishIcon from '../../icons/finish.svg';

export default {
	title: 'Components/Menu/Item',
	component: MenuItem,
	args: {
		children: 'A menu item',
		onClick: action('clicked'),
	},
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<ComponentProps<typeof MenuItem>>;

export const Simple: StoryFn<ComponentProps<typeof MenuItem>> = (args) => (
	<Menu>
		<MenuGroup>
			<MenuItem {...args} />
			<MenuItem>Another menu item</MenuItem>
		</MenuGroup>
	</Menu>
);
Simple.storyName = 'simple';

export const Primary: StoryFn<ComponentProps<typeof MenuItem>> = (args) => (
	<Menu>
		<MenuGroup>
			<MenuItem {...args} />
			<MenuItem>Another menu item</MenuItem>
		</MenuGroup>
	</Menu>
);
Primary.storyName = 'primary';
Primary.args = {
	primary: true,
};

export const Danger: StoryFn<ComponentProps<typeof MenuItem>> = (args) => (
	<Menu>
		<MenuGroup>
			<MenuItem {...args} />
			<MenuItem>Another menu item</MenuItem>
		</MenuGroup>
	</Menu>
);
Danger.storyName = 'danger';
Danger.args = {
	danger: true,
};

export const Disabled: StoryFn<ComponentProps<typeof MenuItem>> = (args) => (
	<Menu>
		<MenuGroup>
			<MenuItem {...args} />
			<MenuItem>Another menu item</MenuItem>
		</MenuGroup>
	</Menu>
);
Disabled.storyName = 'disabled';
Disabled.args = {
	disabled: true,
};

export const WithIcon: StoryFn<ComponentProps<typeof MenuItem>> = (args) => (
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
);
WithIcon.storyName = 'with icon';
WithIcon.args = {
	children: 'Simple',
	icon: CloseIcon,
};
