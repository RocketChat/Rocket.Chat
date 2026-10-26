import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { Avatar } from '../Avatar';
import { Badge } from '../Badge';
import { Box } from '../Box';
import { Button, IconButton } from '../Button';
import { FramedIcon } from '../FramedIcon';
import { Tag } from '../Tag';
import Card from './Card';
import CardBody from './CardBody';
import CardCol from './CardCol';
import CardControls from './CardControls';
import CardHeader from './CardHeader';
import CardRow from './CardRow';
import CardTitle from './CardTitle';

export default {
	title: 'Containers/Card',
	component: Card,
	subcomponents: {
		CardHeader,
		CardTitle,
		CardCol,
		CardRow,
		CardBody,
		CardControls,
	},
	parameters: {
		docs: {
			description: {
				component:
					'Displays content in a visually appealing manner.\n\n' +
					'**Rules**\n' +
					'- Vertical card — use Regular as the default; use Hero for priority info at the top of a page.\n' +
					'- Horizontal card — use within a list, among other list items; do NOT use as a stand-alone element.\n' +
					'- Use the Header/Content sections to compose the card body from other design-system components.',
			},
		},
		backgrounds: { default: 'dark' },
		layout: 'centered',
		controls: { hideNoControlsWarning: true },
	},
	argTypes: {
		horizontal: {
			control: 'boolean',
			description: 'Lays out the card horizontally instead of vertically.',
			table: { category: 'Layout' },
		},
		hero: {
			control: 'boolean',
			description: 'Renders the hero (highlighted) visual style.',
			table: { category: 'Kind' },
		},
		clickable: {
			control: 'boolean',
			description: 'Adds interactive/hover styling for clickable cards.',
			table: { category: 'State' },
		},
	},
} satisfies Meta<typeof Card>;

type Story = StoryObj<typeof Card>;

const imgUrl =
	'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAoACgDASIAAhEBAxEB/8QAGwAAAgIDAQAAAAAAAAAAAAAAAAcEBgIDBQj/xAAuEAACAQQAAwcEAQUAAAAAAAABAgMABAUREiExBhMUIkFRYQcWcYGhFTJSgpH/xAAYAQADAQEAAAAAAAAAAAAAAAACAwQBAP/EAB4RAAIBBQEBAQAAAAAAAAAAAAABAgMREiExE0HR/9oADAMBAAIRAxEAPwBuXuIkhBuMe5ib/AHQP49q4L3mLitryTLTSpOiHQI5k/HzXa/qbFOEudVTu1dumWvcTaNCZYZ7vU6g6LxqjOU/24dfs1Ouh9FnkMpd3Reeyx83hAxZZEhkdV9/MBrX71WGPvJcqrJBGveKATtuXXqNU0pu02bTHXD/AGvJAluyxxRd6F4x00o+NdKoVrjbzJdvVe1t5cVLc2ck8qjnohgpPtz2v7G6JtPQ2VJwjlcw+37mchpnK6GtIuv5NFWeTsLNPvxWTvpfjvOEfwKKzEVkSct2vscS/BIzSN0YRkeX81UpPqO8masJETu7OOccY4dswYFQeftv096XV5knuJGdm2T1+agvMXj8jEaHX905QihabvcbuS7X566mLWLwSY8PuRnk/u4eZ0deTl71Ef6hY+0yM88TzeNZY4luYwpVYyduOfrvhPTnr0pXSX9y5mCsyJMdyxxvwq599em+taItqCSNc90ChvZRUruUcT0JiO18Elpk7t8v41LWzacxkBSuvjQ/FFJayjDWrCTepAQ2vUH0oo/Jk3ovpwJJeVCP5CN+lFFaaMqy+nAyuChvrTI2kN9JAsi2ZOy4IBHMnkSCP+iqBexSWdxLazoUljJVlPUH2oorkV10pRc7b1zXb/hZOzuJvM86QWEXeELxOzHSIPcmiiiunVlF2RNTpRkrs//Z';

export const Vertical: Story = {
	render: () => (
		<Card>
			<CardHeader>
				<FramedIcon icon='address-book' info />
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
	),
};

export const VerticalNoIcon: Story = {
	render: () => (
		<Card>
			<CardTitle variant='h3'>Heading 3</CardTitle>
			<CardBody>
				Lorem ipsum dolor sit amet. In adipisci consequatur qui laudantium rem praesentium earum ut consectetur. Lorem ipsum dolor sit amet.
				In adipisci consequatur qui laudantium rem praesentium earum ut consectetur.
			</CardBody>
			<CardControls>
				<Button size='medium'>Button</Button>
			</CardControls>
		</Card>
	),
};

export const Hero: Story = {
	render: () => (
		<Card hero>
			<CardTitle variant='h3'>Heading 3</CardTitle>
			<CardBody>
				Lorem ipsum dolor sit amet. In adipisci consequatur qui laudantium rem praesentium earum ut consectetur. Lorem ipsum dolor sit amet.
				In adipisci consequatur qui laudantium rem praesentium earum ut consectetur.
			</CardBody>
			<CardControls>
				<Button size='medium'>Button</Button>
			</CardControls>
		</Card>
	),
};

