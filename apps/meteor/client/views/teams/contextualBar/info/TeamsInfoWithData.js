import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import {
	useSetModal,
	useToastMessageDispatch,
	useRoute,
	useUserId,
	useSetting,
	usePermission,
	useMethod,
	useTranslation,
} from '@rocket.chat/ui-contexts';
import React, { useCallback } from 'react';

import { UiTextContext } from '../../../../../definition/IRoomTypeConfig';
import { GenericModalDoNotAskAgain } from '../../../../components/GenericModal';
import MarkdownText from '../../../../components/MarkdownText';
import { useDontAskAgain } from '../../../../hooks/useDontAskAgain';
import { useEndpointActionExperimental } from '../../../../hooks/useEndpointActionExperimental';
import { roomCoordinator } from '../../../../lib/rooms/roomCoordinator';
import { useTabBarClose, useTabBarOpen } from '../../../room/providers/ToolboxProvider';
import ConvertToChannelModal from '../../ConvertToChannelModal';
import DeleteTeamModal from './Delete';
import LeaveTeamModal from './Leave';
import TeamsInfo from './TeamsInfo';

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

const TeamsInfoWithLogic = ({ room, openEditing }) => {
	const onClickClose = useTabBarClose();
	const openTabbar = useTabBarOpen();
	const t = useTranslation();
	const userId = useUserId();

	room.type = room.t;
	room.rid = room._id;
	const { /* type, fname, */ broadcast, archived /* , joined = true */ } = room; // TODO implement joined

	const retentionPolicyEnabled = useSetting('RetentionPolicy_Enabled');
	const retentionPolicy = {
		retentionPolicyEnabled,
		maxAgeDefault: useSetting(retentionPolicyMaxAge[room.t]) || 30,
		retentionEnabledDefault: useSetting(retentionPolicyAppliesTo[room.t]),
		excludePinnedDefault: useSetting('RetentionPolicy_DoNotPrunePinned'),
		filesOnlyDefault: useSetting('RetentionPolicy_FilesOnly'),
	};

	const dontAskHideRoom = useDontAskAgain('hideRoom');

	const dispatchToastMessage = useToastMessageDispatch();
	const setModal = useSetModal();
	const closeModal = useMutableCallback(() => setModal());

	const deleteTeam = useEndpointActionExperimental('POST', 'teams.delete');
	const leaveTeam = useEndpointActionExperimental('POST', 'teams.leave');
	const convertTeamToChannel = useEndpointActionExperimental('POST', 'teams.convertToChannel');

	const hideTeam = useMethod('hideRoom');

	const router = useRoute('home');

	const canDelete = usePermission('delete-team', room._id);
	const canEdit = usePermission('edit-team-channel', room._id);

	// const canLeave = usePermission('leave-team'); /* && room.cl !== false && joined */

	const onClickDelete = useMutableCallback(() => {
		const onConfirm = async (deletedRooms) => {
			const roomsToRemove = Array.isArray(deletedRooms) && deletedRooms.length > 0 ? deletedRooms : [];

			try {
				await deleteTeam({ teamId: room.teamId, ...(roomsToRemove.length && { roomsToRemove }) });
				dispatchToastMessage({ type: 'success', message: t('Team_has_been_deleted') });
				router.push({});
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				closeModal();
			}
		};

		setModal(<DeleteTeamModal onConfirm={onConfirm} onCancel={closeModal} teamId={room.teamId} />);
	});

	const onClickLeave = useMutableCallback(() => {
		const onConfirm = async (roomsLeft) => {
			const roomsToLeave = Array.isArray(roomsLeft) && roomsLeft.length > 0 ? roomsLeft : [];

			try {
				await leaveTeam({
					teamId: room.teamId,
					...(roomsToLeave.length && { rooms: roomsToLeave }),
				});
				dispatchToastMessage({ type: 'success', message: t('Teams_left_team_successfully') });
				router.push({});
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				closeModal();
			}
		};

		setModal(<LeaveTeamModal onConfirm={onConfirm} onCancel={closeModal} teamId={room.teamId} />);
	});

	const handleHide = useMutableCallback(async () => {
		const hide = async () => {
			try {
				await hideTeam(room._id);
				router.push({});
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				closeModal();
			}
		};

		const warnText = roomCoordinator.getRoomDirectives(room.t)?.getUiText(UiTextContext.HIDE_WARNING);

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
				{t(warnText, room.fname)}
			</GenericModalDoNotAskAgain>,
		);
	});

	const onClickViewChannels = useCallback(() => openTabbar('team-channels'), [openTabbar]);

	const onClickConvertToChannel = useMutableCallback(() => {
		const onConfirm = async (roomsToRemove) => {
			try {
				await convertTeamToChannel({
					teamId: room.teamId,
					roomsToRemove: Object.keys(roomsToRemove),
				});

				dispatchToastMessage({ type: 'success', message: t('Success') });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				closeModal();
			}
		};

		setModal(
			<ConvertToChannelModal onClose={closeModal} onCancel={closeModal} onConfirm={onConfirm} teamId={room.teamId} userId={userId} />,
		);
	});

	return (
		<TeamsInfo
			{...room}
			archived={archived}
			broadcast={broadcast}
			icon={'team'}
			retentionPolicy={retentionPolicyEnabled && retentionPolicy}
			onClickEdit={canEdit && openEditing}
			onClickClose={onClickClose}
			onClickDelete={canDelete && onClickDelete}
			onClickLeave={/* canLeave && */ onClickLeave}
			onClickHide={/* joined && */ handleHide}
			onClickViewChannels={onClickViewChannels}
			onClickConvertToChannel={canEdit && onClickConvertToChannel}
			announcement={room.announcement && <MarkdownText variant='inline' content={room.announcement} />}
			description={room.description && <MarkdownText variant='inline' content={room.description} />}
			topic={room.topic && <MarkdownText variant='inline' content={room.topic} />}
		/>
	);
};

export default TeamsInfoWithLogic;
