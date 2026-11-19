import type { Meta, StoryObj } from '@storybook/react';

import { Box } from '../Box';
import { Icon } from '../Icon';
import Accordion from './Accordion';
import AccordionItem, { type AccordionItemProps } from './AccordionItem';

export default {
	title: 'Containers/Accordion',
	component: Accordion,
	subcomponents: {
		AccordionItem,
	},
	parameters: {
		docs: {
			usage: `
- Use for a large amount of content that falls into groups, such as settings.
- Don't hide inputs or controls the current task needs in a collapsed \`AccordionItem\`.
- A secondary title and a leading icon are optional; compose either into the \`title\`.
`,
		},
	},
	argTypes: {
		children: {
			control: false,
			table: { category: 'Content' },
		},
	},
} satisfies Meta<typeof Accordion>;

type Story = StoryObj<typeof Accordion>;

export const Default: Story = {
	render: () => (
		<Accordion>
			<AccordionItem title='Item #1'>
				<Box color='default' fontScale='p2' marginBlockEnd={16}>
					Content #1
				</Box>
			</AccordionItem>
			<AccordionItem title='Item #2'>
				<Box color='default' fontScale='p2' marginBlockEnd={16}>
					Content #2
				</Box>
			</AccordionItem>
			<AccordionItem title='Item #3'>
				<Box color='default' fontScale='p2' marginBlockEnd={16}>
					Content #3
				</Box>
			</AccordionItem>
		</Accordion>
	),
};

const ItemTemplate = ({ title = 'Item #2', disabled = false, defaultExpanded = false, ...args }: Partial<AccordionItemProps>) => (
	<Accordion>
		<AccordionItem title='Item #1' {...args}>
			<Box color='default' fontScale='p2' marginBlockEnd={16}>
				Content #1
			</Box>
		</AccordionItem>
		<AccordionItem title={title} disabled={disabled} defaultExpanded={defaultExpanded} {...args}>
			<Box color='default' fontScale='p2' marginBlockEnd={16}>
				Content #2
			</Box>
		</AccordionItem>
		<AccordionItem title='Item #3' {...args}>
			<Box color='default' fontScale='p2' marginBlockEnd={16}>
				Content #3
			</Box>
		</AccordionItem>
	</Accordion>
);

export const ExpandedItemByDefault: Story = {
	render: () => <ItemTemplate defaultExpanded />,
};

export const DisabledItem: Story = {
	render: () => <ItemTemplate disabled />,
};

const SECONDARY_TITLE_ITEMS = [
	{ title: 'Item #1', secondary: 'Released on Jan 12, 2026' },
	{ title: 'Item #2', secondary: 'Released on Feb 3, 2026' },
	{ title: 'Item #3', secondary: 'Released on Mar 18, 2026' },
];

export const SecondaryTitle: Story = {
	render: () => (
		<Accordion>
			{SECONDARY_TITLE_ITEMS.map(({ title, secondary }) => (
				<AccordionItem
					key={title}
					title={
						<Box is='span' display='flex' alignItems='baseline'>
							<Box is='span'>{title}</Box>
							<Box is='span' marginInlineStart={8} color='hint' fontScale='p2'>
								{secondary}
							</Box>
						</Box>
					}
				>
					<Box color='default' fontScale='p2' marginBlockEnd={16}>
						Content for {title}
					</Box>
				</AccordionItem>
			))}
		</Accordion>
	),
	parameters: {
		docs: {
			description: {
				story: 'A secondary title composed into `title`, for extra information such as a release date.',
			},
		},
	},
};

const LEADING_ICON_ITEMS = ['Item #1', 'Item #2', 'Item #3'];

export const LeadingIcon: Story = {
	render: () => (
		<Accordion>
			{LEADING_ICON_ITEMS.map((title) => (
				<AccordionItem
					key={title}
					title={
						<Box is='span' display='flex' alignItems='center'>
							<Icon name='doner' size={24} />
							<Box is='span' marginInlineStart={8}>
								{title}
							</Box>
						</Box>
					}
				>
					<Box color='default' fontScale='p2' marginBlockEnd={16}>
						Content for {title}
					</Box>
				</AccordionItem>
			))}
		</Accordion>
	),
	parameters: {
		docs: {
			description: {
				story: 'An icon composed into `title`, before the label.',
			},
		},
	},
};
