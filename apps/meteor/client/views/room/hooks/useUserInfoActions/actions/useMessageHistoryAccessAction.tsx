import type { IRoom, ISubscription, IUser, Serialized } from '@rocket.chat/core-typings';
import { GenericModal } from '@rocket.chat/ui-client';
import { useEndpoint, useSetModal, useToastMessageDispatch, useUserRoom } from '@rocket.chat/ui-contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { roomsQueryKeys } from '../../../../../lib/queryKeys';
import { useCanManageMessageHistory } from '../../useCanManageMessageHistory';
import type { UserInfoAction } from '../useUserInfoActions';

/**
 * Hides a member's earlier messages, or shows them again.
 * `historyVisibleFrom` is the member's cutoff: `null` when they see the full history, `undefined` when it isn't known here.
 */
export const useMessageHistoryAccessAction = (
	user: Pick<IUser, '_id' | 'username'>,
	rid: IRoom['_id'],
	historyVisibleFrom: Serialized<ISubscription>['historyVisibleFrom'] | null | undefined,
): UserInfoAction | undefined => {
	const { t } = useTranslation();
	const room = useUserRoom(rid);
	const canManage = useCanManageMessageHistory(rid);
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const queryClient = useQueryClient();
	const setMemberHistoryAccess = useEndpoint('POST', '/v1/rooms.setMemberHistoryAccess');

	const { mutate } = useMutation({
		mutationFn: (restricted: boolean) => setMemberHistoryAccess({ roomId: rid, userId: user._id, restricted }),
		onSuccess: (_, restricted) => {
			dispatchToastMessage({
				type: 'success',
				message: t(restricted ? 'Earlier_messages_hidden_from_user' : 'Earlier_messages_restored_for_user', {
					username: user.username,
				}),
			});
			if (room) {
				void queryClient.invalidateQueries({ queryKey: roomsQueryKeys.members(room._id, room.t) });
			}
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
		onSettled: () => {
			setModal(null);
		},
	});

	return useMemo(() => {
		if (!canManage || historyVisibleFrom === undefined) {
			return undefined;
		}

		const isRestricted = historyVisibleFrom !== null;

		const onClick = () => {
			if (isRestricted) {
				mutate(false);
				return;
			}

			setModal(
				<GenericModal
					variant='warning'
					title={t('Hide_earlier_messages')}
					confirmText={t('Hide_earlier_messages')}
					onClose={() => setModal(null)}
					onCancel={() => setModal(null)}
					onConfirm={() => mutate(true)}
				>
					{t('Hide_earlier_messages_confirmation', { username: user.username })}
				</GenericModal>,
			);
		};

		return {
			content: t(isRestricted ? 'Show_earlier_messages' : 'Hide_earlier_messages'),
			icon: isRestricted ? ('eye' as const) : ('eye-off' as const),
			onClick,
			type: 'management' as const,
		};
	}, [canManage, historyVisibleFrom, mutate, setModal, t, user.username]);
};
