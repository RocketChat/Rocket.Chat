import type { Meta, StoryObj } from '@storybook/react';

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
			usage: `
- Use tabs to group related content on one page; don't use them to navigate to other pages.
- Put every \`TabsItem\` inside a \`Tabs\`, never on its own.
- Add as many tabs as the content needs: the tab bar scrolls horizontally.
- Place the \`Tabs\` directly beneath the page header.
`,
		},
	},
	argTypes: {
		divider: {
			control: 'boolean',
			table: { defaultValue: { summary: 'true' } },
		},
		stretch: {
			control: 'boolean',
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
