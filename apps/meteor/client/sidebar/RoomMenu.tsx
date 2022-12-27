import type { RoomType } from '@rocket.chat/core-typings';
import { Option, Menu } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey, Fields } from '@rocket.chat/ui-contexts';
import {
	useSetModal,
	useToastMessageDispatch,
	useRoute,
	useUserSubscription,
	useSetting,
	usePermission,
	useMethod,
	useTranslation,
	useEndpoint,
} from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { memo, useMemo } from 'react';

import { RoomManager } from '../../app/ui-utils/client';
import { UiTextContext } from '../../definition/IRoomTypeConfig';
import { GenericModalDoNotAskAgain } from '../components/GenericModal';
import WarningModal from '../components/WarningModal';
import { useDontAskAgain } from '../hooks/useDontAskAgain';
import { roomCoordinator } from '../lib/rooms/roomCoordinator';

const fields: Fields = {
	f: true,
	t: true,
	name: true,
};

type RoomMenuProps = {
	rid: string;
	unread?: boolean;
	threadUnread?: boolean;
	alert?: boolean;
	roomOpen?: boolean;
	type: RoomType;
	cl?: boolean;
	name?: string;
};

const closeEndpoints = {
	p: '/v1/groups.close',
	c: '/v1/channels.close',
	d: '/v1/im.close',

	v: '/v1/channels.close',
	l: '/v1/groups.close',
} as const;

const leaveEndpoints = {
	p: '/v1/groups.leave',
	c: '/v1/channels.leave',
	d: '/v1/im.leave',

	v: '/v1/channels.leave',
	l: '/v1/groups.leave',
} as const;

const RoomMenu = ({ rid, unread, threadUnread, alert, roomOpen, type, cl, name = '' }: RoomMenuProps): ReactElement => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const setModal = useSetModal();

	const closeModal = useMutableCallback(() => setModal());

	const router = useRoute('home');

	const subscription = useUserSubscription(rid, fields);
	const canFavorite = useSetting('Favorite_Rooms');
	const isFavorite = Boolean(subscription?.f);

	const dontAskHideRoom = useDontAskAgain('hideRoom');

	const hideRoom = useEndpoint('POST', closeEndpoints[type]);
	const readMessages = useEndpoint('POST', '/v1/subscriptions.read');
	const toggleFavorite = useEndpoint('POST', '/v1/rooms.favorite');
	const leaveRoom = useEndpoint('POST', leaveEndpoints[type]);

	const unreadMessages = useMethod('unreadMessages');

	const isUnread = alert || unread || threadUnread;

	const canLeaveChannel = usePermission('leave-c');
	const canLeavePrivate = usePermission('leave-p');

	const canLeave = ((): boolean => {
		if (type === 'c' && !canLeaveChannel) {
			return false;
		}
		if (type === 'p' && !canLeavePrivate) {
			return false;
		}
		return !((cl != null && !cl) || ['d', 'l'].includes(type));
	})();

	const handleLeave = useMutableCallback(() => {
		const leave = async (): Promise<void> => {
			try {
				await leaveRoom({ roomId: rid });
				if (roomOpen) {
					router.push({});
				}
				RoomManager.close(rid);
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
			closeModal();
		};

		const warnText = roomCoordinator.getRoomDirectives(type)?.getUiText(UiTextContext.LEAVE_WARNING);

		setModal(
			<WarningModal
				text={t(warnText as TranslationKey, name)}
				confirmText={t('Leave_room')}
				close={closeModal}
				cancel={closeModal}
				cancelText={t('Cancel')}
				confirm={leave}
			/>,
		);
	});

	const handleHide = useMutableCallback(async () => {
		const hide = async (): Promise<void> => {
			try {
				await hideRoom({ roomId: rid });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
			closeModal();
		};

		const warnText = roomCoordinator.getRoomDirectives(type)?.getUiText(UiTextContext.HIDE_WARNING);

		if (dontAskHideRoom) {
			return hide();
		}

		setModal(
			<GenericModalDoNotAskAgain
				variant='danger'
				confirmText={t('Yes_hide_it')}
				cancelText={t('Cancel')}
				onClose={closeModal}
				onCancel={closeModal}
				onConfirm={hide}
				dontAskAgain={{
					action: 'hideRoom',
					label: t('Hide_room'),
				}}
			>
				{t(warnText as TranslationKey, name)}
			</GenericModalDoNotAskAgain>,
		);
	});

	const handleToggleRead = useMutableCallback(async () => {
		try {
			if (isUnread) {
				await readMessages({ rid, readThreads: true });
				return;
			}
			await unreadMessages(null, rid);
			if (subscription == null) {
				return;
			}
			RoomManager.close(subscription.t + subscription.name);

			router.push({});
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const handleToggleFavorite = useMutableCallback(async () => {
		try {
			await toggleFavorite({ roomId: rid, favorite: !isFavorite });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const menuOptions = useMemo(
		() => ({
			hideRoom: {
				label: { label: t('Hide'), icon: 'eye-off' },
				action: handleHide,
			},
			toggleRead: {
				label: { label: isUnread ? t('Mark_read') : t('Mark_unread'), icon: 'flag' },
				action: handleToggleRead,
			},
			...(canFavorite
				? {
						toggleFavorite: {
							label: {
								label: isFavorite ? t('Unfavorite') : t('Favorite'),
								icon: isFavorite ? 'star-filled' : 'star',
							},
							action: handleToggleFavorite,
						},
				  }
				: {}),
			...(canLeave && {
				leaveRoom: {
					label: { label: t('Leave_room'), icon: 'sign-out' },
					action: handleLeave,
				},
			}),
		}),
		[t, handleHide, isUnread, handleToggleRead, canFavorite, isFavorite, handleToggleFavorite, canLeave, handleLeave],
	);

	return (
		<Menu
			rcx-sidebar-item__menu
			title={t('Options')}
			mini
			aria-keyshortcuts='alt'
			tabIndex={-1}
			options={menuOptions}
			renderItem={({ label: { label, icon }, ...props }): JSX.Element => <Option label={label} icon={icon} {...props} />}
		/>
	);
};

export default memo(RoomMenu);
