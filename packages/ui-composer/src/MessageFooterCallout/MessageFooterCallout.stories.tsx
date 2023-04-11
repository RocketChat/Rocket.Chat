import type { ComponentMeta, ComponentStory } from '@storybook/react';

import { MessageFooterCallout, MessageFooterCalloutAction } from '.';
import MessageComposer from '../MessageComposer/MessageComposer';
import MessageComposerIcon from '../MessageComposer/MessageComposerIcon';
import MessageFooterCalloutContent from './MessageFooterCalloutContent';
import MessageFooterCalloutDivider from './MessageFooterCalloutDivider';
import '@rocket.chat/icons/dist/rocketchat.css';

export default {
	title: 'Components/MessageComposer/Locked',
	component: MessageComposer,
} as ComponentMeta<typeof MessageComposer>;

export const MessageComposerBlocked: ComponentStory<typeof MessageComposer> = () => (
	<MessageFooterCallout>
		<MessageComposerIcon name='burger' />
		Feedback text
	</MessageFooterCallout>
);

export const MessageComposerBlockedLargeText: ComponentStory<typeof MessageComposer> = () => (
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

export const MessageComposerBlockedLargeTextDashed: ComponentStory<typeof MessageComposer> = () => (
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

export const _MessageFooterCalloutAction: ComponentStory<typeof MessageComposer> = () => (
	<MessageFooterCallout>
		Feedback text <MessageFooterCalloutDivider />
		<MessageFooterCalloutAction onClick={(): void => undefined}>Button</MessageFooterCalloutAction>
	</MessageFooterCallout>
);
