import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../Button';
import type { CardProps } from '../Card';
import { Card, CardBody, CardControls, CardHeader, CardTitle } from '../Card';
import { Icon } from '../Icon';
import CardGrid from './CardGrid';
import CardGridItem from './CardGridItem';

export default {
	title: 'Containers/CardGrid',
	component: CardGrid,
	subcomponents: { CardGridItem },
	parameters: {
		backgrounds: { default: 'dark' },
		layout: 'centered',
		controls: { hideNoControlsWarning: true },
	},
	argTypes: {
		children: {
			control: false,
			description: 'Card items rendered inside the grid.',
			table: { category: 'Content' },
		},
		breakpoints: {
			control: 'object',
			description: 'Column span (`xs`, `sm`, `md`, `lg`, `xl`) applied to each grid item at each breakpoint.',
			table: { category: 'Layout' },
		},
		minRowHeight: {
			control: 'number',
			description: 'Minimum height of each row in pixels, gutters included.',
			table: { category: 'Layout' },
		},
	},
} satisfies Meta<typeof CardGrid>;

type Story = StoryObj<typeof CardGrid>;

const CardItem = (props: CardProps) => (
	<Card {...props}>
		<CardHeader>
			<Icon name='address-book' size='x24' />
			<CardTitle variant='h3' info='Heading info'>
				Heading 3
			</CardTitle>
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

export const WithItemSpans: Story = {
	render: (args) => (
		<CardGrid {...args} minRowHeight={260}>
			<CardGridItem lg={4} xs={4}>
				<CardItem />
			</CardGridItem>
			<CardGridItem lg={8} xs={4}>
				<CardItem />
			</CardGridItem>
			<CardGridItem lg={6} xs={4}>
				<CardItem />
			</CardGridItem>
			<CardGridItem lg={6} xs={4}>
				<CardItem />
			</CardGridItem>
		</CardGrid>
	),
};

export const _CardGrid: Story = {
	render: (args) => (
		<CardGrid {...args} breakpoints={{ xs: 4, sm: 4, md: 4, lg: 3, xl: 3 }}>
			{Array.from(new Array(9)).map((_, index) => (
				<CardItem key={index} />
			))}
		</CardGrid>
	),
};
