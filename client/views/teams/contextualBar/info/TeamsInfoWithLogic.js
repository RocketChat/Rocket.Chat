import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useCallback } from 'react';

import { roomTypes, UiTextContext } from '../../../../../app/utils/client';
import { GenericModalDoNotAskAgain } from '../../../../components/GenericModal';
import MarkdownText from '../../../../components/MarkdownText';
import { usePermission } from '../../../../contexts/AuthorizationContext';
import { useSetModal } from '../../../../contexts/ModalContext';
import { useRoute } from '../../../../contexts/RouterContext';
import { useMethod } from '../../../../contexts/ServerContext';
import { useSetting } from '../../../../contexts/SettingsContext';
import { useToastMessageDispatch } from '../../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../../contexts/TranslationContext';
import { useDontAskAgain } from '../../../../hooks/useDontAskAgain';
import { useEndpointActionExperimental } from '../../../../hooks/useEndpointAction';
import { useTabBarClose, useTabBarOpen } from '../../../room/providers/ToolboxProvider';
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

function TeamsInfoWithLogic({ room, openEditing }) {
	const onClickClose = useTabBarClose();
	const openTabbar = useTabBarOpen();
	const t = useTranslation();

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
	const hideTeam = useMethod('hideRoom');

	const router = useRoute('home');

	const canDelete = usePermission('delete-team', room._id);
	const canEdit = usePermission('edit-team-channel', room._id);

	// const canLeave = usePermission('leave-team'); /* && room.cl !== false && joined */

	const onClickDelete = useMutableCallback(() => {
		const onConfirm = async (deletedRooms) => {
			const roomsToRemove =
				Array.isArray(deletedRooms) && deletedRooms.length > 0 ? deletedRooms : null;
			try {
				await deleteTeam({ teamId: room.teamId, roomsToRemove });
				router.push({});
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
			closeModal();
		};

		setModal(<DeleteTeamModal onConfirm={onConfirm} onCancel={closeModal} teamId={room.teamId} />);
	});

	const onClickLeave = useMutableCallback(() => {
		const onConfirm = async (roomsLeft) => {
			const rooms = Array.isArray(roomsLeft) && roomsLeft.length > 0 ? roomsLeft : null;

			try {
				await leaveTeam({ teamId: room.teamId, rooms });
				dispatchToastMessage({ type: 'success', message: t('Teams_left_team_successfully') });
				router.push({});
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
			closeModal();
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
			}
			closeModal();
		};

		const warnText = roomTypes.getConfig(room.t).getUiText(UiTextContext.HIDE_WARNING);

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

	return (
		<TeamsInfo
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
			{...room}
			announcement={
				room.announcement && <MarkdownText variant='inline' content={room.announcement} />
			}
			description={room.description && <MarkdownText variant='inline' content={room.description} />}
			topic={room.topic && <MarkdownText variant='inline' content={room.topic} />}
		/>
	);
}

export default TeamsInfoWithLogic;
