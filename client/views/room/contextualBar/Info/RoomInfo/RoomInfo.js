import React from 'react';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { Box, Icon, Button, ButtonGroup, Divider, Callout } from '@rocket.chat/fuselage';
import { css } from '@rocket.chat/css-in-js';

import RoomAvatar from '../../../../../components/avatar/RoomAvatar';
import { useTranslation } from '../../../../../contexts/TranslationContext';
import UserCard from '../../../../../components/UserCard';
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
import { useTabBarClose } from '../../../providers/ToolboxProvider';

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

const wordBreak = css`
	word-break: break-word !important;
`;

const Label = (props) => <Box fontScale='p2' color='default' {...props} />;
const Info = ({ className, ...props }) => <UserCard.Info className={[className, wordBreak]} flexShrink={0} {...props}/>;

export const RoomInfoIcon = ({ name }) => <Icon name={name} size='x22' />;

export const Title = (props) => <UserCard.Username {...props}/>;

export const RoomInfo = function RoomInfo({
	name,
	description,
	archived,
	broadcast,
	announcement,
	topic,
	type,
	rid,
	icon,
	retentionPolicy = {},
	onClickHide,
	onClickClose,
	onClickLeave,
	onClickEdit,
	onClickDelete,
}) {
	const t = useTranslation();

	const {
		retentionPolicyEnabled,
		filesOnlyDefault,
		excludePinnedDefault,
		maxAgeDefault,
	} = retentionPolicy;

	return (
		<>
			<VerticalBar.Header>
				<VerticalBar.Icon name='info-circled'/>
				<VerticalBar.Text>{t('Room_Info')}</VerticalBar.Text>
				{ onClickClose && <VerticalBar.Close onClick={onClickClose} /> }
			</VerticalBar.Header>

			<VerticalBar.ScrollableContent p='x24'>
				<Box flexGrow={1}>
					<Box pbe='x24' display='flex' justifyContent='center'>
						<RoomAvatar size={'x332'} room={{ _id: rid, type, t: type } } />
					</Box>

					{ archived && <Box pbe='x24'>
						<Callout type='warning'>
							{t('Room_archived')}
						</Callout>
					</Box>}

					<Box pbe='x24'>
						<RoomInfo.Title name={name} status={<RoomInfo.Icon name={icon} />}>{name}</RoomInfo.Title>
					</Box>

					{broadcast && broadcast !== '' && <Box pbe='x16'>
						<Label><b>{t('Broadcast_channel')}</b> {t('Broadcast_channel_Description')}</Label>
					</Box>}

					{description && description !== '' && <Box pbe='x16'>
						<Label>{t('Description')}</Label>
						<Info withTruncatedText={false}>{description}</Info>
					</Box>}

					{announcement && announcement !== '' && <Box pbe='x16'>
						<Label>{t('Announcement')}</Label>
						<Info withTruncatedText={false}>{announcement}</Info>
					</Box>}

					{topic && topic !== '' && <Box pbe='x16'>
						<Label>{t('Topic')}</Label>
						<Info withTruncatedText={false}>{topic}</Info>
					</Box>}

					{retentionPolicyEnabled && (
						<Callout type='warning'>
							{filesOnlyDefault && excludePinnedDefault && <p>{t('RetentionPolicy_RoomWarning_FilesOnly', { time: maxAgeDefault })}</p>}
							{filesOnlyDefault && !excludePinnedDefault && <p>{t('RetentionPolicy_RoomWarning_UnpinnedFilesOnly', { time: maxAgeDefault })}</p>}
							{!filesOnlyDefault && excludePinnedDefault && <p>{t('RetentionPolicy_RoomWarning', { time: maxAgeDefault })}</p>}
							{!filesOnlyDefault && !excludePinnedDefault && <p>{t('RetentionPolicy_RoomWarning_Unpinned', { time: maxAgeDefault })}</p>}
						</Callout>
					)}
				</Box>
			</VerticalBar.ScrollableContent>
			<VerticalBar.Footer>
				<ButtonGroup stretch>
					{ onClickHide && <Button width='50%' onClick={onClickHide}><Box is='span' mie='x4'><Icon name='eye-off' size='x20' /></Box>{t('Hide')}</Button> }
					{ onClickLeave && <Button width='50%' onClick={onClickLeave} danger><Box is='span' mie='x4'><Icon name='sign-out' size='x20' /></Box>{t('Leave')}</Button> }
				</ButtonGroup>
				{ (onClickEdit || onClickDelete) && <>
					<Divider />
					<ButtonGroup stretch>
						{ onClickEdit && <Button width='50%' onClick={onClickEdit}><Box is='span' mie='x4'><Icon name='edit' size='x20' /></Box>{t('Edit')}</Button> }
						{ onClickDelete && <Button width='50%' onClick={onClickDelete} danger><Box is='span' mie='x4'><Icon name='trash' size='x20' /></Box>{t('Delete')}</Button>}
					</ButtonGroup>
				</>}
			</VerticalBar.Footer>
		</>
	);
};

RoomInfo.Title = Title;
RoomInfo.Icon = RoomInfoIcon;

export default ({
	rid,
	openEditing,
}) => {
	const onClickClose = useTabBarClose();
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
