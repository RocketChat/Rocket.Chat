import type { Decorator, Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import CallMessagePreviews, { type CallMessagePreviewsProps } from './CallMessagePreviews';
import type { ConferenceIncomingMessage } from '../../context/definitions';
import { CallSurface, conferenceAppRoot, withConference, withConferenceWindow } from '../../fixtures/storyFixtures';

const deliver =
	(...messages: ConferenceIncomingMessage[]): CallMessagePreviewsProps['subscribe'] =>
	(listener) => {
		messages.forEach(listener);
		return () => undefined;
	};

const deliverOnRepeat =
	(script: (Omit<ConferenceIncomingMessage, '_id'> & { afterMs: number })[]): CallMessagePreviewsProps['subscribe'] =>
	(listener) => {
		let sent = 0;
		let timer: ReturnType<typeof setTimeout>;

		const next = () => {
			const { afterMs, ...message } = script[sent % script.length];
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
			<Story />
		</div>
	</CallSurface>
);

const meta = {
	component: CallMessagePreviews,
	parameters: { layout: 'fullscreen' },
	args: {
		chatVisible: false,
		onOpen: action('onOpen'),
	},
	decorators: [withCallSurface, withConference({ viewer: { useRealName: true } }), withConferenceWindow(conferenceAppRoot())],
} satisfies Meta<typeof CallMessagePreviews>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Single: Story = {
	args: {
		subscribe: deliver({ _id: '1', username: 'ada', name: 'Ada Lovelace', preview: 'Can everyone see my screen?' }),
	},
};

export const Burst: Story = {
	args: {
		subscribe: deliver(
			{ _id: '1', username: 'ada', name: 'Ada Lovelace', preview: 'Can everyone see my screen?' },
			{ _id: '2', username: 'grace', name: 'Grace Hopper', preview: 'Yes, the slides are up.' },
			{ _id: '3', username: 'alan', name: 'Alan Turing', preview: 'The second chart is cut off on my side.' },
			{ _id: '4', username: 'katherine', name: 'Katherine Johnson', preview: 'Same here, try zooming out a bit.' },
		),
	},
};

export const LiveBurst: Story = {
	args: {
		subscribe: deliverOnRepeat([
			{ afterMs: 500, username: 'ada', name: 'Ada Lovelace', preview: 'Can everyone see my screen?' },
			{ afterMs: 1_500, username: 'grace', name: 'Grace Hopper', preview: 'Yes, the slides are up.' },
			{ afterMs: 1_500, username: 'alan', name: 'Alan Turing', preview: 'The second chart is cut off on my side.' },
			{ afterMs: 1_500, username: 'katherine', name: 'Katherine Johnson', preview: 'Same here, try zooming out a bit.' },
			{ afterMs: 3_000, username: 'ada', name: 'Ada Lovelace', preview: 'Better now?' },
			{ afterMs: 12_000, username: 'grace', name: 'Grace Hopper', preview: 'Perfect, thanks!' },
		]),
	},
};

export const LongMessage: Story = {
	args: {
		subscribe: deliver({
			_id: '1',
			username: 'hedy',
			name: 'Hedy Lamarr, Frequency Hopping and Spread Spectrum Working Group',
			preview:
				'Before we move on, I wanted to point out that the numbers on the third slide come from last quarter, so the totals will not match what Grace showed earlier. I can share the updated sheet in the chat after the call.',
		}),
	},
};

export const Attachment: Story = {
	args: {
		subscribe: deliver({ _id: '1', username: 'grace', name: 'Grace Hopper', preview: 'quarterly-report.pdf' }),
	},
};
