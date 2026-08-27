import { ButtonGroup } from '@rocket.chat/fuselage';
import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import CallBar from './CallBar';
import CallBarAction from './CallBarAction';
import { CallSurface, conferenceAppRoot, withCallProviders } from '../../storyFixtures';

/**
 * The bar along the bottom of a conference. What it is for is the centring: the call's own controls sit in the
 * middle of the *bar*, not in the middle of whatever space the panel toggles leave over, so they don't shift
 * when a toggle gains a badge.
 */
const meta = {
	component: CallBar,
	parameters: { layout: 'fullscreen' },
	decorators: [
		(Story) => (
			<CallSurface>
				<Story />
			</CallSurface>
		),
		withCallProviders(conferenceAppRoot()),
	],
} satisfies Meta<typeof CallBar>;

export default meta;

type Story = StoryObj<typeof meta>;

const panelToggles = (
	<>
		<CallBarAction icon='team' label='People' pressed={false} badgeCount={4} badgeTitle='4 people in the call' onClick={action('people')} />
		<CallBarAction icon='balloon' label='Chat' pressed={false} onClick={action('chat')} />
	</>
);

/**
 * A provider that renders in an iframe keeps its own controls inside that frame, so the bar carries only this
 * window's panel toggles — pushed to the inline end, away from wherever the provider put its own.
 */
export const EmbeddedProvider: Story = {
	args: { children: panelToggles },
};

/**
 * The native conference brings mic, camera and hang-up with it, and those take the centre — one bar for the
 * call rather than the call's own strip stacked above this one.
 */
export const WithCallControls: Story = {
	args: {
		centre: (
			<ButtonGroup style={{ gap: 8 }}>
				<CallBarAction icon='mic' label='Mute' onClick={action('mic')} />
				<CallBarAction icon='video' label='Stop camera' onClick={action('cam')} />
				<CallBarAction icon='phone-off' label='Leave call' onClick={action('leave')} />
			</ButtonGroup>
		),
		children: panelToggles,
	},
};

/** A panel open and the chat unread at once — the badge and the pressed styling on the same bar. */
export const PanelOpen: Story = {
	args: {
		centre: (
			<ButtonGroup style={{ gap: 8 }}>
				<CallBarAction icon='mic-off' label='Unmute' onClick={action('mic')} />
				<CallBarAction icon='video-off' label='Start camera' onClick={action('cam')} />
				<CallBarAction icon='phone-off' label='Leave call' onClick={action('leave')} />
			</ButtonGroup>
		),
		children: (
			<>
				<CallBarAction icon='team' label='People' pressed onClick={action('people')} />
				<CallBarAction
					icon='balloon'
					label='Chat'
					pressed={false}
					badgeCount={3}
					badgeVariant='danger'
					badgeTitle='3 unread messages'
					onClick={action('chat')}
				/>
			</>
		),
	},
};
