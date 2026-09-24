import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';

import { useEditMessageAction } from './useEditMessageAction';
import { useFollowMessageAction } from './useFollowMessageAction';
import { useNewDiscussionMessageAction } from './useNewDiscussionMessageAction';
import { usePinMessageAction } from './usePinMessageAction';
import { useStarMessageAction } from './useStarMessageAction';
import { useTranslateAction } from './useTranslateAction';
import { useUnpinMessageAction } from './useUnpinMessageAction';
import { useUnstarMessageAction } from './useUnstarMessageAction';
import { useWebDAVMessageAction } from './useWebDAVMessageAction';
import { createFakeMessage, createFakeRoom, createFakeSubscription, createFakeUser } from '../../../../tests/mocks/data';
import { useMessageActionsPolicyValue } from '../../../views/room/MessageList/providers/useMessageListContract';
import { MessageActionsContext } from '../list/MessageActionsContext';
import { inertMessageActions } from '../list/messageListContract';

jest.mock('../../../../app/utils/rocketchat.info', () => ({ Info: {} }));
jest.mock('../../../lib/rooms/roomCoordinator', () => ({
	roomCoordinator: {
		isLivechatRoom: (type: string) => type === 'l',
		openRouteLink: jest.fn(),
	},
}));

const viewer = createFakeUser({ _id: 'viewer-id', username: 'viewer' });
const someoneElse = { _id: 'someone-else', username: 'someone', name: 'Someone' };

const room = createFakeRoom({ _id: 'room-id', t: 'c', name: 'general' });
const omnichannelRoom = createFakeRoom({ _id: 'room-id', t: 'l' } as Partial<IRoom>);
const subscription = createFakeSubscription({ rid: 'room-id', t: 'c' });

const ownMessage = createFakeMessage({ _id: 'own', rid: 'room-id', u: { _id: viewer._id, username: 'viewer' }, ts: new Date() });
const othersMessage = createFakeMessage({ _id: 'others', rid: 'room-id', u: someoneElse, ts: new Date() });

type Builder = ReturnType<typeof mockAppRoot>;

const RoomActionsPolicy = ({ children }: { children?: ReactNode }) => {
	const actionsPolicy = useMessageActionsPolicyValue(room);
	return (
		<MessageActionsContext.Provider value={{ policy: actionsPolicy, actions: inertMessageActions }}>
			{children}
		</MessageActionsContext.Provider>
	);
};

const renderAction = <T,>(useAction: () => T, builder: Builder) => {
	const AppRoot = builder.build();
	const wrapper = ({ children }: { children: ReactNode }) => (
		<AppRoot>
			<RoomActionsPolicy>{children}</RoomActionsPolicy>
		</AppRoot>
	);

	return renderHook(useAction, { wrapper }).result.current;
};

const withViewer = () => mockAppRoot().withUser(viewer);

