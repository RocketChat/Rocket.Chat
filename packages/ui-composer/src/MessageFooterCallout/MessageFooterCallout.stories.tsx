import type { Meta, StoryObj } from '@storybook/react';

import { MessageFooterCallout, MessageFooterCalloutAction } from '.';
import MessageFooterCalloutContent from './MessageFooterCalloutContent';
import MessageFooterCalloutDivider from './MessageFooterCalloutDivider';
import MessageComposer from '../MessageComposer/MessageComposer';
import MessageComposerIcon from '../MessageComposer/MessageComposerIcon';

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
