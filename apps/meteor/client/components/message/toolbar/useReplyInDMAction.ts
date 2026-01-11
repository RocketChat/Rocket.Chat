import { type IMessage, type ISubscription, type IRoom, isE2EEMessage } from '@rocket.chat/core-typings';
import { useEmbeddedLayout } from '@rocket.chat/ui-client';
import { usePermission, useRouter, useUser } from '@rocket.chat/ui-contexts';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/shallow';

import type { MessageActionConfig } from '../../../../app/ui-utils/client/lib/MessageAction';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';
import { Rooms, Subscriptions } from '../../../stores';

export const useReplyInDMAction = (
	message: IMessage,
	{ room, subscription }: { room: IRoom; subscription: ISubscription | undefined },
): MessageActionConfig | null => {
	const user = useUser();
	const router = useRouter();
	const encrypted = isE2EEMessage(message);
	const isABACEnabled = !!room.abacAttributes;
	const canCreateDM = usePermission('create-d');
	const isLayoutEmbedded = useEmbeddedLayout();
	const { t } = useTranslation();

	const roomPredicate = useCallback(
		(record: IRoom): boolean => {
			const ids = [user?._id, message.u._id].sort().join('');
			return ids.includes(record._id);
		},
		[message.u._id, user],
	);

	const shouldFindRoom = useMemo(() => !!user && canCreateDM && user._id !== message.u._id, [canCreateDM, message.u._id, user]);
	const dmRoom = Rooms.use(useShallow((state) => (shouldFindRoom ? state.find(roomPredicate) : undefined)));

	const subsPredicate = useCallback(
		(record: ISubscription) => record.rid === dmRoom?._id || record.u._id === user?._id,
		[dmRoom, user?._id],
	);
	const dmSubs = Subscriptions.use(useShallow((state) => state.find(subsPredicate)));

	const tooltip = useMemo(() => {
		if (encrypted) {
			return t('Action_not_available_encrypted_content', { action: t('Reply_in_direct_message') });
		}
		if (isABACEnabled) {
			return t('Not_available_for_ABAC_enabled_rooms');
		}
		return null;
	}, [encrypted, isABACEnabled, t]);

	const canReplyInDM = useMemo(() => {
		if (!subscription || room.t === 'd' || room.t === 'l' || isLayoutEmbedded) {
			return false;
		}
		if (!!user && user._id !== message.u._id && canCreateDM) {
			if (!dmRoom || !dmSubs) {
				return false;
			}
		}
		return true;
	}, [canCreateDM, dmRoom, dmSubs, isLayoutEmbedded, message.u._id, room.t, subscription, user]);

	if (!canReplyInDM) {
		return null;
	}

	return {
		id: 'reply-directly',
		icon: 'reply-directly',
		label: 'Reply_in_direct_message',
		context: ['message', 'message-mobile', 'threads', 'federated'],
		type: 'communication',
		action() {
			roomCoordinator.openRouteLink(
				'd',
				{ name: message.u.username },
				{
					...router.getSearchParameters(),
					reply: message._id,
				},
			);
		},
		order: 0,
		group: 'menu',
		disabled: encrypted || isABACEnabled,
		...(tooltip && { tooltip }),
	};
};
