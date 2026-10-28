import type { Meta, StoryObj } from '@storybook/react-vite';

import Tabs, { type TabsProps } from './Tabs';
import TabsItem, { type TabsItemProps } from './TabsItem';

export default {
	title: 'Navigation/Tabs',
	component: Tabs,
	subcomponents: {
		TabsItem,
	},
	parameters: {
		docs: {
			description: {
				component:
					'Lets users move back and forth between groups of related content.\n\n' +
					'**Rules**\n' +
					'- Use tabs to group related content; use a tab within the Tabs component, not standalone.\n' +
					'- Do NOT use tabs to navigate to other pages.\n' +
					'- The tab bar can scroll horizontally — use as many tabs as needed.\n' +
					'- Position tabs directly beneath the page header.',
			},
		},
	},
	argTypes: {
		divider: {
			control: 'boolean',
			description: 'Shows a bottom border dividing the tabs from the content below.',
			table: { defaultValue: { summary: 'true' } },
		},
		stretch: {
			control: 'boolean',
			description: 'Grows the items to fill the whole width.',
		},
	},
} satisfies Meta<typeof Tabs>;

type Story = StoryObj<TabsProps & Pick<TabsItemProps, 'selected' | 'disabled'>>;

const render: Story['render'] = ({ selected, disabled, ...args }) => (
	<Tabs {...args}>
		<TabsItem selected={selected} disabled={disabled}>
			Tab text 1
		</TabsItem>
		<TabsItem>Tab text 2</TabsItem>
		<TabsItem>Tab text 3</TabsItem>
		<TabsItem>Tab text 4</TabsItem>
		<TabsItem>Tab text 5</TabsItem>
	</Tabs>
);

export const Default: Story = {
	render,
};

export const Selected: Story = {
	render,
	args: {
		selected: true,
	},
};

export const Disabled: Story = {
	render,
	args: {
		disabled: true,
	},
};

export const SelectedAndDisabled: Story = {
	render,
	args: {
		disabled: true,
		selected: true,
	},
};

export const NoUnderline: Story = {
	render,
	args: {
		selected: true,
		divider: false,
	},
};

export const Stretch: Story = {
	render: (args) => (
		<Tabs {...args}>
			<TabsItem selected>Tab text 1</TabsItem>
			<TabsItem>Tab text 2</TabsItem>
			<TabsItem>Tab text 3</TabsItem>
		</Tabs>
	),
	args: {
		stretch: true,
	},
};
