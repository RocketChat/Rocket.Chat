import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React from 'react';

import { RoomManager } from '../../../../../../app/ui-utils/client/lib/RoomManager';
import { roomTypes, UiTextContext } from '../../../../../../app/utils';
import DeleteChannelWarning from '../../../../../components/DeleteChannelWarning';
import MarkdownText from '../../../../../components/MarkdownText';
import { usePermission } from '../../../../../contexts/AuthorizationContext';
import { useSetModal } from '../../../../../contexts/ModalContext';
import { useRoute } from '../../../../../contexts/RouterContext';
import { useMethod } from '../../../../../contexts/ServerContext';
import { useSetting } from '../../../../../contexts/SettingsContext';
import { useToastMessageDispatch } from '../../../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../../../contexts/TranslationContext';
import { useUserRoom } from '../../../../../contexts/UserContext';
import { useEndpointActionExperimental } from '../../../../../hooks/useEndpointAction';
import WarningModal from '../../../../admin/apps/WarningModal';
import ChannelToTeamModal from '../../../../teams/modals/ChannelToTeamModal/ChannelToTeamModal';
import ConvertToTeamModal from '../../../../teams/modals/ConvertToTeamModal';
import { useTabBarClose } from '../../../providers/ToolboxProvider';
import RoomInfo from './RoomInfo';

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

const RoomInfoWithData = ({ rid, openEditing, onClickBack, onEnterRoom }) => {
	const onClickClose = useTabBarClose();
	const t = useTranslation();

	const room = useUserRoom(rid);
	room.type = room.t;
	room.rid = rid;
	const { type, fname, broadcast, archived, joined = true } = room; // TODO implement joined

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

	const moveChannelToTeam = useEndpointActionExperimental('POST', 'teams.addRoom', t('Success'));
	const convertRoomToTeam = useEndpointActionExperimental(
		'POST',
		type === 'c' ? 'channels.convertToTeam' : 'groups.convertToTeam',
		t('Success'),
	);

	const canDelete = usePermission(type === 'c' ? 'delete-c' : 'delete-p', rid);

	const canEdit = usePermission('edit-room', rid);

	const canConvertRoomToTeam = usePermission('create-team');

	const canLeave =
		usePermission(type === 'c' ? 'leave-c' : 'leave-p') && room.cl !== false && joined;

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

		setModal(
			<WarningModal
				text={t(warnText, fname)}
				confirmText={t('Leave_room')}
				close={closeModal}
				cancel={closeModal}
				cancelText={t('Cancel')}
				confirm={leave}
			/>,
		);
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

		setModal(
			<WarningModal
				text={t(warnText, fname)}
				confirmText={t('Yes_hide_it')}
				close={closeModal}
				cancel={closeModal}
				cancelText={t('Cancel')}
				confirm={hide}
			/>,
		);
	});

	const onMoveToTeam = useMutableCallback(async () => {
		const onConfirm = async (teamId) => {
			try {
				await moveChannelToTeam({ roomId: rid, teamId });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				closeModal();
			}
		};

		setModal(
			<ChannelToTeamModal
				rid={rid}
				onClose={closeModal}
				onCancel={closeModal}
				onConfirm={onConfirm}
			/>,
		);
	});

	const onConvertToTeam = useMutableCallback(async () => {
		const data = type === 'c' ? { channelId: rid } : { roomId: rid };
		const onConfirm = async () => {
			try {
				await convertRoomToTeam(data);
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				closeModal();
			}
		};

		setModal(<ConvertToTeamModal onClose={closeModal} onConfirm={onConfirm} />);
	});

	const onClickEnterRoom = useMutableCallback(() => onEnterRoom(room));

	return (
		<RoomInfo
			archived={archived}
			broadcast={broadcast}
			icon={room.t === 'p' ? 'lock' : 'hashtag'}
			retentionPolicy={retentionPolicyEnabled && retentionPolicy}
			onClickBack={onClickBack}
			onClickEdit={canEdit && openEditing}
			onClickClose={onClickClose}
			onClickDelete={canDelete && handleDelete}
			onClickLeave={canLeave && handleLeave}
			onClickHide={joined && handleHide}
			onClickMoveToTeam={!room.teamId && onMoveToTeam}
			onClickConvertToTeam={!room.teamId && canConvertRoomToTeam && onConvertToTeam}
			onClickEnterRoom={onEnterRoom && onClickEnterRoom}
			{...room}
			announcement={room.announcement && <MarkdownText content={room.announcement} />}
			description={room.description && <MarkdownText content={room.description} />}
			topic={room.topic && <MarkdownText content={room.topic} />}
		/>
	);
};

export default RoomInfoWithData;
