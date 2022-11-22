import { isRoomFederated } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import {
	useSetModal,
	useToastMessageDispatch,
	useRoute,
	useUserRoom,
	useSetting,
	usePermission,
	useEndpoint,
	useMethod,
	useTranslation,
	useUser,
} from '@rocket.chat/ui-contexts';
import React from 'react';

import { RoomManager } from '../../../../../../app/ui-utils/client';
import { UiTextContext } from '../../../../../../definition/IRoomTypeConfig';
import GenericModal from '../../../../../components/GenericModal';
import WarningModal from '../../../../../components/WarningModal';
import { useEndpointActionExperimental } from '../../../../../hooks/useEndpointActionExperimental';
import * as Federation from '../../../../../lib/federation/Federation';
import { roomCoordinator } from '../../../../../lib/rooms/roomCoordinator';
import { useTabBarClose } from '../../../contexts/ToolboxContext';
import ChannelToTeamModal from '../ChannelToTeamModal/ChannelToTeamModal';
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

const RoomInfoWithData = ({ rid, openEditing, onClickBack, onEnterRoom, resetState }) => {
	const onClickClose = useTabBarClose();
	const t = useTranslation();
	const user = useUser();

	const room = useUserRoom(rid);
	room.type = room.t;
	room.rid = rid;

	const { type, fname, name, prid, joined = true } = room; // TODO implement joined

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
	const deleteRoom = useEndpoint('POST', room.t === 'c' ? '/v1/channels.delete' : '/v1/groups.delete');
	const hideRoom = useMethod('hideRoom');
	const leaveRoom = useMethod('leaveRoom');
	const router = useRoute('home');

	const moveChannelToTeam = useEndpointActionExperimental('POST', '/v1/teams.addRooms', t('Rooms_added_successfully'));
	const convertRoomToTeam = useEndpointActionExperimental(
		'POST',
		type === 'c' ? '/v1/channels.convertToTeam' : '/v1/groups.convertToTeam',
		t('Success'),
	);

	const isFederated = isRoomFederated(room);
	const hasPermissionToDelete = usePermission(type === 'c' ? 'delete-c' : 'delete-p', rid);
	const hasPermissionToEdit = usePermission('edit-room', rid);
	const hasPermissionToConvertRoomToTeam = usePermission('create-team');
	const canDelete = isFederated ? Federation.isEditableByTheUser(user, room) && hasPermissionToDelete : hasPermissionToDelete;
	const canEdit = isFederated ? Federation.isEditableByTheUser(user, room) && hasPermissionToEdit : hasPermissionToEdit;
	const canConvertRoomToTeam = isFederated ? false : hasPermissionToConvertRoomToTeam;
	const canLeave = usePermission(type === 'c' ? 'leave-c' : 'leave-p') && room.cl !== false && joined;

	const handleDelete = useMutableCallback(() => {
		const onConfirm = async () => {
			try {
				resetState && resetState({});
				await deleteRoom({ roomId: rid });
				dispatchToastMessage({ type: 'success', message: t('Room_has_been_deleted') });
				!resetState && router.push({});
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
			closeModal();
		};

		setModal(
			<GenericModal variant='danger' onConfirm={onConfirm} onCancel={closeModal} confirmText={t('Yes_delete_it')}>
				{t('Delete_Room_Warning')}
			</GenericModal>,
		);
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

		const warnText = roomCoordinator.getRoomDirectives(type)?.getUiText(UiTextContext.LEAVE_WARNING);

		setModal(
			<WarningModal
				text={t(warnText, fname || name)}
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

		const warnText = roomCoordinator.getRoomDirectives(type)?.getUiText(UiTextContext.HIDE_WARNING);

		setModal(
			<WarningModal
				text={t(warnText, fname || name)}
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
				await moveChannelToTeam({ rooms: [rid], teamId });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				closeModal();
			}
		};

		setModal(<ChannelToTeamModal rid={rid} onClose={closeModal} onCancel={closeModal} onConfirm={onConfirm} />);
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

		setModal(
			<GenericModal
				title={t('Confirmation')}
				variant='warning'
				onClose={closeModal}
				onCancel={closeModal}
				onConfirm={onConfirm}
				confirmText={t('Convert')}
			>
				{t('Converting_channel_to_a_team')}
			</GenericModal>,
		);
	});

	const onClickEnterRoom = useMutableCallback(() => onEnterRoom(room));
	const allowConvertToTeam = !room.teamId && !prid && canConvertRoomToTeam && canEdit;

	return (
		<RoomInfo
			room={room}
			icon={room.t === 'p' ? 'lock' : 'hashtag'}
			retentionPolicy={retentionPolicyEnabled && retentionPolicy}
			onClickBack={onClickBack}
			onClickEdit={canEdit && openEditing}
			onClickClose={onClickClose}
			onClickDelete={canDelete && handleDelete}
			onClickLeave={canLeave && handleLeave}
			onClickHide={joined && handleHide}
			onClickMoveToTeam={!isRoomFederated(room) && !room.teamId && !prid && canEdit && onMoveToTeam}
			onClickConvertToTeam={allowConvertToTeam && onConvertToTeam}
			onClickEnterRoom={onEnterRoom && onClickEnterRoom}
		/>
	);
};

export default RoomInfoWithData;