export const VerticalCustom: Story = {
	render: () => (
		<Card>
			<CardHeader>
				<Avatar url={imgUrl} alt='avatar' />
				<CardTitle variant='h3'>Heading 3</CardTitle>
			</CardHeader>
			<CardBody>
				<CardCol>
					{Array.from(new Array(3)).map((_, index) => (
						<Box is='span' display='flex' alignItems='center' key={index}>
							<FramedIcon icon='check' success />
							<Box marginInlineStart={8}>Lorem ipsum dolor sit amet.</Box>
						</Box>
					))}
				</CardCol>
				<CardCol>
					{Array.from(new Array(3)).map((_, index) => (
						<Box is='span' display='flex' alignItems='center' key={index}>
							<FramedIcon icon='cross' danger />
							<Box marginInlineStart={8}>Lorem ipsum dolor sit amet.</Box>
						</Box>
					))}
				</CardCol>
			</CardBody>
			<CardControls>
				<Button size='medium'>Button</Button>
			</CardControls>
		</Card>
	),
};

export const Horizontal: Story = {
	render: () => (
		<Card horizontal>
			<CardRow>
				<CardCol>
					<FramedIcon icon='document-eye' info />
				</CardCol>
				<CardCol>
					<CardTitle variant='h3' info='Card info here'>
						Heading 3
					</CardTitle>
					<CardBody>
						Lorem ipsum dolor sit amet. In adipisci consequatur qui laudantium voluptatem rem praesentium earum ut consectetur.
					</CardBody>
				</CardCol>
			</CardRow>
			<CardControls>
				<Button size='medium'>Button</Button>
				<Button size='medium' variant='primary'>
					Button
				</Button>
				<Badge small variant='primary' />
				<Tag>Tag</Tag>
				<IconButton icon='menu' small aria-label='menu' />
			</CardControls>
		</Card>
	),
};

export const Clickable: Story = {
	render: () => (
		<Card horizontal clickable>
			<CardRow>
				<FramedIcon icon='document-eye' info />
				<CardCol>
					<CardTitle variant='h3' info='Card info here'>
						Heading 3
					</CardTitle>
					<CardBody>
						Lorem ipsum dolor sit amet. In adipisci consequatur qui laudantium voluptatem rem praesentium earum ut consectetur.
					</CardBody>
				</CardCol>
			</CardRow>
			<CardControls>
				<Button size='medium'>Button</Button>
				<Button size='medium' variant='primary'>
					Button
				</Button>
				<Badge small variant='primary' />
				<Tag>Tag</Tag>
				<IconButton icon='menu' small aria-label='menu' />
			</CardControls>
		</Card>
	),
};

export const HorizontalNoIcon: Story = {
	render: () => (
		<Card horizontal>
			<CardTitle variant='h3' info='Card info here'>
				Heading 3
			</CardTitle>
			<CardBody>
				Lorem ipsum dolor sit amet. In adipisci consequatur qui laudantium voluptatem rem praesentium earum ut consectetur.
			</CardBody>
			<CardControls>
				<Badge small variant='primary' />
				<Tag>Card tag</Tag>
				<IconButton icon='menu' small aria-label='menu' />
			</CardControls>
		</Card>
	),
};

export const HorizontalNoAction: Story = {
	render: () => (
		<Card horizontal>
			<CardRow>
				<FramedIcon icon='document-eye' info />
				<CardCol>
					<CardTitle variant='h3'>Heading 3</CardTitle>
					<CardBody>
						Lorem ipsum dolor sit amet. In adipisci consequatur qui laudantium voluptatem rem praesentium earum ut consectetur.
					</CardBody>
				</CardCol>
			</CardRow>
		</Card>
	),
};

export const TitleH4: Story = {
	name: 'Title h4',
	render: () => (
		<Card horizontal>
			<CardCol>
				<CardTitle variant='h4'>Heading 4</CardTitle>
				<CardBody>
					Lorem ipsum dolor sit amet. In adipisci consequatur qui laudantium voluptatem rem praesentium earum ut consectetur.
				</CardBody>
			</CardCol>
		</Card>
	),
};

export const TitleH5: Story = {
	name: 'Title h5',
	render: () => (
		<Card horizontal>
			<CardCol>
				<CardTitle variant='h5'>Heading 5</CardTitle>
				<CardBody>
					Lorem ipsum dolor sit amet. In adipisci consequatur qui laudantium voluptatem rem praesentium earum ut consectetur.
				</CardBody>
			</CardCol>
		</Card>
	),
};

export const HorizontalCustom: Story = {
	render: () => (
		<Card horizontal>
			<CardRow>
				<CardCol>
					<Avatar url={imgUrl} alt='avatar' />
				</CardCol>
				<CardCol>
					<CardHeader>
						<CardTitle variant='h4'>Heading 3</CardTitle>
						<Tag variant='featured'>Header tag</Tag>
					</CardHeader>
					<CardBody>Lorem ipsum dolor sit amet. In adipisci consequatur qui laudantium rem praesentium earum ut consectetur.</CardBody>
				</CardCol>
			</CardRow>

			<CardControls>
				<Badge small variant='primary' />
				<Tag>Card tag</Tag>
				<IconButton icon='menu' small aria-label='menu' />
			</CardControls>
		</Card>
	),
};
