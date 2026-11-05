import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { GenericModalDoNotAskAgain, useDontAskAgain } from '@rocket.chat/ui-client';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useEndpoint, useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { isUnreadRoom } from '../../lib/unreadRooms';

export const MARK_GROUP_READ_ITEM_ID = 'mark-group-read';

/** How many rooms are read at once; a long list goes in batches rather than as a burst of requests. */
const BATCH_SIZE = 5;

type UseMarkGroupReadItemOptions = {
	/** The group as its header names it, for the modal. */
	groupTitle: string;
	/** Every room of the group, the ones the collapse or the filter leaves out included. */
	rooms: SubscriptionWithRoom[];
	/** Called as the item opens its modal, so the owner can close the menu. */
	onOpen?: () => void;
};

/**
 * The menu item that marks every unread room of a group as read, threads included, after saying how many
 * rooms that is, unless the user asked not to be told again. Disabled while the group has nothing unread.
 */
export const useMarkGroupReadItem = ({ groupTitle, rooms, onOpen }: UseMarkGroupReadItemOptions): GenericMenuItemProps => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const closeModal = useStableCallback(() => setModal());
	const dispatchToastMessage = useToastMessageDispatch();
	const queryClient = useQueryClient();
	const dontAskMarkGroupRead = useDontAskAgain('markGroupRead');
	const readMessages = useEndpoint('POST', '/v1/subscriptions.read');

	const unreadRooms = useMemo(() => rooms.filter(isUnreadRoom), [rooms]);

	const markRead = useStableCallback(async () => {
		let read = 0;
		let failed = 0;
		for (let start = 0; start < unreadRooms.length; start += BATCH_SIZE) {
			const outcomes = await Promise.allSettled(
				unreadRooms.slice(start, start + BATCH_SIZE).map((room) => readMessages({ rid: room.rid, readThreads: true })),
			);
			for (const outcome of outcomes) {
				if (outcome.status === 'fulfilled') {
					read += 1;
				} else {
					failed += 1;
				}
			}
		}

		queryClient.invalidateQueries({ queryKey: ['sidebar/search/spotlight'] });

		if (read) {
			dispatchToastMessage({ type: 'success', message: t('Rooms_marked_read', { count: read }) });
		}
		if (failed) {
			dispatchToastMessage({ type: 'error', message: t('Rooms_not_marked_read', { count: failed }) });
		}
	});

	const handleClick = useStableCallback(() => {
		onOpen?.();

		if (dontAskMarkGroupRead) {
			void markRead();
			return;
		}

		setModal(
			<GenericModalDoNotAskAgain
				icon={null}
				title={t('Mark_rooms_as_read')}
				confirmText={t('Mark_read')}
				cancelText={t('Cancel')}
				onClose={closeModal}
				onCancel={closeModal}
				onConfirm={() => {
					closeModal();
					void markRead();
				}}
				dontAskAgain={{
					action: 'markGroupRead',
					label: t('Mark_rooms_as_read'),
				}}
			>
				{t('Unread_rooms_in_group_become_read', { count: unreadRooms.length, group: groupTitle })}
			</GenericModalDoNotAskAgain>,
		);
	});

	return useMemo(
		() => ({
			id: MARK_GROUP_READ_ITEM_ID,
			icon: 'flag',
			content: t('Mark_read'),
			disabled: unreadRooms.length === 0,
			onClick: handleClick,
		}),
		[t, unreadRooms.length, handleClick],
	);
};
