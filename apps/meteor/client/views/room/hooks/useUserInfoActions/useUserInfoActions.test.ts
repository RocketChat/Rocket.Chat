import { it } from 'node:test';

import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';
import { expect } from 'expect';
import { fn } from 'jest-mock';
import type { FunctionLike } from 'jest-mock';
import proxyquire from 'proxyquire';

function mockAction(content: string, type: string) {
	return () => ({ content, type, onClick: fn<FunctionLike>() });
}

const { useUserInfoActions } = proxyquire.noCallThru().load<typeof import('./useUserInfoActions')>('./useUserInfoActions', {
	'./actions/useAddUserAction': {
		useAddUserAction: () => undefined,
	},
	'./actions/useBanUserAction': {
		useBanUserAction: mockAction('Ban', 'moderation'),
	},
	'./actions/useBlockUserAction': {
		useBlockUserAction: () => undefined,
	},
	'./actions/useChangeLeaderAction': {
		useChangeLeaderAction: mockAction('Set_as_leader', 'privileges'),
	},
	'./actions/useChangeModeratorAction': {
		useChangeModeratorAction: mockAction('Set_as_moderator', 'privileges'),
	},
	'./actions/useChangeOwnerAction': {
		useChangeOwnerAction: mockAction('Set_as_owner', 'privileges'),
	},
	'./actions/useDirectMessageAction': {
		useDirectMessageAction: mockAction('Direct_Message', 'communication'),
	},
	'./actions/useIgnoreUserAction': {
		useIgnoreUserAction: mockAction('Ignore', 'management'),
	},
	'./actions/useMuteUserAction': {
		useMuteUserAction: mockAction('Mute_user', 'management'),
	},
	'./actions/useRemoveUserAction': {
		useRemoveUserAction: mockAction('Remove_from_room', 'moderation'),
	},
	'./actions/useReportUser': {
		useReportUser: () => undefined,
	},
	'./actions/useUserMediaCallAction': {
		useUserMediaCallAction: () => undefined,
	},
	'./actions/useVideoCallAction': {
		useVideoCallAction: mockAction('Video_call', 'communication'),
	},
});

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
