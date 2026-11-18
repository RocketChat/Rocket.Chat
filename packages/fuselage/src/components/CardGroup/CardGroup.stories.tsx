import type { Meta, StoryObj } from '@storybook/react';

import { Badge } from '../Badge';
import { Button, IconButton } from '../Button';
import type { CardProps } from '../Card';
import { Card, CardBody, CardCol, CardControls, CardHeader, CardRow, CardTitle } from '../Card';
import { Icon } from '../Icon';
import { Tag } from '../Tag';
import CardGroup from './CardGroup';

export default {
	title: 'Containers/CardGroup',
	component: CardGroup,
	parameters: {
		backgrounds: { default: 'dark' },
		layout: 'padded',
		controls: { hideNoControlsWarning: true },
	},
	argTypes: {
		align: {
			control: 'select',
			options: ['start', 'center', 'end'],
			table: { category: 'Layout', defaultValue: { summary: 'start' } },
		},
		stretch: {
			control: 'boolean',
			table: { category: 'Layout' },
		},
		wrap: {
			control: 'boolean',
			table: { category: 'Layout' },
		},
		vertical: {
			control: 'boolean',
			table: { category: 'Layout' },
		},
		children: {
			control: false,
			table: { category: 'Content' },
		},
	},
} satisfies Meta<typeof CardGroup>;

type Story = StoryObj<typeof CardGroup>;

const CardItem = (props: CardProps) => (
	<Card {...props}>
		<CardHeader>
			<Icon name='address-book' size='x24' />
			<CardTitle info='Heading info'>Heading</CardTitle>
		</CardHeader>
		<CardBody>
			Lorem ipsum dolor sit amet. In adipisci consequatur qui laudantium rem praesentium earum ut consectetur. Lorem ipsum dolor sit amet.
			In adipisci consequatur qui laudantium rem praesentium earum ut consectetur.
		</CardBody>
		<CardControls>
			<Button size='medium' variant='primary'>
				Button
			</Button>
			<Button size='medium'>Button</Button>
		</CardControls>
	</Card>
);

export const Default: Story = {
	render: (args) => (
		<CardGroup {...args}>
			{Array.from(new Array(9)).map((_, index) => (
				<CardItem key={index} width='x260' />
			))}
		</CardGroup>
	),
};

export const Wrap: Story = {
	...Default,
	args: {
		wrap: true,
	},
};

export const WrapAlignCenter: Story = {
	...Default,
	args: {
		wrap: true,
		align: 'center',
	},
};

export const WrapStretch: Story = {
	...Default,
	args: {
		wrap: true,
		stretch: true,
	},
};

export const VerticalWithHorizontalCard: Story = {
	render: (args) => (
		<CardGroup vertical stretch {...args}>
			{Array.from(new Array(9)).map((_, index) => (
				<Card horizontal clickable key={index} width='full'>
					<CardRow>
						<Icon name='document-eye' size='x24' />
						<CardCol>
							<CardTitle variant='h3'>Heading 3</CardTitle>
							<CardBody>Lorem ipsum dolor sit amet.</CardBody>
						</CardCol>
					</CardRow>
					<CardControls>
						<Badge small variant='primary' />
						<Tag>Card tag</Tag>
						<IconButton icon='menu' size='small' aria-label='menu' />
					</CardControls>
				</Card>
			))}
		</CardGroup>
	),
};
