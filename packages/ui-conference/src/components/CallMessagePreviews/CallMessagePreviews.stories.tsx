import type { Decorator, Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import CallMessagePreviews from './CallMessagePreviews.js';
import type { ConferenceNewMessage, ConferenceRoom } from '../../context/definitions.js';
import { CallSurface, conferenceAppRoot, onPhone, withConference, withConferenceWindow } from '../../fixtures/storyFixtures.js';
import { useCallMessagePreviews } from '../../hooks/useCallMessagePreviews.js';
import { MESSAGE_PREVIEWS_SHOWN } from '../../lib/constants.js';
import CallStageNotices from '../CallStageNotices.js';

const ada: ConferenceNewMessage = { _id: '1', username: 'ada', name: 'Ada Lovelace', text: 'Can everyone see my screen?' };
const grace: ConferenceNewMessage = { _id: '2', username: 'grace', name: 'Grace Hopper', text: 'Yes, the slides are up.' };
const alan: ConferenceNewMessage = {
	_id: '3',
	username: 'alan',
	name: 'Alan Turing',
	text: 'The second chart is cut off on my side.',
};
const hedy: ConferenceNewMessage = {
	_id: '4',
	username: 'hedy',
	name: 'Hedy Lamarr, Frequency Hopping and Spread Spectrum Working Group',
	text: 'Before we move on, I wanted to point out that the numbers on the third slide come from last quarter, so the totals will not match what Grace showed earlier. I can share the updated sheet in the chat after the call.',
};

const conversation = [
	{ afterMs: 500, ...ada },
	{ afterMs: 1_500, ...grace },
	{ afterMs: 1_500, ...alan },
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
		<div style={{ position: 'relative', flexGrow: 1 }}>
			<CallStageNotices>
				<Story />
			</CallStageNotices>
		</div>
	</CallSurface>
);

const meta = {
	component: CallMessagePreviews,
	parameters: { layout: 'fullscreen' },
	args: {
		onOpen: action('onOpen'),
		onDismiss: action('onDismiss'),
	},
	decorators: [withCallSurface, withConference({ viewer: { useRealName: true } }), withConferenceWindow(conferenceAppRoot())],
} satisfies Meta<typeof CallMessagePreviews>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Single: Story = {
	args: { messages: [ada] },
};

export const Several: Story = {
	args: { messages: [ada, grace, alan] },
};

export const LongMessage: Story = {
	args: { messages: [hedy] },
};

export const Attachment: Story = {
	args: { messages: [{ ...grace, text: 'quarterly-report.pdf' }] },
};

export const Encrypted: Story = {
	args: { messages: [{ ...ada, text: undefined }] },
};

export const Compact: Story = {
	args: { messages: [hedy], compact: true },
};

export const OnPhonePortrait: Story = {
	...Compact,
	...onPhone('phonePortrait'),
};

export const OnPhoneLandscape: Story = {
	...Compact,
	...onPhone('phoneLandscape'),
};

const LiveConversation = () => {
	const { messages, dismiss, holdRef } = useCallMessagePreviews(replayConversation, { paused: false, limit: MESSAGE_PREVIEWS_SHOWN });

	return <CallMessagePreviews ref={holdRef} messages={messages} onOpen={action('onOpen')} onDismiss={dismiss} />;
};

/** A conversation on a loop, with previews arriving and leaving as they do in a call. */
export const Live: Story = {
	args: { messages: [] },
	render: () => <LiveConversation />,
};
