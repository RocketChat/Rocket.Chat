import React from 'react';
import { Box, Margins, Icon, Button, ButtonGroup, Divider, Callout } from '@rocket.chat/fuselage';
import { css } from '@rocket.chat/css-in-js';

import RoomAvatar from './avatar/RoomAvatar';
import { useTranslation } from '../../contexts/TranslationContext';
import UserCard from './UserCard';
import VerticalBar from './VerticalBar';

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
	retentionPolicy,
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

	const retentionIcon = <Icon name='warning' />;

	return (
		<>
			<VerticalBar.Header>
				<VerticalBar.Icon name='info-circled'/>
				<VerticalBar.Text>{t('Room_Info')}</VerticalBar.Text>
				<VerticalBar.Close onClick={onClickClose} />
			</VerticalBar.Header>

			<VerticalBar.ScrollableContent p='x24'>
				<Margins block='x4'>
					<Box pbe='x24'>
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

					{broadcast && broadcast !== '' && <Box pbe='x16'>
						<Label><b>{t('Broadcast_channel')}</b> {t('Broadcast_channel_Description')}</Label>
					</Box>}

					{retentionPolicyEnabled && (
						<Box pbe='x16'>
							{filesOnlyDefault && excludePinnedDefault && <Label>{retentionIcon} {t('RetentionPolicy_RoomWarning_FilesOnly', { max: maxAgeDefault })}</Label>}

							{filesOnlyDefault && !excludePinnedDefault && <Label>{retentionIcon} {t('RetentionPolicy_RoomWarning_UnpinnedFilesOnly', { max: maxAgeDefault })}</Label>}

							{!filesOnlyDefault && excludePinnedDefault && <Label>{retentionIcon} {t('RetentionPolicy_RoomWarning', { max: maxAgeDefault })}</Label>}

							{!filesOnlyDefault && !excludePinnedDefault && <Label>{retentionIcon} {t('RetentionPolicy_RoomWarning_Unpinned', { max: maxAgeDefault })}</Label>}
						</Box>
					)}
				</Margins>
			</VerticalBar.ScrollableContent>
			<VerticalBar.Footer>
				<ButtonGroup stretch>
					{ onClickHide && <Button width='50%' onClick={onClickHide}><Box is='span' mie='x4'><Icon name='eye-off' size='x20' /></Box>{t('Hide')}</Button> }
					{ onClickLeave && <Button width='50%' onClick={onClickLeave} danger><Box is='span' mie='x4'><Icon name='sign-out' size='x20' /></Box>{t('Leave')}</Button> }
				</ButtonGroup>
				{ (onClickEdit || onClickDelete) && <Divider /> }
				<ButtonGroup stretch>
					{ onClickEdit && <Button width='50%' onClick={onClickEdit}><Box is='span' mie='x4'><Icon name='edit' size='x20' /></Box>{t('Edit')}</Button> }
					{ onClickDelete && <Button width='50%' onClick={onClickDelete} danger><Box is='span' mie='x4'><Icon name='trash' size='x20' /></Box>{t('Delete')}</Button>}
				</ButtonGroup>
			</VerticalBar.Footer>
		</>
	);
};

RoomInfo.Title = Title;
RoomInfo.Icon = RoomInfoIcon;

export default React.memo(RoomInfo);
