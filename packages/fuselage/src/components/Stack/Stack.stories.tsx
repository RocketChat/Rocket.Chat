import type { Meta, StoryObj } from '@storybook/react';

import { Box } from '../Box';
import { Button } from '../Button';
import { Field, FieldLabel, FieldRow } from '../Field';
import { Tag } from '../Tag';
import { Text } from '../Text';
import { TextInput } from '../TextInput';
import Stack from './Stack';

const Item = ({ children }: { children: string }) => (
	<Box padding={8} backgroundColor='tint' color='default' fontScale='p2'>
		{children}
	</Box>
);

export default {
	title: 'Layout/Stack',
	component: Stack,
	parameters: {
		docs: {
			usage: `
- Use it inside a layout container; in a screen, a \`Stack\` that only spaces the screen's blocks is a container that needs a name.
- Pass it no \`Box\` styling props: the space between children is the \`gap\`, and anything else stays on a \`Box\`.
`,
		},
	},
	argTypes: {
		is: {
			control: 'select',
			options: ['div', 'section', 'ul', 'li', 'form', 'fieldset', 'span'],
			table: { category: 'Semantics', defaultValue: { summary: 'div' } },
		},
		direction: {
			control: 'inline-radio',
			options: ['row', 'column'],
			table: { category: 'Layout', defaultValue: { summary: 'column' } },
		},
		gap: {
			control: 'number',
			table: { category: 'Layout' },
		},
		align: {
			control: 'select',
			options: ['start', 'center', 'end', 'stretch', 'baseline'],
			table: { category: 'Layout' },
		},
		justify: {
			control: 'select',
			options: ['start', 'center', 'end', 'space-between'],
			table: { category: 'Layout' },
		},
		wrap: {
			control: 'boolean',
			table: { category: 'Layout' },
		},
		grow: {
			control: 'boolean',
			table: { category: 'Layout' },
		},
	},
	args: {
		gap: 8,
		children: [<Item key='1'>One</Item>, <Item key='2'>Two</Item>, <Item key='3'>Three</Item>],
	},
} satisfies Meta<typeof Stack>;

type Story = StoryObj<typeof Stack>;

export const Default: Story = {};

export const Row: Story = {
	args: {
		direction: 'row',
		align: 'start',
		justify: 'space-between',
	},
};

export const Header: Story = {
	render: () => (
		<Stack direction='row' align='center' justify='space-between' gap={16}>
			<Box fontScale='h4'>Title</Box>
			<Button size='small'>Action</Button>
		</Stack>
	),
};

export const List: Story = {
	render: () => (
		<Stack is='ul' gap='x8' aria-label='Fruits'>
			<Stack is='li' direction='row' align='center' gap='x8'>
				<Item>Apple</Item>
				<Item>red</Item>
			</Stack>
			<Stack is='li' direction='row' align='center' gap='x8'>
				<Item>Banana</Item>
				<Item>yellow</Item>
			</Stack>
		</Stack>
	),
};

export const Form: Story = {
	render: () => (
		<Stack is='form' gap='x16' aria-label='Profile' onSubmit={(event) => event.preventDefault()}>
			<Stack is='fieldset' gap='x8'>
				<Text is='legend' fontScale='p2b'>
					Account
				</Text>
				<Field>
					<FieldLabel htmlFor='stack-name'>Name</FieldLabel>
					<FieldRow>
						<TextInput id='stack-name' />
					</FieldRow>
				</Field>
			</Stack>
			<Button type='submit'>Save</Button>
		</Stack>
	),
};

export const Inline: Story = {
	parameters: {
		docs: {
			description: {
				story: '`is="span"` keeps the markup valid inside a `label`, which only takes inline content.',
			},
		},
	},
	render: () => (
		<FieldLabel>
			<Stack is='span' direction='row' align='center' gap='x4'>
				Send the transcript
				<Tag>Premium</Tag>
			</Stack>
		</FieldLabel>
	),
};
