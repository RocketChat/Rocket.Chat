import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { action } from 'storybook/actions';

import { Box } from '../Box';
import { Button, IconButton } from '../Button';
import { ButtonGroup } from '../ButtonGroup';
import { Icon } from '../Icon';
import { InputBox } from '../InputBox';
import {
	Contextualbar,
	ContextualbarAction,
	ContextualbarActions,
	ContextualbarButton,
	ContextualbarContent,
	ContextualbarEmptyContent,
	ContextualbarFooter,
	ContextualbarHeader,
	ContextualbarSection,
	ContextualbarSkeleton,
	ContextualbarTitle,
} from './index';

export default {
	title: 'Containers/Contextualbar',
	component: Contextualbar,
	subcomponents: {
		ContextualbarAction,
		ContextualbarActions,
		ContextualbarButton,
		ContextualbarContent,
		ContextualbarEmptyContent,
		ContextualbarFooter,
		ContextualbarHeader,
		ContextualbarSection,
		ContextualbarSkeleton,
		ContextualbarTitle,
	},
	parameters: {
		docs: {
			description: {
				component:
					'A persistent UI element showing relevant information and actions for the current page context, letting users input data and act without the page disappearing.\n\n' +
					'**Rules**\n' +
					'- Title is mandatory.\n' +
					'- Provide a mandatory empty state on both navigation levels.\n' +
					'- Never disable the confirmation button — allow submit, then show required-field errors after confirm.\n' +
					'- Prefer the contextual bar over a Modal for non-disruptive contextual input.',
			},
		},
	},
	decorators: [
		(storyFn) => (
			<Box width='x400' elevation='2'>
				{storyFn()}
			</Box>
		),
	],
	argTypes: {
		stretch: {
			control: 'boolean',
			description: 'Makes the bar as wide as its container.',
			table: { category: 'Layout' },
		},
		position: {
			control: 'select',
			options: ['static', 'relative', 'absolute', 'fixed'],
			description: 'CSS position of the contextual bar.',
			table: { category: 'Layout' },
		},
		children: {
			control: false,
			description: 'Header, sections, content and footer of the contextual bar.',
			table: { category: 'Content' },
		},
	},
} satisfies Meta<typeof Contextualbar>;

type Story = StoryObj<typeof Contextualbar>;

export const Default: Story = {
	render: () => (
		<Box height='x540'>
			<Contextualbar position='static'>
				<ContextualbarHeader>
					<ContextualbarAction title='Back' name='arrow-back' onClick={action('click')} />
					<ContextualbarTitle>Contextualbar Title</ContextualbarTitle>
					<ContextualbarActions>
						<ContextualbarAction title='Title' name='new-window' onClick={action('click')} />
						<ContextualbarAction title='Add user' name='add-user' onClick={action('click')} />
						<ContextualbarAction title='Close' name='cross' onClick={action('click')} />
					</ContextualbarActions>
				</ContextualbarHeader>
				<ContextualbarSection>
					<InputBox type='text' placeholder='Search' endAddon={<Icon name='magnifier' size='x20' />} />
				</ContextualbarSection>
				<ContextualbarContent />
				<ContextualbarFooter>
					<ButtonGroup stretch='equal'>
						<ContextualbarButton secondary>Cancel</ContextualbarButton>
						<Button primary>Save</Button>
						<IconButton title='More' icon='menu' secondary />
					</ButtonGroup>
				</ContextualbarFooter>
			</Contextualbar>
		</Box>
	),
};

export const Skeleton: Story = {
	render: () => (
		<Box height='x540'>
			<ContextualbarSkeleton position='static' />
		</Box>
	),
};

export const Empty: Story = {
	render: () => (
		<Box height='x540'>
			<Contextualbar position='static'>
				<ContextualbarHeader>
					<ContextualbarAction title='Back' name='arrow-back' />
					<ContextualbarTitle>Contextualbar Empty</ContextualbarTitle>
					<ContextualbarActions>
						<ContextualbarAction title='Title' name='new-window' onClick={action('click')} />
					</ContextualbarActions>
				</ContextualbarHeader>
				<ContextualbarEmptyContent />
				<ContextualbarFooter>Footer</ContextualbarFooter>
			</Contextualbar>
		</Box>
	),
};

export const WithLongTitle: Story = {
	render: () => (
		<Box height='x540'>
			<Contextualbar position='static'>
				<ContextualbarHeader>
					<ContextualbarAction title='Back' name='arrow-back' onClick={action('click')} />
					<ContextualbarTitle>
						Contextualbar Long Title Contextualbar Long Title Contextualbar Long Title Contextualbar Long Title Contextualbar Long Title
						Contextualbar Long Title Contextualbar Long Title Contextualbar Long Title Contextualbar Long Title
					</ContextualbarTitle>
					<ContextualbarActions>
						<ContextualbarAction title='Title' name='new-window' onClick={action('click')} />
						<ContextualbarAction title='Add user' name='add-user' onClick={action('click')} />
						<ContextualbarAction title='Close' name='cross' onClick={action('click')} />
					</ContextualbarActions>
				</ContextualbarHeader>
				<ContextualbarSection>
					<InputBox type='text' placeholder='Search' endAddon={<Icon name='magnifier' size='x20' />} />
				</ContextualbarSection>
				<ContextualbarContent />
				<ContextualbarFooter>
					<ButtonGroup stretch='equal'>
						<ContextualbarButton secondary>Cancel</ContextualbarButton>
						<Button primary>Save</Button>
						<IconButton title='More' icon='menu' secondary />
					</ButtonGroup>
				</ContextualbarFooter>
			</Contextualbar>
		</Box>
	),
};
