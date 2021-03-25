import React, { useMemo } from 'react';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { Box, Callout, Menu, Option } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../../../contexts/TranslationContext';
import VerticalBar from '../../../../../components/VerticalBar';
import { useUserRoom } from '../../../../../contexts/UserContext';
import { useMethod } from '../../../../../contexts/ServerContext';
import DeleteChannelWarning from '../../../../../components/DeleteChannelWarning';
import { useSetModal } from '../../../../../contexts/ModalContext';
import { useSetting } from '../../../../../contexts/SettingsContext';
import { useRoute } from '../../../../../contexts/RouterContext';
import { useToastMessageDispatch } from '../../../../../contexts/ToastMessagesContext';
import { roomTypes, UiTextContext } from '../../../../../../app/utils';
import { RoomManager } from '../../../../../../app/ui-utils/client/lib/RoomManager';
import { usePermission } from '../../../../../contexts/AuthorizationContext';
import WarningModal from '../../../../admin/apps/WarningModal';
import MarkdownText from '../../../../../components/MarkdownText';
import ChannelToTeamModal from '../../../../teams/modals/ChannelToTeamModal/ChannelToTeamModal';
import ConvertToTeamModal from '../../../../teams/modals/ConvertToTeamModal';
import { useTabBarClose } from '../../../providers/ToolboxProvider';
import { useEndpointActionExperimental } from '../../../../../hooks/useEndpointAction';
import InfoPanel, { RetentionPolicyCallout } from '../../../../InfoPanel';
import RoomAvatar from '../../../../../components/avatar/RoomAvatar';
import { useActionSpread } from '../../../../hooks/useActionSpread';


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

export const RoomInfo = function RoomInfo({
	name,
	fname,
	description,
	archived,
	broadcast,
	announcement,
	topic,
	type,
	rid,
	icon,
	retentionPolicy = {},
	onClickBack,
	onClickHide,
	onClickClose,
	onClickLeave,
	onClickEdit,
	onClickDelete,
	onClickMoveToTeam,
	onClickConvertToTeam,
	onClickEnterRoom,
}) {
	const t = useTranslation();

	const {
		retentionPolicyEnabled,
		filesOnlyDefault,
		excludePinnedDefault,
		maxAgeDefault,
	} = retentionPolicy;

	const memoizedActions = useMemo(() => ({
		...onClickEnterRoom && { enter: {
			label: t('Enter'),
			icon: 'login',
			action: onClickEnterRoom,
		} },
		...onClickEdit && { edit: {
			label: t('Edit'),
			icon: 'edit',
			action: onClickEdit,
		} },
		...onClickDelete && { delete: {
			label: t('Delete'),
			icon: 'trash',
			action: onClickDelete,
		} },
		...onClickMoveToTeam && { move: {
			label: t('Teams_move_channel_to_team'),
			icon: 'team',
			action: onClickMoveToTeam,
		} },
		...onClickConvertToTeam && { convert: {
			label: t('Teams_convert_channel_to_team'),
			icon: 'team',
			action: onClickConvertToTeam,
		} },
		...onClickHide && { hide: {
			label: t('Hide'),
			action: onClickHide,
			icon: 'eye-off',
		} },
		...onClickLeave && { leave: {
			label: t('Leave'),
			action: onClickLeave,
			icon: 'sign-out',
		} },
	}), [onClickEdit, t, onClickDelete, onClickMoveToTeam, onClickConvertToTeam, onClickHide, onClickLeave, onClickEnterRoom]);

	const { actions: actionsDefinition, menu: menuOptions } = useActionSpread(memoizedActions);

	const menu = useMemo(() => {
		if (!menuOptions) {
			return null;
		}

		return <Menu
			small={false}
			flexShrink={0}
			mi='x2'
			key='menu'
			ghost={false}
			renderItem={({ label: { label, icon }, ...props }) => <Option {...props} label={label} icon={icon} />}
			options={menuOptions}
		/>;
	}, [menuOptions]);

	const actions = useMemo(() => {
		const mapAction = ([key, { label, icon, action }]) =>
			<InfoPanel.Action key={key} label={label} onClick={action} icon={icon}/>;

		return [...actionsDefinition.map(mapAction), menu].filter(Boolean);
	}, [actionsDefinition, menu]);

	return (
		<>
			<VerticalBar.Header>
				{onClickBack ? <VerticalBar.Back onClick={onClickBack} /> : <VerticalBar.Icon name='info-circled'/>}
				<VerticalBar.Text>{t('Room_Info')}</VerticalBar.Text>
				{ onClickClose && <VerticalBar.Close onClick={onClickClose} /> }
			</VerticalBar.Header>

			<VerticalBar.ScrollableContent p='x24'>
				<InfoPanel flexGrow={1}>

					<InfoPanel.Avatar>
						<RoomAvatar size={'x332'} room={{ _id: rid, type, t: type } } />
					</InfoPanel.Avatar>

					<InfoPanel.ActionGroup>
						{actions}
					</InfoPanel.ActionGroup>

					<InfoPanel.Section>
						{ archived && <Box mb='x16'>
							<Callout type='warning'>
								{t('Room_archived')}
							</Callout>
						</Box>}
					</InfoPanel.Section>

					<InfoPanel.Section>
						<InfoPanel.Title title={fname || name} icon={icon} />
					</InfoPanel.Section>

					<InfoPanel.Section>
						{broadcast && broadcast !== '' && <InfoPanel.Field>
							<InfoPanel.Label><b>{t('Broadcast_channel')}</b> {t('Broadcast_channel_Description')}</InfoPanel.Label>
						</InfoPanel.Field>}

						{description && description !== '' && <InfoPanel.Field>
							<InfoPanel.Label>{t('Description')}</InfoPanel.Label>
							<InfoPanel.Text withTruncatedText={false}>{description}</InfoPanel.Text>
						</InfoPanel.Field>}

						{announcement && announcement !== '' && <InfoPanel.Field>
							<InfoPanel.Label>{t('Announcement')}</InfoPanel.Label>
							<InfoPanel.Text withTruncatedText={false}>{announcement}</InfoPanel.Text>
						</InfoPanel.Field>}

						{topic && topic !== '' && <InfoPanel.Field>
							<InfoPanel.Label>{t('Topic')}</InfoPanel.Label>
							<InfoPanel.Text withTruncatedText={false}>{topic}</InfoPanel.Text>
						</InfoPanel.Field>}

						{retentionPolicyEnabled && (
							<RetentionPolicyCallout filesOnlyDefault={filesOnlyDefault} excludePinnedDefault={excludePinnedDefault} maxAgeDefault={maxAgeDefault} />
						)}
					</InfoPanel.Section>

				</InfoPanel>
			</VerticalBar.ScrollableContent>
		</>
	);
};

export default ({
	rid,
	openEditing,
	onClickBack,
	onEnterRoom,
}) => {
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
			text={t(warnText, fname)}
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
			text={t(warnText, fname)}
			confirmText={t('Yes_hide_it')}
			close={closeModal}
			cancel={closeModal}
			cancelText={t('Cancel')}
			confirm={hide}
		/>);
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

		setModal(<ChannelToTeamModal
			rid={rid}
			onClose={closeModal}
			onCancel={closeModal}
			onConfirm={onConfirm}
		/>);
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

		setModal(<ConvertToTeamModal
			onClose={closeModal}
			onConfirm={onConfirm}
		/>);
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
			announcement={room.announcement && <MarkdownText content={room.announcement}/>}
			description={room.description && <MarkdownText content={room.description}/>}
			topic={room.topic && <MarkdownText content={room.topic}/>}
		/>
	);
};
