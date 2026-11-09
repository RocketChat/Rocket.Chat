import { screen } from '@testing-library/react';
import type { ReactElement } from 'react';

import MessageBlock from './MessageBlock.js';
import MessageContainer from './MessageContainer.js';
import MessageContainerFixed from './MessageContainerFixed.js';
import MessageDivider from './MessageDivider/MessageDivider.js';
import MessageGenericPreview from './MessageGenericPreview/MessageGenericPreview.js';
import MessageGenericPreviewDescription from './MessageGenericPreview/MessageGenericPreviewDescription.js';
import MessageGenericPreviewFooter from './MessageGenericPreview/MessageGenericPreviewFooter.js';
import MessageGenericPreviewThumb from './MessageGenericPreview/MessageGenericPreviewThumb.js';
import MessageGenericPreviewTitle from './MessageGenericPreview/MessageGenericPreviewTitle.js';
import MessageHeader from './MessageHeader.js';
import MessageLeftContainer from './MessageLeftContainer.js';
import MessageMetrics from './MessageMetrics/MessageMetrics.js';
import MessageMetricsItemLabel from './MessageMetrics/MessageMetricsItem/MessageMetricsItemLabel.js';
import MessageName from './MessageName.js';
import MessageNameContainer from './MessageNameContainer.js';
import MessageReactions from './MessageReactions/MessageReactions.js';
import MessageRole from './MessageRole.js';
import MessageRoles from './MessageRoles.js';
import MessageStatusIndicator from './MessageStatusIndicator/MessageStatusIndicator.js';
import MessageStatusIndicatorItem from './MessageStatusIndicator/MessageStatusIndicatorItem.js';
import MessageStatusPrivateIndicator from './MessageStatusIndicator/MessageStatusPrivateIndicator.js';
import MessageSystem from './MessageSystem/MessageSystem.js';
import MessageSystemBlock from './MessageSystem/MessageSystemBlock.js';
import MessageSystemBody from './MessageSystem/MessageSystemBody.js';
import MessageSystemContainer from './MessageSystem/MessageSystemContainer.js';
import MessageSystemName from './MessageSystem/MessageSystemName.js';
import MessageSystemTimestamp from './MessageSystem/MessageSystemTimestamp.js';
import MessageTimestamp from './MessageTimestamp.js';
import MessageUsername from './MessageUsername.js';
import ThreadMessage from './ThreadMessage/ThreadMessage.js';
import ThreadMessageBody from './ThreadMessage/ThreadMessageBody.js';
import ThreadMessageContainer from './ThreadMessage/ThreadMessageContainer.js';
import ThreadMessageOrigin from './ThreadMessage/ThreadMessageOrigin.js';
import ThreadMessageRow from './ThreadMessage/ThreadMessageRow.js';
import { render } from '../../testing.js';

const cases: [string, ReactElement, string][] = [
	['MessageBlock', <MessageBlock data-testid='part' className='custom' />, 'rcx-message-block'],
	['MessageContainer', <MessageContainer data-testid='part' className='custom' />, 'rcx-item__content'],
	['MessageContainerFixed', <MessageContainerFixed data-testid='part' className='custom' />, 'rcx-message-container--fixed'],
	['MessageHeader', <MessageHeader data-testid='part' className='custom' />, 'rcx-message-header'],
	['MessageLeftContainer', <MessageLeftContainer data-testid='part' className='custom' />, 'rcx-message-container--left'],
	['MessageName', <MessageName data-testid='part' className='custom' />, 'rcx-message-header__name'],
	['MessageNameContainer', <MessageNameContainer data-testid='part' className='custom' />, 'rcx-message-header__name-container'],
	['MessageRole', <MessageRole data-testid='part' className='custom' />, 'rcx-tag'],
	['MessageRoles', <MessageRoles data-testid='part' className='custom' />, 'rcx-message-header__roles'],
	['MessageTimestamp', <MessageTimestamp data-testid='part' className='custom' />, 'rcx-message-header__time'],
	['MessageUsername', <MessageUsername data-testid='part' className='custom' />, 'rcx-message-header__username'],
	['MessageDivider', <MessageDivider data-testid='part' className='custom' unreadLabel='New' />, 'rcx-message-divider--unread'],
	['MessageGenericPreview', <MessageGenericPreview data-testid='part' className='custom' />, 'rcx-message-generic-preview'],
	[
		'MessageGenericPreviewThumb',
		<MessageGenericPreviewThumb data-testid='part' className='custom' />,
		'rcx-message-generic-preview__thumb',
	],
	[
		'MessageGenericPreviewTitle',
		<MessageGenericPreviewTitle data-testid='part' className='custom' />,
		'rcx-message-generic-preview__title',
	],
	['MessageMetrics', <MessageMetrics data-testid='part' className='custom' />, 'rcx-message-metrics__content-wrapper'],
	['MessageMetricsItemLabel', <MessageMetricsItemLabel data-testid='part' className='custom' />, 'rcx-message-metrics__item-label'],
	['MessageReactions', <MessageReactions data-testid='part' className='custom' />, 'rcx-message-reactions__container'],
	['MessageStatusIndicator', <MessageStatusIndicator data-testid='part' className='custom' />, 'rcx-message-status-indicator'],
	[
		'MessageStatusIndicatorItem',
		<MessageStatusIndicatorItem data-testid='part' className='custom' name='star' />,
		'rcx-message-status-indicator__item',
	],
	['MessageSystem', <MessageSystem data-testid='part' className='custom' />, 'rcx-message-system'],
	['MessageSystemBlock', <MessageSystemBlock data-testid='part' className='custom' />, 'rcx-message-system__block'],
	['MessageSystemBody', <MessageSystemBody data-testid='part' className='custom' />, 'rcx-message-system__body'],
	['MessageSystemContainer', <MessageSystemContainer data-testid='part' className='custom' />, 'rcx-message-system__container'],
	['MessageSystemName', <MessageSystemName data-testid='part' className='custom' />, 'rcx-message-system__name'],
	[
		'MessageSystemTimestamp',
		<MessageSystemTimestamp data-testid='part' className='custom'>
			12:00
		</MessageSystemTimestamp>,
		'rcx-message-system__time',
	],
	['ThreadMessage', <ThreadMessage data-testid='part' className='custom' />, 'rcx-message-thread'],
	['ThreadMessageBody', <ThreadMessageBody data-testid='part' className='custom' />, 'rcx-message-thread__message'],
	['ThreadMessageContainer', <ThreadMessageContainer data-testid='part' className='custom' />, 'rcx-message-thread__container'],
	[
		'MessageGenericPreviewDescription',
		<MessageGenericPreviewDescription data-testid='part' className='custom' />,
		'rcx-message-generic-preview__description',
	],
	[
		'MessageGenericPreviewFooter',
		<MessageGenericPreviewFooter data-testid='part' className='custom' />,
		'rcx-message-generic-preview__footer',
	],
	[
		'MessageStatusPrivateIndicator',
		<MessageStatusPrivateIndicator data-testid='part' className='custom' />,
		'rcx-message-status-indicator__item',
	],
	['ThreadMessageOrigin', <ThreadMessageOrigin data-testid='part' className='custom' />, 'rcx-message-thread__origin'],
	['ThreadMessageRow', <ThreadMessageRow data-testid='part' className='custom' />, 'rcx-message-thread__row'],
];

describe('consumer className on Message parts', () => {
	it.each(cases)('%s keeps its own class next to the consumer one', (_name, element, ownClass) => {
		render(element);

		expect(screen.getByTestId('part')).toHaveClass(ownClass, 'custom');
	});
});
