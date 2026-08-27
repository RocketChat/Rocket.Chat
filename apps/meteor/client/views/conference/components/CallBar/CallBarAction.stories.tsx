import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import CallBarAction from './CallBarAction';
import { CallSurface, conferenceAppRoot, withCallProviders } from '../../storyFixtures';

/**
 * One control on the call bar. The badge is the interesting part: it is hidden from assistive technology and
 * folded into the button's own label instead, so a count is announced as part of the action rather than as a
 * loose number beside it.
 */
const meta = {
	component: CallBarAction,
	parameters: { layout: 'centered' },
	args: {
		label: 'People',
		icon: 'team',
		onClick: action('onClick'),
	},
	decorators: [
		(Story) => (
			<CallSurface>
				<div style={{ padding: 16, display: 'flex', gap: 8 }}>
					<Story />
				</div>
			</CallSurface>
		),
		withCallProviders(conferenceAppRoot()),
	],
} satisfies Meta<typeof CallBarAction>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A plain action. No `pressed` passed at all, so it isn't reported as a toggle. */
export const Idle: Story = {};

/** A panel toggle in its closed state — a toggle that is off, which is not the same as not being one. */
export const Closed: Story = {
	args: { pressed: false },
};

/** The panel it opens is open: info blue, and announced as pressed. */
export const Pressed: Story = {
	args: { pressed: true },
};

/** How many people are in the call, as information rather than a problem. */
export const Badged: Story = {
	args: { badgeCount: 4, badgeTitle: '4 people in the call' },
};

/** Unread messages while the chat is shut, in the variant the sidebar would have used for a mention. */
export const UrgentBadge: Story = {
	args: { icon: 'balloon', label: 'Chat', badgeCount: 3, badgeVariant: 'danger', badgeTitle: '3 unread messages' },
};

/** Something happened, without a number worth putting on it. */
export const DotBadge: Story = {
	args: { icon: 'balloon', label: 'Chat', badgeDot: true, badgeTitle: 'Unread messages' },
};

/** Badged and open at once, which is the state the two styles have to survive together. */
export const PressedAndBadged: Story = {
	args: { pressed: true, badgeCount: 12, badgeTitle: '12 people in the call' },
};
