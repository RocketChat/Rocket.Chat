import { CallTimer } from '@rocket.chat/ui-client';
import type { Meta, StoryObj } from '@storybook/react';

/**
 * How long the call has been going, in the call window's header.
 *
 * Each story says how *old* the call is rather than when it started. A fixed date demonstrates the format it was
 * written for only until that date passes — these began as calls that started on 2026-01-01, which by the spring
 * were calls several months long, and the story named `Minutes` was showing hours.
 *
 * Deterministic all the same: the spec freezes the clock before it renders, so `Date.now()` there is the fixed
 * now the snapshots were taken against. The clock still ticks in Storybook — these are live, and a minute spent
 * looking at them shows.
 */
const secondsAgo = (seconds: number) => new Date(Date.now() - seconds * 1000);
const meta = {
	component: CallTimer,
	parameters: { layout: 'centered' },
} satisfies Meta<typeof CallTimer>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The usual case: a call that started a few minutes ago, counted in minutes and seconds. */
export const Minutes: Story = {
	render: () => <CallTimer startAt={secondsAgo(83)} />,
};

/** Past the hour, where the format grows a field rather than counting to 90 minutes. */
export const Hours: Story = {
	render: () => <CallTimer startAt={secondsAgo(2 * 60 * 60 + 4)} />,
};

/**
 * No call yet. The window mounts before the conference has been read, and the timer has to say something in
 * the meantime — zero, rather than a blank the header would collapse around.
 */
export const NotStartedYet: Story = {};
