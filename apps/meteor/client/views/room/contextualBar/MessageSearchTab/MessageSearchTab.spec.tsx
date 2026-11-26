import type { IMessage } from '@rocket.chat/core-typings';
import { Message } from '@rocket.chat/fuselage';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

import MessageSearchTab from './MessageSearchTab';
import { createFakeMessage } from '../../../../../tests/mocks/data';
import { expectListKeyboard, listWrapper } from '../../../../../tests/mocks/utils/listContract';

const messages: IMessage[] = [
	createFakeMessage({ _id: 'first', msg: 'first result', ts: new Date('2026-11-17T10:00:00Z') }),
	createFakeMessage({ _id: 'second', msg: 'second result', ts: new Date('2026-11-17T11:00:00Z') }),
];

jest.mock('./hooks/useMessageSearchProviderQuery', () => ({
	useMessageSearchProviderQuery: () => ({ isSuccess: true, isError: false, data: { key: 'mongoDBSearchProvider' } }),
}));

jest.mock('./hooks/useMessageSearchQuery', () => ({
	useMessageSearchQuery: () => ({ isSuccess: true, isPending: false, data: messages }),
}));

jest.mock('./components/MessageSearchForm', () => ({
	__esModule: true,
	default: () => null,
}));

jest.mock('../../contexts/RoomContext', () => ({
	useRoom: () => ({ _id: 'room', t: 'c' }),
	useRoomSubscription: () => undefined,
}));

jest.mock('../../MessageList/providers/MessageListProvider', () => ({
	__esModule: true,
	default: ({ children }: { children: ReactNode }) => children,
}));

// Stands in for a room message: a focusable Fuselage message with a link inside it for Tab to walk.
const MockMessage = ({ message }: { message: IMessage }) => (
	<Message tabIndex={0} data-testid='message-row'>
		<a href={`#${message._id}`}>{message.msg}</a>
	</Message>
);

jest.mock('../../../../components/message/variants/RoomMessage', () => ({
	__esModule: true,
	default: (props: { message: IMessage }) => <MockMessage {...props} />,
}));

jest.mock('../../../../components/message/variants/SystemMessage', () => ({
	__esModule: true,
	default: (props: { message: IMessage }) => <MockMessage {...props} />,
}));

const renderSearch = () =>
	render(<MessageSearchTab />, {
		wrapper: listWrapper(mockAppRoot().withSetting('PageSize', 10).withUserPreference('displayAvatars', true)),
	});

it('moves between search results with the arrow keys', async () => {
	renderSearch();

	const [first] = screen.getAllByTestId('message-row');
	await expectListKeyboard(screen.getByTestId('virtuoso-item-list'), first);
});
