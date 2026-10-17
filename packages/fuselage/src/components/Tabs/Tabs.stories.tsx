import type { Meta, StoryObj } from '@storybook/react-webpack5';

import Tabs from './Tabs';
import TabsItem from './TabsItem';

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
		scrollShadow: {
			control: 'boolean',
			description: 'Shows overflow shadows on the start and end edges when tabs exceed the visible scroll area.',
			table: { defaultValue: { summary: 'true' } },
		},
	},
} satisfies Meta<typeof Tabs>;

type Story = StoryObj<typeof Tabs>;

const render: Story['render'] = (args) => (
	<Tabs {...args}>
		<TabsItem {...args}>Tab text 1</TabsItem>
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

export const Overflowing: Story = {
	render: (args) => (
		<Tabs {...args}>
			{Array.from({ length: 15 }, (_, i) => (
				<TabsItem key={i} selected={i === 0}>
					Tab {i + 1}
				</TabsItem>
			))}
		</Tabs>
	),
};
