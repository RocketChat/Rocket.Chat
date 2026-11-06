import { ToggleSwitch } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { GenericModal } from '@rocket.chat/ui-client';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useEndpoint, useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export const ARCHIVED_ROOMS_NOTIFICATIONS_ITEM_ID = 'notifications';

/** How many rooms are changed at once; a long list goes in batches rather than as a burst of requests. */
const BATCH_SIZE = 5;

type UseArchivedRoomsNotificationsItemOptions = {
	/** The archived rooms. */
	rooms: SubscriptionWithRoom[];
	/** Called as the item opens its modal, so the owner can close the menu. */
	onOpen?: () => void;
};

/**
 * The notifications of the whole archive: "Turn off" while any archived room still sends notifications, which
 * silences every one of them; once all are off, "Turn on" wakes them all. The item says what it does next, which
 * is also how a screen reader learns the state; the switch beside it only pictures that state, so it is kept out of
 * the accessibility tree and the tab order. It says how many rooms it is about to change first, and is disabled
 * while nothing is archived.
 */
export const useArchivedRoomsNotificationsItem = ({ rooms, onOpen }: UseArchivedRoomsNotificationsItemOptions): GenericMenuItemProps => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const closeModal = useStableCallback(() => setModal());
	const dispatchToastMessage = useToastMessageDispatch();
	const saveNotification = useEndpoint('POST', '/v1/rooms.saveNotification');

	// Turning on is offered only once every room is off; with a mix, turning off finishes the job.
	const enabled = rooms.some((room) => !room.disableNotifications);
	const targets = useMemo(() => (enabled ? rooms.filter((room) => !room.disableNotifications) : rooms), [enabled, rooms]);

	const apply = useStableCallback(async () => {
		const disableNotifications = enabled ? '1' : '0';
		let changed = 0;
		let failed = 0;
		for (let start = 0; start < targets.length; start += BATCH_SIZE) {
			const outcomes = await Promise.allSettled(
				targets
					.slice(start, start + BATCH_SIZE)
					.map((room) => saveNotification({ roomId: room.rid, notifications: { disableNotifications } })),
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
			dispatchToastMessage({
				type: 'success',
				message: t(enabled ? 'Rooms_notifications_off' : 'Rooms_notifications_on', { count: changed }),
			});
		}
		if (failed) {
			dispatchToastMessage({
				type: 'error',
				message: t(enabled ? 'Rooms_notifications_still_on' : 'Rooms_notifications_still_off', { count: failed }),
			});
		}
	});

	const handleClick = useStableCallback(() => {
		onOpen?.();

		setModal(
			<GenericModal
				icon={null}
				title={t(enabled ? 'Turn_off_notifications' : 'Turn_on_notifications')}
				confirmText={t(enabled ? 'Turn_OFF' : 'Turn_ON')}
				onCancel={closeModal}
				onConfirm={() => {
					closeModal();
					void apply();
				}}
			>
				{t(enabled ? 'Archived_rooms_notifications_off_description' : 'Archived_rooms_notifications_on_description', {
					count: targets.length,
				})}
			</GenericModal>,
		);
	});

	return useMemo(
		() => ({
			id: ARCHIVED_ROOMS_NOTIFICATIONS_ITEM_ID,
			icon: 'bell',
			content: t(enabled ? 'Turn_OFF' : 'Turn_ON'),
			textValue: t(enabled ? 'Turn_OFF' : 'Turn_ON'),
			disabled: targets.length === 0,
			onClick: handleClick,
			addon: <ToggleSwitch disabled={targets.length === 0} checked={enabled} aria-hidden tabIndex={-1} onChange={() => undefined} />,
		}),
		[t, enabled, targets.length, handleClick],
	);
};
