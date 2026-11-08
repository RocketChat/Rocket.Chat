import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import CallPresenting from './CallPresenting';
import { CallSurface, conferenceAppRoot, withConferenceWindow } from '../fixtures/storyFixtures';

/** Who is sharing a screen, for the conference window's top bar; the reader's own share can be stopped from it. */
const meta = {
	component: CallPresenting,
	parameters: { layout: 'centered' },
	args: { onStopPresenting: action('stopPresenting') },
	decorators: [
		(Story) => (
			<CallSurface>
				<Story />
			</CallSurface>
		),
		withConferenceWindow(conferenceAppRoot()),
	],
} satisfies Meta<typeof CallPresenting>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SomeoneElse: Story = {
	args: { presenters: [{ name: 'Ada Lovelace' }] },
};

export const Reader: Story = {
	args: { presenters: [{ name: 'John Doe', isLocal: true }] },
};

/** More than one share: the first is named, the rest counted. */
export const Several: Story = {
	args: { presenters: [{ name: 'Ada Lovelace' }, { name: 'Grace Hopper' }, { name: 'Alan Turing' }] },
};
