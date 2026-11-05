import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { GenericModal } from '@rocket.chat/ui-client';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useEndpoint, useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export const MUTE_ARCHIVED_ROOMS_ITEM_ID = 'mute-archived-rooms';

/** How many rooms are changed at once; a long list goes in batches rather than as a burst of requests. */
const BATCH_SIZE = 5;

/** Muted here means both: no notifications, and no unread status for the badges and the counters. */
const isMutedRoom = (room: SubscriptionWithRoom): boolean => Boolean(room.disableNotifications && room.hideUnreadStatus);

type UseMuteArchivedRoomsItemOptions = {
	/** The archived rooms. */
	rooms: SubscriptionWithRoom[];
	/** Called as the item opens its modal, so the owner can close the menu. */
	onOpen?: () => void;
};

/**
 * The item that mutes every archived room, or unmutes them all once every one is muted: notifications off and
 * unread status hidden, so an archived room never asks for attention anywhere, not even in the tab title. It says
 * how many rooms it is about to change first, and is disabled while nothing is archived.
 */
export const useMuteArchivedRoomsItem = ({ rooms, onOpen }: UseMuteArchivedRoomsItemOptions): GenericMenuItemProps => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const closeModal = useStableCallback(() => setModal());
	const dispatchToastMessage = useToastMessageDispatch();
	const saveNotification = useEndpoint('POST', '/v1/rooms.saveNotification');

	// Unmuting is offered only once every room is muted; with a mix, muting finishes the job.
	const muted = rooms.length > 0 && rooms.every(isMutedRoom);
	const targets = useMemo(() => (muted ? rooms : rooms.filter((room) => !isMutedRoom(room))), [muted, rooms]);

	const apply = useStableCallback(async () => {
		const value = muted ? '0' : '1';
		let changed = 0;
		let failed = 0;
		for (let start = 0; start < targets.length; start += BATCH_SIZE) {
			const outcomes = await Promise.allSettled(
				targets
					.slice(start, start + BATCH_SIZE)
					.map((room) => saveNotification({ roomId: room.rid, notifications: { disableNotifications: value, hideUnreadStatus: value } })),
			);
			for (const outcome of outcomes) {
				if (outcome.status === 'fulfilled') {
					changed += 1;
				} else {
					failed += 1;
				}
			}
		}

		if (changed) {
			dispatchToastMessage({ type: 'success', message: t(muted ? 'Rooms_unmuted' : 'Rooms_muted', { count: changed }) });
		}
		if (failed) {
			dispatchToastMessage({ type: 'error', message: t(muted ? 'Rooms_not_unmuted' : 'Rooms_not_muted', { count: failed }) });
		}
	});

	const handleClick = useStableCallback(() => {
		onOpen?.();

		setModal(
			<GenericModal
				icon={null}
				title={t(muted ? 'Unmute_archived_rooms' : 'Mute_archived_rooms')}
				confirmText={t(muted ? 'Unmute' : 'Mute')}
				onCancel={closeModal}
				onConfirm={() => {
					closeModal();
					void apply();
				}}
			>
				{t(muted ? 'Archived_rooms_unmuted_description' : 'Archived_rooms_muted_description', { count: targets.length })}
			</GenericModal>,
		);
	});

	return useMemo(
		() => ({
			id: MUTE_ARCHIVED_ROOMS_ITEM_ID,
			icon: muted ? 'bell' : 'bell-off',
			content: t(muted ? 'Unmute' : 'Mute'),
			disabled: targets.length === 0,
			onClick: handleClick,
		}),
		[t, muted, targets.length, handleClick],
	);
};
