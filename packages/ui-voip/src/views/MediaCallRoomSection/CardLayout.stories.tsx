import { Box } from '@rocket.chat/fuselage';
import type { Meta, StoryFn } from '@storybook/react';

import CardGrid from './CardGrid';
import CardItem from './CardItem';
import GenericCard from './GenericCard';

export default {
	title: 'V2/Views/MediaCallRoomSection/CardLayout',
	component: CardGrid,
	args: {
		columns: 2,
		rows: 1,
	},
} satisfies Meta<typeof CardGrid>;

export const CardGridStory: StoryFn<typeof CardGrid> = (args) => (
	<CardGrid {...args}>
		<CardItem>
			<GenericCard title='Card Item 1'>Card Item 1</GenericCard>
		</CardItem>
		<CardItem>
			<GenericCard title='Card Item 2'>Card Item 2</GenericCard>
		</CardItem>
	</CardGrid>
);

export const CardGridStoryThree: StoryFn<typeof CardGrid> = (args) => (
	<CardGrid {...args}>
		<CardItem>
			<GenericCard title='Card Item 1'>Card Item 1</GenericCard>
		</CardItem>
		<CardItem>
			<GenericCard title='Card Item 2'>Card Item 2</GenericCard>
		</CardItem>
		<CardItem>
			<GenericCard title='Card Item 3'>Card Item 3</GenericCard>
		</CardItem>
	</CardGrid>
);

export const CardGridStoryFour: StoryFn<typeof CardGrid> = (args) => (
	<CardGrid {...args}>
		<CardItem>
			<GenericCard title='Card Item 1'>Card Item 1</GenericCard>
		</CardItem>
		<CardItem>
			<GenericCard title='Card Item 2'>Card Item 2</GenericCard>
		</CardItem>
		<CardItem>
			<GenericCard title='Card Item 3'>Card Item 3</GenericCard>
		</CardItem>
		<CardItem columnSpan={2}>
			<GenericCard title='Card Item 4'>Card Item 4</GenericCard>
		</CardItem>
	</CardGrid>
);

const MyCard = () => (
	<Box maxWidth={300} maxHeight={300} w='full' h='full' backgroundColor='red'>
		My Card
	</Box>
);

const StreamCard = () => (
	<Box maxWidth={600} maxHeight={600} w='full' h='full' backgroundColor='orange'>
		Stream Card
	</Box>
);

export const CardGridStoryAlt: StoryFn<typeof CardGrid> = (args) => (
	<CardGrid {...args}>
		<CardGrid padding='0' direction='column'>
			<MyCard />
		</CardGrid>
		<CardItem rowSpan={1} columnSpan={3}>
			<CardGrid padding='0' direction='column'>
				<CardItem columnSpan={1}>
					<MyCard />
				</CardItem>
				<CardItem>
					<StreamCard />
				</CardItem>
			</CardGrid>
		</CardItem>
		<CardItem columnSpan={1}>
			<CardGrid padding='0' direction='column'>
				<CardItem>
					<GenericCard title='Card Item 2'>Card Item 2</GenericCard>
				</CardItem>
			</CardGrid>
		</CardItem>
		<CardItem>
			<GenericCard title='Card Item 3'>Card Item 3</GenericCard>
		</CardItem>
		{/* <CardItem>
			<GenericCard title='Card Item 3'>Card Item 3</GenericCard>
		</CardItem>
		<CardItem columnSpan={1}>
			<GenericCard title='Card Item 4'>Card Item 4</GenericCard>
		</CardItem> */}
	</CardGrid>
);
