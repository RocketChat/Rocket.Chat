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
import MessageMetricsItemLabel from './MessageMetrics/MessageMetricsItem/MessageMetricsItemLabel';
import MessageName from './MessageName';
import MessageNameContainer from './MessageNameContainer';
import MessageReactions from './MessageReactions/MessageReactions';
import MessageRole from './MessageRole';
import MessageRoles from './MessageRoles';
import MessageStatusIndicator from './MessageStatusIndicator/MessageStatusIndicator';
import MessageStatusIndicatorItem from './MessageStatusIndicator/MessageStatusIndicatorItem';
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
import ThreadMessageOrigin from './ThreadMessage/ThreadMessageOrigin';
import ThreadMessageRow from './ThreadMessage/ThreadMessageRow';
import { render } from '../../testing';

const cases: { name: string; element: ReactElement; ownClass: string }[] = [
	{ name: 'MessageBlock', element: <MessageBlock data-testid='part' className='custom' />, ownClass: 'rcx-message-block' },
	{ name: 'MessageContainer', element: <MessageContainer data-testid='part' className='custom' />, ownClass: 'rcx-item__content' },
	{
		name: 'MessageContainerFixed',
		element: <MessageContainerFixed data-testid='part' className='custom' />,
		ownClass: 'rcx-message-container--fixed',
	},
	{ name: 'MessageHeader', element: <MessageHeader data-testid='part' className='custom' />, ownClass: 'rcx-message-header' },
	{
		name: 'MessageLeftContainer',
		element: <MessageLeftContainer data-testid='part' className='custom' />,
		ownClass: 'rcx-message-container--left',
	},
	{ name: 'MessageName', element: <MessageName data-testid='part' className='custom' />, ownClass: 'rcx-message-header__name' },
	{
		name: 'MessageNameContainer',
		element: <MessageNameContainer data-testid='part' className='custom' />,
		ownClass: 'rcx-message-header__name-container',
	},
	{ name: 'MessageRole', element: <MessageRole data-testid='part' className='custom' />, ownClass: 'rcx-tag' },
	{ name: 'MessageRoles', element: <MessageRoles data-testid='part' className='custom' />, ownClass: 'rcx-message-header__roles' },
	{ name: 'MessageTimestamp', element: <MessageTimestamp data-testid='part' className='custom' />, ownClass: 'rcx-message-header__time' },
	{ name: 'MessageUsername', element: <MessageUsername data-testid='part' className='custom' />, ownClass: 'rcx-message-header__username' },
	{
		name: 'MessageDivider',
		element: <MessageDivider data-testid='part' className='custom' unreadLabel='New' />,
		ownClass: 'rcx-message-divider--unread',
	},
	{
		name: 'MessageGenericPreview',
		element: <MessageGenericPreview data-testid='part' className='custom' />,
		ownClass: 'rcx-message-generic-preview',
	},
	{
		name: 'MessageGenericPreviewThumb',
		element: <MessageGenericPreviewThumb data-testid='part' className='custom' />,
		ownClass: 'rcx-message-generic-preview__thumb',
	},
	{
		name: 'MessageGenericPreviewTitle',
		element: <MessageGenericPreviewTitle data-testid='part' className='custom' />,
		ownClass: 'rcx-message-generic-preview__title',
	},
	{
		name: 'MessageMetrics',
		element: <MessageMetrics data-testid='part' className='custom' />,
		ownClass: 'rcx-message-metrics__content-wrapper',
	},
	{
		name: 'MessageMetricsItemLabel',
		element: <MessageMetricsItemLabel data-testid='part' className='custom' />,
		ownClass: 'rcx-message-metrics__item-label',
	},
	{
		name: 'MessageReactions',
		element: <MessageReactions data-testid='part' className='custom' />,
		ownClass: 'rcx-message-reactions__container',
	},
	{
		name: 'MessageStatusIndicator',
		element: <MessageStatusIndicator data-testid='part' className='custom' />,
		ownClass: 'rcx-message-status-indicator',
	},
	{
		name: 'MessageStatusIndicatorItem',
		element: <MessageStatusIndicatorItem data-testid='part' className='custom' name='star' />,
		ownClass: 'rcx-message-status-indicator__item',
	},
	{ name: 'MessageSystem', element: <MessageSystem data-testid='part' className='custom' />, ownClass: 'rcx-message-system' },
	{
		name: 'MessageSystemBlock',
		element: <MessageSystemBlock data-testid='part' className='custom' />,
		ownClass: 'rcx-message-system__block',
	},
	{ name: 'MessageSystemBody', element: <MessageSystemBody data-testid='part' className='custom' />, ownClass: 'rcx-message-system__body' },
	{
		name: 'MessageSystemContainer',
		element: <MessageSystemContainer data-testid='part' className='custom' />,
		ownClass: 'rcx-message-system__container',
	},
	{ name: 'MessageSystemName', element: <MessageSystemName data-testid='part' className='custom' />, ownClass: 'rcx-message-system__name' },
	{
		name: 'MessageSystemTimestamp',
		element: (
			<MessageSystemTimestamp data-testid='part' className='custom'>
				12:00
			</MessageSystemTimestamp>
		),
		ownClass: 'rcx-message-system__time',
	},
	{ name: 'ThreadMessage', element: <ThreadMessage data-testid='part' className='custom' />, ownClass: 'rcx-message-thread' },
	{
		name: 'ThreadMessageBody',
		element: <ThreadMessageBody data-testid='part' className='custom' />,
		ownClass: 'rcx-message-thread__message',
	},
	{
		name: 'ThreadMessageContainer',
		element: <ThreadMessageContainer data-testid='part' className='custom' />,
		ownClass: 'rcx-message-thread__container',
	},
	{
		name: 'MessageGenericPreviewDescription',
		element: <MessageGenericPreviewDescription data-testid='part' className='custom' />,
		ownClass: 'rcx-message-generic-preview__description',
	},
	{
		name: 'MessageGenericPreviewFooter',
		element: <MessageGenericPreviewFooter data-testid='part' className='custom' />,
		ownClass: 'rcx-message-generic-preview__footer',
	},
	{
		name: 'MessageStatusPrivateIndicator',
		element: <MessageStatusPrivateIndicator data-testid='part' className='custom' />,
		ownClass: 'rcx-message-status-indicator__item',
	},
	{
		name: 'ThreadMessageOrigin',
		element: <ThreadMessageOrigin data-testid='part' className='custom' />,
		ownClass: 'rcx-message-thread__origin',
	},
	{ name: 'ThreadMessageRow', element: <ThreadMessageRow data-testid='part' className='custom' />, ownClass: 'rcx-message-thread__row' },
];

describe('consumer className on Message parts', () => {
	it.each(cases)('$name keeps its own class next to the consumer one', ({ element, ownClass }) => {
		render(element);

		expect(screen.getByTestId('part')).toHaveClass(ownClass, 'custom');
	});
});
