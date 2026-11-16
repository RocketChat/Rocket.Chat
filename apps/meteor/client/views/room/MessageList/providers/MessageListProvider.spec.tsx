import { mockAppRoot } from '@rocket.chat/mock-providers';
import { useMessageDisplay } from '@rocket.chat/ui-message-list';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';

import MessageListProvider from './MessageListProvider';
import { createFakeRoom } from '../../../../../tests/mocks/data';
import {
	useMessageListAuthorUsername,
	useMessageListHighlights,
	useMessageListShowRealName,
	useMessageListShowRoles,
} from '../../../../components/message/list/MessageListContext';

const room = createFakeRoom({ t: 'c' });

jest.mock('../../../../../rocketchat.info', () => ({ Info: {} }));
jest.mock('../../../../lib/rooms/roomCoordinator', () => ({ roomCoordinator: { isLivechatRoom: () => false } }));
jest.mock('../../contexts/RoomContext', () => ({
	useRoom: () => room,
	useRoomSubscription: () => undefined,
}));
jest.mock('../hooks/useRolesByUser', () => ({ useRolesByUser: () => undefined }));

it('agrees with the display context on what the viewer sees (R33)', () => {
	const { result } = renderHook(
		() => ({
			display: useMessageDisplay(),
			highlights: useMessageListHighlights(),
			showRealName: useMessageListShowRealName(),
			showRoles: useMessageListShowRoles(),
		}),
		{
			wrapper: mockAppRoot()
				.withJohnDoe()
				.withSetting('UI_Use_Real_Name', true)
				.withSetting('UI_DisplayRoles', true)
				.withUserPreference('highlights', ['alpha', 'beta'])
				.wrap((children: ReactNode) => <MessageListProvider>{children}</MessageListProvider>)
				.build(),
		},
	);

	const { display, highlights, showRealName, showRoles } = result.current;

	expect(highlights?.map(({ highlight }) => highlight)).toEqual(['alpha', 'beta']);
	expect(display.highlights?.map(({ highlight }) => highlight)).toEqual(['alpha', 'beta']);
	expect(display.showRealName).toBe(showRealName);
	expect(display.showRoles).toBe(showRoles);
});

it.each([
	[true, false],
	[false, true],
])('agrees with the display context on usernames when the viewer hides them: %s (R33)', (hideUsernames, expected) => {
	const { result } = renderHook(
		() => ({ display: useMessageDisplay(), authorUsername: useMessageListAuthorUsername({ name: 'Alice', username: 'alice' }) }),
		{
			wrapper: mockAppRoot()
				.withJohnDoe()
				.withSetting('UI_Use_Real_Name', true)
				.withUserPreference('hideUsernames', hideUsernames)
				.wrap((children: ReactNode) => <MessageListProvider>{children}</MessageListProvider>)
				.build(),
		},
	);

	expect(result.current.authorUsername.showUsername).toBe(expected);
	expect(result.current.display.showUsername).toBe(expected);
});
