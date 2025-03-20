import type { Meta, StoryFn } from '@storybook/react';

import { MessageFooterCallout, MessageFooterCalloutAction } from '.';
import MessageFooterCalloutContent from './MessageFooterCalloutContent';
import MessageFooterCalloutDivider from './MessageFooterCalloutDivider';
import MessageComposer from '../MessageComposer/MessageComposer';
import MessageComposerIcon from '../MessageComposer/MessageComposerIcon';

import '@rocket.chat/icons/dist/rocketchat.css';

export default {
	title: 'Components/MessageComposer/Locked',
	component: MessageComposer,
} satisfies Meta<typeof MessageComposer>;

export const MessageComposerBlocked: StoryFn<typeof MessageComposer> = () => (
	<MessageFooterCallout>
		<MessageComposerIcon name='burger' />
		Feedback text
	</MessageFooterCallout>
);

export const MessageComposerBlockedLargeText: StoryFn<typeof MessageComposer> = () => (
	<MessageFooterCallout>
		<MessageComposerIcon name='burger' />
		<MessageFooterCalloutContent>
			Feedback text Feedback text Feedback text Feedback text Feedback text Feedback text Feedback text Feedback text Feedback text Feedback
			text Feedback text Feedback text Feedback text Feedback text Feedback text text Feedback text Feedback text Feedback text Feedback
			text Feedback text text Feedback text Feedback text Feedback text Feedback text Feedback text text Feedback text Feedback text
			Feedback text Feedback text Feedback text
		</MessageFooterCalloutContent>
		<MessageFooterCalloutAction onClick={(): void => undefined}>Button</MessageFooterCalloutAction>
	</MessageFooterCallout>
);

export const MessageComposerBlockedLargeTextDashed: StoryFn<typeof MessageComposer> = () => (
	<MessageFooterCallout dashed>
		<MessageComposerIcon name='burger' />
		<MessageFooterCalloutContent>
			Feedback text Feedback text Feedback text Feedback text Feedback text Feedback text Feedback text Feedback text Feedback text Feedback
			text Feedback text Feedback text Feedback text Feedback text Feedback text text Feedback text Feedback text Feedback text Feedback
			text Feedback text text Feedback text Feedback text Feedback text Feedback text Feedback text text Feedback text Feedback text
			Feedback text Feedback text Feedback text
		</MessageFooterCalloutContent>
		<MessageFooterCalloutAction onClick={(): void => undefined}>Button</MessageFooterCalloutAction>
	</MessageFooterCallout>
);

export const _MessageFooterCalloutAction: StoryFn<typeof MessageComposer> = () => (
	<MessageFooterCallout>
		Feedback text <MessageFooterCalloutDivider />
		<MessageFooterCalloutAction onClick={(): void => undefined}>Button</MessageFooterCalloutAction>
	</MessageFooterCallout>
);
