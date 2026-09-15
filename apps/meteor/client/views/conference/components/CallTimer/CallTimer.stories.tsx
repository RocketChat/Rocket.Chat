import type { Meta, StoryObj } from '@storybook/react';

import CallTimer from './CallTimer';

/**
 * How long the call has been going, in the call window's header.
 *
 * Every story starts the call at a fixed moment rather than an offset from now, so what a reviewer sees is the
 * shape of the answer — minutes, hours, nothing yet — rather than a number that depends on when the page was
 * opened. The clock still ticks: these are live, and a minute spent looking at them shows.
 */
const meta = {
	component: CallTimer,
	parameters: { layout: 'centered' },
} satisfies Meta<typeof CallTimer>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The usual case: a call that started a few minutes ago, counted in minutes and seconds. */
export const Minutes: Story = {
	args: { startAt: new Date('2026-01-01T00:01:23.000Z') },
};

/** Past the hour, where the format grows a field rather than counting to 90 minutes. */
export const Hours: Story = {
	args: { startAt: new Date('2026-01-01T00:00:00.000Z') },
};

/**
 * No call yet. The window mounts before the conference has been read, and the timer has to say something in
 * the meantime — zero, rather than a blank the header would collapse around.
 */
export const NotStartedYet: Story = {};
