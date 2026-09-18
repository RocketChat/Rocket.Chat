import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import ConferencePreflight from './ConferencePreflight';
import { allCapabilities, conferenceAppRoot, onPhone, storeCallPreferences, withConferenceWindow } from '../fixtures/storyFixtures';

/**
 * The screen a call actually starts on: what the camera will do on arrival, and what the call is called.
 *
 * Mic and camera state is remembered rather than passed in, so the stories that care about it seed the stored
 * preferences instead of setting a prop.
 */
const meta = {
	component: ConferencePreflight,
	parameters: { layout: 'fullscreen' },
	args: {
		name: 'Ada Lovelace',
		action: 'start',
		isDirect: true,
		canName: false,
		capabilities: allCapabilities,
		onConfirm: action('onConfirm'),
		onCancel: action('onCancel'),
	},
	decorators: [
		// `100dvh` and no minimum: a floor would prop the phone stories up to a height they do not have.
		(Story) => (
			<div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
				<Story />
			</div>
		),
		withConferenceWindow(conferenceAppRoot()),
	],
	beforeEach: storeCallPreferences({ cam: false }),
} satisfies Meta<typeof ConferencePreflight>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Calling one person. No name to give a direct call, and the ring switch is offered — with a line saying who
 * gets interrupted while it is on.
 */
export const DirectCall: Story = {
	args: { canChooseRinging: true },
};

/** The same call with ringing turned off: nobody is notified, so the notice goes away. */
export const DirectCallNotRinging: Story = {
	args: { canChooseRinging: true },
	beforeEach: storeCallPreferences({ cam: false, ring: false }),
};

/**
 * Starting a call in a room. It gets a name, defaulted to the room's, and there is nobody in particular to ring.
 */
export const GroupCall: Story = {
	args: { isDirect: false, canName: true, name: 'Weekly sync', defaultName: 'Weekly sync' },
};

/** Camera on: the preview says so, and warns that which camera is a question for inside the call. */
export const CameraOn: Story = {
	beforeEach: storeCallPreferences({ cam: true }),
};

/** Mic muted and camera off — both toggles red, which is the state worth noticing at a glance. */
export const BothDevicesOff: Story = {
	beforeEach: storeCallPreferences({ mic: false, cam: false }),
};

/**
 * A provider that can't be told about a camera at all. The toggle isn't offered rather than being offered and
 * ignored.
 */
export const MicOnlyProvider: Story = {
	args: { capabilities: { mic: true, cam: false } },
};

/** Walking into a call already running: it says who is in there, and the button says Join rather than Call. */
export const JoiningACall: Story = {
	args: {
		action: 'join',
		isDirect: false,
		name: 'Weekly sync',
		participants: {
			people: [
				{ _id: 'ada', username: 'ada' },
				{ _id: 'grace', username: 'grace' },
				{ _id: 'alan', username: 'alan' },
			],
			total: 7,
		},
	},
};

/**
 * The moment after the primary button is pressed: it goes to a spinner and stays there, because the window is
 * about to be replaced by the call and offering the button again would start a second one.
 *
 * Set rather than acted out: confirming is the caller's mutation, so a click here starts nothing.
 */
export const Confirming: Story = {
	args: { canChooseRinging: true, confirming: true },
};

/**
 * The preflight on a phone held upright: one column, preview first, and everything down to Cancel fitting
 * without a scroll.
 */
export const MobilePortrait: Story = {
	...onPhone('phonePortrait'),
	args: { isDirect: false, canName: true, name: 'Weekly sync', defaultName: 'Weekly sync' },
};

/**
 * A phone upright with the most this screen ever has to say: a direct call, so the heading carries a name and
 * wraps, and ringing is on, so the notice underneath is a whole sentence. It wraps, and scrolls to Cancel.
 */
export const MobilePortraitDirectRinging: Story = {
	...onPhone('phonePortrait'),
	args: { canChooseRinging: true },
};

/**
 * The same phone turned sideways: 852px wide is past `md` while 393px of height is not. Two columns with the
 * preview capped, and the primary button on screen.
 */
export const MobileLandscape: Story = {
	...onPhone('phoneLandscape'),
	args: { isDirect: false, canName: true, name: 'Weekly sync', defaultName: 'Weekly sync' },
};

/**
 * Landscape with the camera on, which is the tightest the screen gets: the preview carries a line of its own
 * under the icon, and both have to stay clear of the mic and camera toggles floating over the tile's bottom edge.
 */
export const MobileLandscapeCameraOn: Story = {
	...onPhone('phoneLandscape'),
	beforeEach: storeCallPreferences({ cam: true }),
};
