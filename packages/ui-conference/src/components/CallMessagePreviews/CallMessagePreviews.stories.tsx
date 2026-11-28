import type { Decorator, Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import CallMessagePreviews from './CallMessagePreviews.js';
import type { ConferenceRoom } from '../../context/definitions.js';
import { CallSurface, conferenceAppRoot, onPhone, withConference, withConferenceWindow } from '../../fixtures/storyFixtures.js';

const conversation = [
	{ afterMs: 500, username: 'ada', name: 'Ada Lovelace', text: 'Can everyone see my screen?' },
	{ afterMs: 1_500, username: 'grace', name: 'Grace Hopper', text: 'Yes, the slides are up.' },
	{ afterMs: 1_500, username: 'alan', name: 'Alan Turing', text: 'The second chart is cut off on my side.' },
	{ afterMs: 1_500, username: 'katherine', name: 'Katherine Johnson', text: 'Same here, try zooming out a bit.' },
	{ afterMs: 3_000, username: 'ada', name: 'Ada Lovelace', text: 'Better now?' },
	{ afterMs: 12_000, username: 'grace', name: 'Grace Hopper', text: 'Perfect, thanks!' },
];

const replayConversation: ConferenceRoom['onNewMessage'] = (listener) => {
	let sent = 0;
	let timer: ReturnType<typeof setTimeout>;

	const next = () => {
		const { afterMs, ...message } = conversation[sent % conversation.length];
		timer = setTimeout(() => {
			listener({ ...message, _id: String(sent) });
			sent++;
			next();
		}, afterMs);
	};

	next();

	return () => clearTimeout(timer);
};

const withCallSurface: Decorator = (Story) => (
	<CallSurface height='24rem'>
		<div style={{ alignSelf: 'flex-end', width: 'min(20rem, 100%)', padding: 12 }}>
			<Story />
		</div>
	</CallSurface>
);

const meta = {
	component: CallMessagePreviews,
	parameters: { layout: 'fullscreen' },
	args: {
		onOpen: action('onOpen'),
		onFocusLeave: action('onFocusLeave'),
	},
	decorators: [
		withCallSurface,
		withConference({ room: { onNewMessage: replayConversation }, viewer: { useRealName: true } }),
		withConferenceWindow(conferenceAppRoot()),
	],
} satisfies Meta<typeof CallMessagePreviews>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A conversation on a loop, with previews arriving and leaving as they do in a call. */
export const Live: Story = {};

export const LiveCompact: Story = {
	args: { compact: true },
};

export const LiveOnPhone: Story = {
	...LiveCompact,
	...onPhone('phonePortrait'),
};
