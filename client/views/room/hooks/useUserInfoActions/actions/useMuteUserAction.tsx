import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { escapeHTML } from '@rocket.chat/string-helpers';
import React, { useMemo } from 'react';

import { IRoom } from '../../../../../../definition/IRoom';
import { IUser } from '../../../../../../definition/IUser';
import { useAllPermissions, usePermission } from '../../../../../contexts/AuthorizationContext';
import { useSetModal } from '../../../../../contexts/ModalContext';
import { useMethod } from '../../../../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../../../contexts/TranslationContext';
import { roomCoordinator } from '../../../../../lib/rooms/roomCoordinator';
import { Action } from '../../../../hooks/useActionSpread';
import { getRoomDirectives } from '../../../lib/getRoomDirectives';
import WarningModal from '../../../modals/WarningModal';

// TODO: add types
const getUserIsMuted = (room: IRoom, user: Pick<IUser, '_id' | 'username'>, userCanPostReadonly: boolean): boolean => {
	if (room?.ro) {
		if (Array.isArray(room.unmuted) && room.unmuted.indexOf(user?.username) !== -1) {
			return false;
		}

		if (userCanPostReadonly) {
			return Array.isArray(room.muted) && room.muted.indexOf(user?.username) !== -1;
		}

		return true;
	}

	return room && Array.isArray(room.muted) && room.muted.indexOf(user?.username) > -1;
};

// TODO: add return type
// TODO: replace Warning Modal to Generic Modal
export const useMuteUserAction = (room: IRoom, user: Pick<IUser, '_id' | 'username'>): Action => {
	const t = useTranslation();
	const rid = room._id;
	const userCanMute = usePermission('mute-user', rid);
	const dispatchToastMessage = useToastMessageDispatch();
	const setModal = useSetModal();
	const closeModal = useMutableCallback(() => setModal(null));

	const otherUserCanPostReadonly = useAllPermissions('post-readonly', rid);
	const isMuted = getUserIsMuted(room, user, otherUserCanPostReadonly);
	const roomName = room?.t && escapeHTML(roomCoordinator.getRoomName(room.t, room));
	const [roomCanMute] = getRoomDirectives(room);

	const mutedMessage = isMuted ? 'User__username__unmuted_in_room__roomName__' : 'User__username__muted_in_room__roomName__';

	const muteUser = useMethod(isMuted ? 'unmuteUserInRoom' : 'muteUserInRoom');
	const muteUserOption = useMemo(() => {
		const action = (): void => {
			const onConfirm = async (): Promise<void> => {
				try {
					await muteUser({ rid, username: user.username });

					return dispatchToastMessage({
						type: 'success',
						message: t(mutedMessage, {
							username: user.username,
							roomName,
						}),
					});
				} catch (error) {
					dispatchToastMessage({ type: 'error', message: error });
				} finally {
					closeModal();
				}
			};

			if (isMuted) {
				return onConfirm();
			}

			setModal(
				<WarningModal
					text={t('The_user_wont_be_able_to_type_in_s', roomName)}
					close={closeModal}
					confirmText={t('Yes_mute_user')}
					confirm={onConfirm}
				/>,
			);
		};

		return (
			roomCanMute &&
			userCanMute && {
				label: t(isMuted ? 'Unmute_user' : 'Mute_user'),
				icon: isMuted ? 'mic' : 'mic-off',
				action,
			}
		);
	}, [
		closeModal,
		mutedMessage,
		dispatchToastMessage,
		isMuted,
		muteUser,
		rid,
		roomCanMute,
		roomName,
		setModal,
		t,
		user.username,
		userCanMute,
	]);

	return muteUserOption;
};
