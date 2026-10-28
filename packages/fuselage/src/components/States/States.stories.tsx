import type { Meta, StoryObj } from '@storybook/react-vite';

import {
	States,
	StatesSubtitle,
	StatesIcon,
	StatesTitle,
	StatesSuggestionList,
	StatesSuggestionListItem,
	StatesSuggestion,
	StatesSuggestionText,
	StatesActions,
	StatesAction,
	StatesLink,
} from '.';
import { Box } from '../Box';
import { Icon } from '../Icon';

export default {
	title: 'Feedback/States',
	component: States,
	subcomponents: {
		StatesSubtitle,
		StatesIcon,
		StatesTitle,
		StatesSuggestionList,
		StatesSuggestionListItem,
		StatesSuggestion,
		StatesSuggestionText,
		StatesActions,
		StatesAction,
		StatesLink,
	},
	parameters: {
		docs: {
			description: {
				component:
					'Appears when there is no data to display and, if possible, describes what the user can do next.\n\n' +
					'**Rules**\n' +
					'- The message should be neutral and helpful, accurately describing the state and suggesting next steps.\n' +
					'- Prefer a link over a primary button/CTA for the default empty state.\n' +
					'- The magnifying-glass icon is reserved for search-related empty states; otherwise the icon should reflect the context.',
			},
		},
	},
	argTypes: {
		children: {
			control: false,
			description: 'Content of the empty/error state.',
		},
	},
} satisfies Meta<typeof States>;

type Story = StoryObj<typeof States>;

export const Default: Story = {
	render: () => {
		const searchTerm = 'search term here';
		return (
			<Box>
				<States>
					<StatesIcon name='magnifier' />
					<StatesTitle>No app matches</StatesTitle>
					<StatesSubtitle>
						No Marketplace matches for:
						<strong>"{searchTerm}"</strong>
					</StatesSubtitle>
					<StatesSuggestion>
						<StatesSuggestionText>You can try to:</StatesSuggestionText>
						<StatesSuggestionList>
							<StatesSuggestionListItem>Search by category</StatesSuggestionListItem>
							<StatesSuggestionListItem>Search for a more general term</StatesSuggestionListItem>
							<StatesSuggestionListItem>Search for a more specific term</StatesSuggestionListItem>
							<StatesSuggestionListItem>Check if the spelling is correct</StatesSuggestionListItem>
						</StatesSuggestionList>
					</StatesSuggestion>
				</States>
			</Box>
		);
	},
};

export const ActionButton: Story = {
	render: () => (
		<Box>
			<States>
				<StatesIcon name='magnifier' />
				<StatesTitle>No app matches</StatesTitle>
				<StatesSubtitle>No Marketplace matches for:</StatesSubtitle>
				<StatesSuggestion>
					<StatesSuggestionText>You can try to:</StatesSuggestionText>
					<StatesSuggestionList>
						<StatesSuggestionListItem>Search by category</StatesSuggestionListItem>
						<StatesSuggestionListItem>Search for a more general term</StatesSuggestionListItem>
						<StatesSuggestionListItem>Search for a more specific term</StatesSuggestionListItem>
						<StatesSuggestionListItem>Check if the spelling is correct</StatesSuggestionListItem>
					</StatesSuggestionList>
				</StatesSuggestion>
				<StatesActions>
					<StatesAction>Reload</StatesAction>
				</StatesActions>
			</States>
		</Box>
	),
};

export const ActionButtonWithNoSuggestions: Story = {
	render: () => (
		<Box>
			<States>
				<StatesIcon name='magnifier' />
				<StatesTitle>No app matches</StatesTitle>
				<StatesSubtitle>No app matches for ”search term here” Try searching in the Marketplace instead.</StatesSubtitle>
				<StatesActions>
					<StatesAction>Reload</StatesAction>
				</StatesActions>
			</States>
		</Box>
	),
};

export const Link: Story = {
	render: () => (
		<Box>
			<States>
				<StatesIcon name='magnifier' />
				<StatesTitle>No app matches</StatesTitle>
				<StatesSubtitle>No app matches for ”search term here” Try searching in the Marketplace instead.</StatesSubtitle>
				<StatesActions>
					<StatesAction>Reload</StatesAction>
				</StatesActions>
				<StatesLink target='_blank' href='https://go.rocket.chat'>
					Link to another page
				</StatesLink>
			</States>
		</Box>
	),
};

export const Variations: Story = {
	render: () => (
		<Box>
			<States>
				<StatesIcon name='circle-exclamation' />
				<StatesTitle>Connection error</StatesTitle>
				<StatesSubtitle>
					Cannot connect to internet or your workspace may be an offline install. <br /> Contact your workspace admin for more information.
				</StatesSubtitle>
				<StatesActions>
					<StatesAction>
						<Icon name='reload' /> Reload
					</StatesAction>
				</StatesActions>
			</States>

			<States>
				<StatesIcon name='circle-exclamation' variation='danger' />
				<StatesTitle>Connection error</StatesTitle>
				<StatesSubtitle>
					Cannot connect to internet or your workspace may be an offline install. <br /> Contact your workspace admin for more information.
				</StatesSubtitle>
				<StatesActions>
					<StatesAction>
						<Icon name='reload' /> Reload
					</StatesAction>
				</StatesActions>
			</States>
			<States>
				<StatesIcon name='circle-exclamation' variation='primary' />
				<StatesTitle>Connection error</StatesTitle>
				<StatesSubtitle>
					Cannot connect to internet or your workspace may be an offline install. <br /> Contact your workspace admin for more information.
				</StatesSubtitle>
				<StatesActions>
					<StatesAction>
						<Icon name='reload' /> Reload
					</StatesAction>
				</StatesActions>
			</States>

			<States>
				<StatesIcon name='magnifier' variation='success' />
				<StatesTitle>Connection error</StatesTitle>
				<StatesSubtitle>
					Cannot connect to internet or your workspace may be an offline install. <br /> Contact your workspace admin for more information.
				</StatesSubtitle>
				<StatesActions>
					<StatesAction>
						<Icon name='reload' /> Reload
					</StatesAction>
				</StatesActions>
			</States>

			<States>
				<StatesIcon name='magnifier' variation='warning' />
				<StatesTitle>Connection error</StatesTitle>
				<StatesSubtitle>
					Cannot connect to internet or your workspace may be an offline install. <br /> Contact your workspace admin for more information.
				</StatesSubtitle>
				<StatesActions>
					<StatesAction>
						<Icon name='reload' /> Reload
					</StatesAction>
				</StatesActions>
			</States>
		</Box>
	),
};
