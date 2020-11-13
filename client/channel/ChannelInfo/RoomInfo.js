import React from 'react';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import RoomInfo from '../../components/basic/RoomInfo';
import { useTranslation } from '../../contexts/TranslationContext';
// import { useSession } from '../../contexts/SessionContext';
import { useUserSubscription } from '../../contexts/UserContext';
import { useMethod } from '../../contexts/ServerContext';
import DeleteChannelWarning from '../../components/DeleteChannelWarning';
import { useSetModal } from '../../contexts/ModalContext';
import { useRoute } from '../../contexts/RouterContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { roomTypes, UiTextContext } from '../../../app/utils';
import { RoomManager } from '../../../app/ui-utils/client/lib/RoomManager';
import { usePermission } from '../../contexts/AuthorizationContext';
import WarningModal from '../../admin/apps/WarningModal';

export default (props) => {
	const t = useTranslation();

	const { openEditing, rid } = props;
	// const rid = useSession('openedRoom');
	const room = useUserSubscription(rid);
	room.type = room.t;
	const { type, name } = room;

	const dispatchToastMessage = useToastMessageDispatch();
	const setModal = useSetModal();
	const closeModal = useMutableCallback(() => setModal());
	const deleteRoom = useMethod('eraseRoom');
	const hideRoom = useMethod('hideRoom');
	const leaveRoom = useMethod('leaveRoom');
	const router = useRoute('home');

	const canDelete = usePermission(`delete-${ room.t }`);
	// const canLeaveChannel = usePermission('leave-c');
	// const canLeavePrivate = usePermission('leave-p');

	// const canLeave = (() => {
	// 	if (type === 'c' && !canLeaveChannel) { return false; }
	// 	if (type === 'p' && !canLeavePrivate) { return false; }
	// 	return !(((cl != null) && !cl) || ['d', 'l'].includes(type));
	// })();

	const handleDelete = useMutableCallback(() => {
		const onCancel = () => setModal(undefined);
		const onConfirm = async () => {
			try {
				await deleteRoom(rid);
				router.push({});
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
			onCancel();
		};

		setModal(<DeleteChannelWarning onConfirm={onConfirm} onCancel={onCancel} />);
	});

	const handleLeave = useMutableCallback(() => {
		const leave = async () => {
			try {
				await leaveRoom(rid);
				router.push({});
				RoomManager.close(rid);
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
			closeModal();
		};

		const warnText = roomTypes.getConfig(type).getUiText(UiTextContext.LEAVE_WARNING);

		setModal(<WarningModal
			text={t(warnText, name)}
			confirmText={t('Leave_room')}
			close={closeModal}
			cancel={closeModal}
			cancelText={t('Cancel')}
			confirm={leave}
		/>);
	});

	const handleHide = useMutableCallback(async () => {
		const hide = async () => {
			try {
				await hideRoom(rid);
				router.push({});
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
			closeModal();
		};

		const warnText = roomTypes.getConfig(type).getUiText(UiTextContext.HIDE_WARNING);

		setModal(<WarningModal
			text={t(warnText, name)}
			confirmText={t('Yes_hide_it')}
			close={closeModal}
			cancel={closeModal}
			cancelText={t('Cancel')}
			confirm={hide}
		/>);
	});

	return (
		<RoomInfo
			archived={room.archived}
			icon={room.t === 'p' ? 'lock' : 'hashtag'}
			onClickEdit={openEditing}
			onClickDelete={canDelete && handleDelete}
			onClickLeave={handleLeave}
			onClickHide={handleHide}
			{...room}
		/>
	);
};