describe('message actions gating', () => {
	describe('star / unstar', () => {
		it('offers starring when the workspace allows it', () => {
			expect(
				renderAction(() => useStarMessageAction(othersMessage, { room }), withViewer().withSetting('Message_AllowStarring', true)),
			).not.toBeNull();
		});

		it('offers neither when starring is disabled', () => {
			const starred = { ...othersMessage, starred: [{ _id: viewer._id }] } as IMessage;
			expect(
				renderAction(() => useStarMessageAction(othersMessage, { room }), withViewer().withSetting('Message_AllowStarring', false)),
			).toBeNull();
			expect(
				renderAction(() => useUnstarMessageAction(starred, { room }), withViewer().withSetting('Message_AllowStarring', false)),
			).toBeNull();
		});

		it('offers unstarring, not starring, for a message the viewer starred', () => {
			const starred = { ...othersMessage, starred: [{ _id: viewer._id }] } as IMessage;
			expect(
				renderAction(() => useStarMessageAction(starred, { room }), withViewer().withSetting('Message_AllowStarring', true)),
			).toBeNull();
			expect(
				renderAction(() => useUnstarMessageAction(starred, { room }), withViewer().withSetting('Message_AllowStarring', true)),
			).not.toBeNull();
		});

		it('offers neither in an omnichannel room', () => {
			expect(
				renderAction(
					() => useStarMessageAction(othersMessage, { room: omnichannelRoom }),
					withViewer().withSetting('Message_AllowStarring', true),
				),
			).toBeNull();
		});
	});

	describe('pin / unpin', () => {
		const allowed = () => withViewer().withSetting('Message_AllowPinning', true).withPermission('pin-message');

		it('offers pinning with the setting and the permission', () => {
			expect(renderAction(() => usePinMessageAction(othersMessage, { room, subscription }), allowed())).not.toBeNull();
		});

		it('does not offer pinning without the permission', () => {
			expect(
				renderAction(
					() => usePinMessageAction(othersMessage, { room, subscription }),
					withViewer().withSetting('Message_AllowPinning', true),
				),
			).toBeNull();
		});

		it('does not offer pinning when the setting is off', () => {
			expect(
				renderAction(
					() => usePinMessageAction(othersMessage, { room, subscription }),
					withViewer().withSetting('Message_AllowPinning', false).withPermission('pin-message'),
				),
			).toBeNull();
		});

		it('offers unpinning, not pinning, for a pinned message', () => {
			const pinned = { ...othersMessage, pinned: true };
			expect(renderAction(() => usePinMessageAction(pinned, { room, subscription }), allowed())).toBeNull();
			expect(renderAction(() => useUnpinMessageAction(pinned, { room, subscription }), allowed())).not.toBeNull();
		});

		it('offers neither without a subscription', () => {
			expect(renderAction(() => usePinMessageAction(othersMessage, { room, subscription: undefined }), allowed())).toBeNull();
		});
	});

	describe('edit', () => {
		it('offers editing an own message when editing is allowed', () => {
			expect(
				renderAction(
					() => useEditMessageAction(ownMessage, { room, subscription }),
					withViewer().withSetting('Message_AllowEditing', true),
				),
			).not.toBeNull();
		});

		it("does not offer editing someone else's message without the permission", () => {
			expect(
				renderAction(
					() => useEditMessageAction(othersMessage, { room, subscription }),
					withViewer().withSetting('Message_AllowEditing', true),
				),
			).toBeNull();
		});

		it("offers editing someone else's message with the permission", () => {
			expect(
				renderAction(
					() => useEditMessageAction(othersMessage, { room, subscription }),
					withViewer().withSetting('Message_AllowEditing', true).withPermission('edit-message'),
				),
			).not.toBeNull();
		});

		it('stops offering it once the edit window has passed, unless the viewer may bypass it', () => {
			const old = { ...ownMessage, ts: new Date(Date.now() - 10 * 60 * 1000) };
			const windowed = () =>
				withViewer().withSetting('Message_AllowEditing', true).withSetting('Message_AllowEditing_BlockEditInMinutes', 5);

			expect(renderAction(() => useEditMessageAction(old, { room, subscription }), windowed())).toBeNull();
			expect(
				renderAction(
					() => useEditMessageAction(old, { room, subscription }),
					windowed().withPermission('bypass-time-limit-edit-and-delete'),
				),
			).not.toBeNull();
		});
	});

	describe('follow', () => {
		it('offers following when threads are enabled', () => {
			expect(
				renderAction(
					() => useFollowMessageAction(othersMessage, { room, context: 'message' }),
					withViewer().withSetting('Threads_enabled', true),
				),
			).not.toBeNull();
		});

		it('does not offer following when threads are disabled', () => {
			expect(
				renderAction(
					() => useFollowMessageAction(othersMessage, { room, context: 'message' }),
					withViewer().withSetting('Threads_enabled', false),
				),
			).toBeNull();
		});
	});

	describe('start discussion', () => {
		it('needs the setting and, for someone else’s message, the other-user permission', () => {
			const enabled = () => withViewer().withSetting('Discussion_enabled', true);

			expect(renderAction(() => useNewDiscussionMessageAction(othersMessage, { room, subscription }), enabled())).toBeNull();
			expect(
				renderAction(
					() => useNewDiscussionMessageAction(othersMessage, { room, subscription }),
					enabled().withPermission('start-discussion-other-user'),
				),
			).not.toBeNull();
			expect(
				renderAction(() => useNewDiscussionMessageAction(ownMessage, { room, subscription }), enabled().withPermission('start-discussion')),
			).not.toBeNull();
		});

		it('is not offered when discussions are disabled', () => {
			expect(
				renderAction(
					() => useNewDiscussionMessageAction(ownMessage, { room, subscription }),
					withViewer().withSetting('Discussion_enabled', false).withPermission('start-discussion'),
				),
			).toBeNull();
		});
	});

	describe('translate', () => {
		const translatingSubscription = { ...subscription, autoTranslate: true, autoTranslateLanguage: 'pt' };

		it('offers translating someone else’s message with auto-translate on and the permission', () => {
			expect(
				renderAction(
					() => useTranslateAction(othersMessage, { room, subscription: translatingSubscription }),
					withViewer().withSetting('AutoTranslate_Enabled', true).withPermission('auto-translate'),
				),
			).not.toBeNull();
		});

		it('is not offered without the permission or with auto-translate off', () => {
			expect(
				renderAction(
					() => useTranslateAction(othersMessage, { room, subscription: translatingSubscription }),
					withViewer().withSetting('AutoTranslate_Enabled', true),
				),
			).toBeNull();
			expect(
				renderAction(
					() => useTranslateAction(othersMessage, { room, subscription: translatingSubscription }),
					withViewer().withSetting('AutoTranslate_Enabled', false).withPermission('auto-translate'),
				),
			).toBeNull();
		});
	});

	describe('save to WebDAV', () => {
		it('is not offered when the integration is disabled', () => {
			const file = { ...othersMessage, file: { _id: 'file', name: 'a.txt', type: 'text/plain' } } as IMessage;
			expect(
				renderAction(() => useWebDAVMessageAction(file, { subscription }), withViewer().withSetting('Webdav_Integration_Enabled', false)),
			).toBeNull();
		});
	});
});
