import React from 'react';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import RoomInfo from '../../../../components/RoomInfo/RoomInfo';
import { useTranslation } from '../../../../contexts/TranslationContext';
import { useUserRoom } from '../../../../contexts/UserContext';
import { useMethod } from '../../../../contexts/ServerContext';
import DeleteChannelWarning from '../../../../components/DeleteChannelWarning';
import { useSetModal } from '../../../../contexts/ModalContext';
import { useSetting } from '../../../../contexts/SettingsContext';
import { useRoute } from '../../../../contexts/RouterContext';
import { useToastMessageDispatch } from '../../../../contexts/ToastMessagesContext';
import { roomTypes, UiTextContext } from '../../../../../app/utils';
import { RoomManager } from '../../../../../app/ui-utils/client/lib/RoomManager';
import { usePermission } from '../../../../contexts/AuthorizationContext';
import WarningModal from '../../../admin/apps/WarningModal';
import MarkdownText from '../../../../components/MarkdownText';

const retentionPolicyMaxAge = {
	c: 'RetentionPolicy_MaxAge_Channels',
	p: 'RetentionPolicy_MaxAge_Groups',
	d: 'RetentionPolicy_MaxAge_DMs',
};

const retentionPolicyAppliesTo = {
	c: 'RetentionPolicy_AppliesToChannels',
	p: 'RetentionPolicy_AppliesToGroups',
	d: 'RetentionPolicy_AppliesToDMs',
};

export default ({
	openEditing,
	rid,
	tabBar,
}) => {
	const onClickClose = useMutableCallback(() => tabBar && tabBar.close());
	const t = useTranslation();

	const room = useUserRoom(rid);
	room.type = room.t;
	room.rid = rid;
	const { type, name, broadcast, archived, joined = true } = room; // TODO implement joined

	const retentionPolicyEnabled = useSetting('RetentionPolicy_Enabled');
	const retentionPolicy = {
		retentionPolicyEnabled,
		maxAgeDefault: useSetting(retentionPolicyMaxAge[room.t]) || 30,
		retentionEnabledDefault: useSetting(retentionPolicyAppliesTo[room.t]),
		excludePinnedDefault: useSetting('RetentionPolicy_DoNotPrunePinned'),
		filesOnlyDefault: useSetting('RetentionPolicy_FilesOnly'),
	};

	const dispatchToastMessage = useToastMessageDispatch();
	const setModal = useSetModal();
	const closeModal = useMutableCallback(() => setModal());
	const deleteRoom = useMethod('eraseRoom');
	const hideRoom = useMethod('hideRoom');
	const leaveRoom = useMethod('leaveRoom');
	const router = useRoute('home');

	const canDelete = usePermission(type === 'c' ? 'delete-c' : 'delete-p', rid);

	const canEdit = usePermission('edit-room', rid);

	const canLeave = usePermission(type === 'c' ? 'leave-c' : 'leave-p') && room.cl !== false && joined;

	const handleDelete = useMutableCallback(() => {
		const onConfirm = async () => {
			try {
				await deleteRoom(rid);
				router.push({});
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
			closeModal();
		};

		setModal(<DeleteChannelWarning onConfirm={onConfirm} onCancel={closeModal} />);
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
			archived={archived}
			broadcast={broadcast}
			icon={room.t === 'p' ? 'lock' : 'hashtag'}
			retentionPolicy={retentionPolicyEnabled && retentionPolicy}
			onClickEdit={canEdit && openEditing}
			onClickClose={onClickClose}
			onClickDelete={canDelete && handleDelete}
			onClickLeave={canLeave && handleLeave}
			onClickHide={joined && handleHide}
			{...room}
			announcement={room.announcement && <MarkdownText content={room.announcement}/>}
			description={room.description && <MarkdownText content={room.description}/>}
			topic={room.topic && <MarkdownText content={room.topic}/>}
		/>
	);
};
