import type { Meta, StoryObj } from '@storybook/react';

import MessageFooterCalloutContent from './MessageFooterCalloutContent.js';
import MessageFooterCalloutDivider from './MessageFooterCalloutDivider.js';
import { MessageFooterCallout, MessageFooterCalloutAction } from './index.js';
import MessageComposer from '../MessageComposer/MessageComposer.js';
import MessageComposerIcon from '../MessageComposer/MessageComposerIcon.js';

export default {
	component: MessageComposer,
} satisfies Meta<typeof MessageComposer>;

export const MessageComposerBlocked: StoryObj<typeof MessageComposer> = {
	render: () => (
		<MessageFooterCallout>
			<MessageComposerIcon name='burger' />
			Feedback text
		</MessageFooterCallout>
	),
};

export const MessageComposerBlockedLargeText: StoryObj<typeof MessageComposer> = {
	render: () => (
		<MessageFooterCallout>
			<MessageComposerIcon name='burger' />
			<MessageFooterCalloutContent>
				Feedback text Feedback text Feedback text Feedback text Feedback text Feedback text Feedback text Feedback text Feedback text
				Feedback text Feedback text Feedback text Feedback text Feedback text Feedback text text Feedback text Feedback text Feedback text
				Feedback text Feedback text text Feedback text Feedback text Feedback text Feedback text Feedback text text Feedback text Feedback
				text Feedback text Feedback text Feedback text
			</MessageFooterCalloutContent>
			<MessageFooterCalloutAction onClick={(): void => undefined}>Button</MessageFooterCalloutAction>
		</MessageFooterCallout>
	),
};

export const MessageComposerBlockedLargeTextDashed: StoryObj<typeof MessageComposer> = {
	render: () => (
		<MessageFooterCallout dashed>
			<MessageComposerIcon name='burger' />
			<MessageFooterCalloutContent>
				Feedback text Feedback text Feedback text Feedback text Feedback text Feedback text Feedback text Feedback text Feedback text
				Feedback text Feedback text Feedback text Feedback text Feedback text Feedback text text Feedback text Feedback text Feedback text
				Feedback text Feedback text text Feedback text Feedback text Feedback text Feedback text Feedback text text Feedback text Feedback
				text Feedback text Feedback text Feedback text
			</MessageFooterCalloutContent>
			<MessageFooterCalloutAction onClick={(): void => undefined}>Button</MessageFooterCalloutAction>
		</MessageFooterCallout>
	),
};

export const _MessageFooterCalloutAction: StoryObj<typeof MessageComposer> = {
	render: () => (
		<MessageFooterCallout>
			Feedback text <MessageFooterCalloutDivider />
			<MessageFooterCalloutAction onClick={(): void => undefined}>Button</MessageFooterCalloutAction>
		</MessageFooterCallout>
	),
};
