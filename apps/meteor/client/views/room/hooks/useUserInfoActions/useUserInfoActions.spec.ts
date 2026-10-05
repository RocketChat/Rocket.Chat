import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useUserInfoActions } from './useUserInfoActions';

function mockAction(content: string, type: string) {
	return () => ({ content, type, onClick: jest.fn() });
}

jest.mock('./actions/useDirectMessageAction', () => ({ useDirectMessageAction: mockAction('Direct_Message', 'communication') }));
jest.mock('./actions/useVideoCallAction', () => ({ useVideoCallAction: mockAction('Video_call', 'communication') }));
jest.mock('./actions/useUserMediaCallAction', () => ({ useUserMediaCallAction: () => undefined }));
jest.mock('./actions/useAddUserAction', () => ({ useAddUserAction: () => undefined }));
jest.mock('./actions/useChangeOwnerAction', () => ({ useChangeOwnerAction: mockAction('Set_as_owner', 'privileges') }));
jest.mock('./actions/useChangeLeaderAction', () => ({ useChangeLeaderAction: mockAction('Set_as_leader', 'privileges') }));
jest.mock('./actions/useChangeModeratorAction', () => ({ useChangeModeratorAction: mockAction('Set_as_moderator', 'privileges') }));
jest.mock('./actions/useIgnoreUserAction', () => ({ useIgnoreUserAction: mockAction('Ignore', 'management') }));
jest.mock('./actions/useMuteUserAction', () => ({ useMuteUserAction: mockAction('Mute_user', 'management') }));
jest.mock('./actions/useBlockUserAction', () => ({ useBlockUserAction: () => undefined }));
jest.mock('./actions/useRemoveUserAction', () => ({ useRemoveUserAction: mockAction('Remove_from_room', 'moderation') }));
jest.mock('./actions/useBanUserAction', () => ({ useBanUserAction: mockAction('Ban', 'moderation') }));
jest.mock('./actions/useReportUser', () => ({ useReportUser: () => undefined }));

it('groups the menu as communication, management, room roles and moderation', () => {
	const { result } = renderHook(
		() => useUserInfoActions({ user: { _id: 'member-id', username: 'member' }, rid: 'room-1', isMember: true, size: 0 }),
		{ wrapper: mockAppRoot().withPermission('view-moderation-console').build() },
	);

	expect(result.current.menuActions?.map(({ id, title, items }) => ({ id, title, items: items.map((item) => item.content) }))).toEqual([
		{ id: 'communication', title: '', items: ['Direct_Message', 'Video_call', 'Moderation_Action_View_reports'] },
		{ id: 'management', title: '', items: ['Mute_user', 'Ignore'] },
		{ id: 'privileges', title: 'Manage_room_roles', items: ['Set_as_owner', 'Set_as_leader', 'Set_as_moderator'] },
		{ id: 'moderation', title: '', items: ['Remove_from_room', 'Ban'] },
	]);
});
