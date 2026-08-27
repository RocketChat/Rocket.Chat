import { Box } from '@rocket.chat/fuselage';
import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import CallBarAction from './CallBarAction';
import CallTopBar from './CallTopBar';
import { CallSurface, conferenceAppRoot, withCallProviders } from '../../storyFixtures';
import CallTimer from '../CallTimer/CallTimer';

/**
 * The window's top bar, spanning the call *and* its side panels — which is the point: put inside the call area
 * it stopped at the panel's edge and shifted every time a panel opened.
 */
const meta = {
	component: CallTopBar,
	parameters: { layout: 'fullscreen' },
	decorators: [
		(Story) => (
			<CallSurface>
				<Story />
			</CallSurface>
		),
		withCallProviders(conferenceAppRoot()),
	],
} satisfies Meta<typeof CallTopBar>;

export default meta;

type Story = StoryObj<typeof meta>;

/** What a call that runs in here gives the bar: its name and how long it has been going. */
export const WithCallHeader: Story = {
	args: {
		host: (
			<Box display='flex' alignItems='center' color='pure-white' style={{ gap: 12 }}>
				<Box fontScale='p2b'>Weekly sync</Box>
				<CallTimer startAt={new Date(Date.now() - 152_000)} />
			</Box>
		),
		children: <CallBarAction icon='kebab' label='Options' onClick={action('options')} />,
	},
};

/** Several of this window's own actions at the inline end, away from whatever the call put on the left. */
export const WithActions: Story = {
	args: {
		host: (
			<Box display='flex' alignItems='center' color='pure-white' style={{ gap: 12 }}>
				<Box fontScale='p2b'>Ada Lovelace</Box>
				<CallTimer startAt={new Date(Date.now() - 3_725_000)} />
			</Box>
		),
		children: (
			<>
				<CallBarAction icon='user-plus' label='Add people' onClick={action('add')} />
				<CallBarAction icon='team' label='People' badgeCount={5} badgeTitle='5 people in the call' onClick={action('people')} />
				<CallBarAction icon='kebab' label='Options' onClick={action('options')} />
			</>
		),
	},
};
