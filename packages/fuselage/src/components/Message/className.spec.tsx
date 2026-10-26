import { screen } from '@testing-library/react';
import type { ReactElement } from 'react';

import MessageBlock from './MessageBlock';
import MessageContainer from './MessageContainer';
import MessageContainerFixed from './MessageContainerFixed';
import MessageDivider from './MessageDivider/MessageDivider';
import MessageGenericPreview from './MessageGenericPreview/MessageGenericPreview';
import MessageGenericPreviewDescription from './MessageGenericPreview/MessageGenericPreviewDescription';
import MessageGenericPreviewFooter from './MessageGenericPreview/MessageGenericPreviewFooter';
import MessageGenericPreviewThumb from './MessageGenericPreview/MessageGenericPreviewThumb';
import MessageGenericPreviewTitle from './MessageGenericPreview/MessageGenericPreviewTitle';
import MessageHeader from './MessageHeader';
import MessageLeftContainer from './MessageLeftContainer';
import MessageMetrics from './MessageMetrics/MessageMetrics';
import MessageMetricsContentItem from './MessageMetrics/MessageMetricsContentItem';
import MessageMetricsItemLabel from './MessageMetrics/MessageMetricsItem/MessageMetricsItemLabel';
import MessageName from './MessageName';
import MessageNameContainer from './MessageNameContainer';
import MessageReactions from './MessageReactions/MessageReactions';
import MessageRole from './MessageRole';
import MessageRoles from './MessageRoles';
import MessageStatusIndicator from './MessageStatusIndicator/MessageStatusIndicator';
import MessageStatusIndicatorItem from './MessageStatusIndicator/MessageStatusIndicatorItem';
import MessageStatusIndicatorText from './MessageStatusIndicator/MessageStatusIndicatorText';
import MessageStatusPrivateIndicator from './MessageStatusIndicator/MessageStatusPrivateIndicator';
import MessageSystem from './MessageSystem/MessageSystem';
import MessageSystemBlock from './MessageSystem/MessageSystemBlock';
import MessageSystemBody from './MessageSystem/MessageSystemBody';
import MessageSystemContainer from './MessageSystem/MessageSystemContainer';
import MessageSystemName from './MessageSystem/MessageSystemName';
import MessageSystemTimestamp from './MessageSystem/MessageSystemTimestamp';
import MessageTimestamp from './MessageTimestamp';
import MessageUsername from './MessageUsername';
import ThreadMessage from './ThreadMessage/ThreadMessage';
import ThreadMessageBody from './ThreadMessage/ThreadMessageBody';
import ThreadMessageContainer from './ThreadMessage/ThreadMessageContainer';
import ThreadMessageIcon from './ThreadMessage/ThreadMessageIcon';
import ThreadMessageLeftContainer from './ThreadMessage/ThreadMessageLeftContainer';
import ThreadMessageOrigin from './ThreadMessage/ThreadMessageOrigin';
import ThreadMessageRow from './ThreadMessage/ThreadMessageRow';
import { render } from '../../testing';

const cases: [string, ReactElement, string][] = [
	['MessageBlock', <MessageBlock data-testid='part' className='custom' />, 'rcx-message-block'],
	['MessageContainer', <MessageContainer data-testid='part' className='custom' />, 'rcx-message-container'],
	['MessageContainerFixed', <MessageContainerFixed data-testid='part' className='custom' />, 'rcx-message-container--fixed'],
	['MessageHeader', <MessageHeader data-testid='part' className='custom' />, 'rcx-message-header'],
	['MessageLeftContainer', <MessageLeftContainer data-testid='part' className='custom' />, 'rcx-message-container--left'],
	['MessageName', <MessageName data-testid='part' className='custom' />, 'rcx-message-header__name'],
	['MessageNameContainer', <MessageNameContainer data-testid='part' className='custom' />, 'rcx-message-header__name-container'],
	['MessageRole', <MessageRole data-testid='part' className='custom' />, 'rcx-message-header__role'],
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
	['MessageMetricsContentItem', <MessageMetricsContentItem data-testid='part' className='custom' />, 'rcx-message-metrics__content-item'],
	['MessageMetricsItemLabel', <MessageMetricsItemLabel data-testid='part' className='custom' />, 'rcx-message-metrics__item-label'],
	['MessageReactions', <MessageReactions data-testid='part' className='custom' />, 'rcx-message-reactions__container'],
	['MessageStatusIndicator', <MessageStatusIndicator data-testid='part' className='custom' />, 'rcx-message-status-indicator'],
	[
		'MessageStatusIndicatorItem',
		<MessageStatusIndicatorItem data-testid='part' className='custom' name='star' variant='success' />,
		'rcx-message-status-indicator__item--success',
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
	['ThreadMessageIcon', <ThreadMessageIcon data-testid='part' className='custom' name='bell' />, 'rcx-message-thread__icon'],
	['ThreadMessageLeftContainer', <ThreadMessageLeftContainer data-testid='part' className='custom' />, 'rcx-message-container--left'],
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
		'MessageStatusIndicatorText',
		<MessageStatusIndicatorText data-testid='part' className='custom'>
			Status
		</MessageStatusIndicatorText>,
		'rcx-message-status-indicator__text',
	],
	[
		'MessageStatusPrivateIndicator',
		<MessageStatusPrivateIndicator data-testid='part' className='custom' />,
		'rcx-message-status-indicator__item--private',
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
