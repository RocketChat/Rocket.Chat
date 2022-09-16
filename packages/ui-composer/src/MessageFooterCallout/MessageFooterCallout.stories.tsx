import type { ComponentMeta, ComponentStory } from '@storybook/react';

import '@rocket.chat/icons/dist/rocketchat.css';
import { MessageFooterCallout, MessageFooterCalloutAction } from '.';
import MessageComposer from '../MessageComposer/MessageComposer';
import MessageComposerIcon from '../MessageComposer/MessageComposerIcon';
import MessageFooterCalloutDivider from './MessageFooterCalloutDivider';
import MessageFooterCalloutContent from './MessageFooterCalloutContent';

export default {
	title: 'Components/MessageComposer/Locked',
	component: MessageComposer,
} as ComponentMeta<typeof MessageComposer>;

export const messageComposerBlocked: ComponentStory<typeof MessageComposer> = () => (
	<MessageFooterCallout>
		<MessageComposerIcon name='burger' />
		Feedback text
	</MessageFooterCallout>
);

export const messageComposerBlockedLargeText: ComponentStory<typeof MessageComposer> = () => (
	<MessageFooterCallout>
		<MessageComposerIcon name='burger' />
		<MessageFooterCalloutContent>
			Feedback text Feedback text Feedback text Feedback text Feedback text Feedback text Feedback text Feedback text Feedback text Feedback
			text Feedback text Feedback text Feedback text Feedback text Feedback text text Feedback text Feedback text Feedback text Feedback
			text Feedback text text Feedback text Feedback text Feedback text Feedback text Feedback text text Feedback text Feedback text
			Feedback text Feedback text Feedback text
		</MessageFooterCalloutContent>
		<MessageFooterCalloutAction onClick={() => undefined}>Button</MessageFooterCalloutAction>
	</MessageFooterCallout>
);

export const messageComposerBlockedLargeTextDashed: ComponentStory<typeof MessageComposer> = () => (
	<MessageFooterCallout dashed>
		<MessageComposerIcon name='burger' />
		<MessageFooterCalloutContent>
			Feedback text Feedback text Feedback text Feedback text Feedback text Feedback text Feedback text Feedback text Feedback text Feedback
			text Feedback text Feedback text Feedback text Feedback text Feedback text text Feedback text Feedback text Feedback text Feedback
			text Feedback text text Feedback text Feedback text Feedback text Feedback text Feedback text text Feedback text Feedback text
			Feedback text Feedback text Feedback text
		</MessageFooterCalloutContent>
		<MessageFooterCalloutAction onClick={() => undefined}>Button</MessageFooterCalloutAction>
	</MessageFooterCallout>
);

export const messageFooterCalloutAction: ComponentStory<typeof MessageComposer> = () => (
	<MessageFooterCallout>
		Feedback text <MessageFooterCalloutDivider />
		<MessageFooterCalloutAction onClick={() => undefined}>Button</MessageFooterCalloutAction>
	</MessageFooterCallout>
);
