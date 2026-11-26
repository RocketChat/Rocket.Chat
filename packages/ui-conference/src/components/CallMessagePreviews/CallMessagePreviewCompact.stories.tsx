import { UserAvatar } from '@rocket.chat/ui-avatar';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import CallMessagePreviewCompact from './CallMessagePreviewCompact.js';
import CallMessagePreviewList from './CallMessagePreviewList.js';
import { CallSurface, conferenceAppRoot, onPhone, withConferenceWindow } from '../../fixtures/storyFixtures.js';

const inList: Decorator = (Story) => (
	<CallSurface height='16rem'>
		<div style={{ alignSelf: 'flex-end', width: 'min(20rem, 100%)', padding: 12 }}>
			<CallMessagePreviewList aria-label='New messages'>
				<Story />
			</CallMessagePreviewList>
		</div>
	</CallSurface>
);

const meta = {
	component: CallMessagePreviewCompact,
	parameters: { layout: 'fullscreen' },
	args: {
		avatar: <UserAvatar username='ada' size='x28' />,
		name: 'Ada Lovelace',
		text: 'Can everyone see my screen?',
		openLabel: 'Ada Lovelace: Can everyone see my screen?',
		dismissLabel: 'Dismiss message from Ada Lovelace',
		onOpen: action('onOpen'),
		onDismiss: action('onDismiss'),
	},
	decorators: [inList, withConferenceWindow(conferenceAppRoot())],
} satisfies Meta<typeof CallMessagePreviewCompact>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongMessage: Story = {
	args: {
		name: 'Hedy Lamarr, Frequency Hopping and Spread Spectrum Working Group',
		text: 'Before we move on, I wanted to point out that the numbers on the third slide come from last quarter, so the totals will not match what Grace showed earlier.',
	},
};

export const Attachment: Story = {
	args: { text: 'quarterly-report.pdf' },
};

export const Encrypted: Story = {
	args: { text: 'Encrypted message' },
};

export const OnPhonePortrait: Story = {
	...LongMessage,
	...onPhone('phonePortrait'),
};

export const OnPhoneLandscape: Story = {
	...LongMessage,
	...onPhone('phoneLandscape'),
};
