import type { IRoom } from '@rocket.chat/core-typings';
import { Box, Button, Callout, IconButton } from '@rocket.chat/fuselage';
import { RoomAvatar } from '@rocket.chat/ui-avatar';
import { GenericMenu } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { useTeamActions } from './useTeamActions';
import {
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarScrollableContent,
} from '../../../../components/Contextualbar';
import {
	InfoPanel,
	InfoPanelAction,
	InfoPanelActionGroup,
	InfoPanelAvatar,
	InfoPanelField,
	InfoPanelLabel,
	InfoPanelSection,
	InfoPanelText,
	InfoPanelTitle,
} from '../../../../components/InfoPanel';
import RetentionPolicyCallout from '../../../../components/InfoPanel/RetentionPolicyCallout';
import MarkdownText from '../../../../components/MarkdownText';
import { useSplitRoomActions } from '../../../room/contextualBar/Info/hooks/useSplitRoomActions';
import { useRetentionPolicy } from '../../../room/hooks/useRetentionPolicy';

type TeamsInfoProps = {
	room: IRoom;
	onClickEdit?: () => void;
	onClickClose?: () => void;
	onClickViewChannels: () => void;
};

const TeamsInfo = ({ room, onClickClose, onClickEdit, onClickViewChannels }: TeamsInfoProps): ReactElement => {
	const { t } = useTranslation();

	const retentionPolicy = useRetentionPolicy(room);
	const memoizedActions = useTeamActions(room, { onClickEdit });

	const { buttons: actions, menu } = useSplitRoomActions(memoizedActions);

	return (
		<>
			<ContextualbarHeader>
				<ContextualbarIcon name='info-circled' />
				<ContextualbarTitle>{t('Teams_Info')}</ContextualbarTitle>
				{onClickClose && <ContextualbarClose onClick={onClickClose} />}
			</ContextualbarHeader>
			<ContextualbarScrollableContent p={24}>
				<InfoPanel>
					<InfoPanelSection maxWidth='x332' mi='auto'>
						<InfoPanelAvatar>
							<RoomAvatar size='x332' room={room} />
						</InfoPanelAvatar>

						<InfoPanelActionGroup>
							{actions.items.map(({ id, content, icon, onClick }) => (
								<InfoPanelAction key={id} label={content} onClick={onClick} icon={icon} />
							))}
							{menu && (
								<GenericMenu
									title={t('More')}
									placement='bottom-end'
									detached
									button={<IconButton icon='kebab' secondary flexShrink={0} flexGrow={0} maxHeight='initial' />}
									sections={menu}
								/>
							)}
						</InfoPanelActionGroup>
					</InfoPanelSection>

					<InfoPanelSection>
						{room.archived && (
							<Box mb={16}>
								<Callout type='warning'>{t('Room_archived')}</Callout>
							</Box>
						)}
					</InfoPanelSection>

					<InfoPanelSection>
						<InfoPanelTitle title={room.fname || room.name || ''} icon='team' />
					</InfoPanelSection>

					<InfoPanelSection>
						{room.broadcast && (
							<InfoPanelField>
								<InfoPanelLabel>
									<b>{t('Broadcast_channel')}</b> {t('Broadcast_channel_Description')}
								</InfoPanelLabel>
							</InfoPanelField>
						)}

						{room.description && (
							<InfoPanelField>
								<InfoPanelLabel>{t('Description')}</InfoPanelLabel>
								<InfoPanelText withTruncatedText={false}>
									<MarkdownText variant='inline' content={room.description} />
								</InfoPanelText>
							</InfoPanelField>
						)}

						{room.announcement && (
							<InfoPanelField>
								<InfoPanelLabel>{t('Announcement')}</InfoPanelLabel>
								<InfoPanelText withTruncatedText={false}>
									<MarkdownText variant='inline' content={room.announcement} />
								</InfoPanelText>
							</InfoPanelField>
						)}

						{room.topic && (
							<InfoPanelField>
								<InfoPanelLabel>{t('Topic')}</InfoPanelLabel>
								<InfoPanelText withTruncatedText={false}>
									<MarkdownText variant='inline' content={room.topic} />
								</InfoPanelText>
							</InfoPanelField>
						)}

						{onClickViewChannels && (
							<InfoPanelField>
								<InfoPanelLabel>{t('Teams_channels')}</InfoPanelLabel>
								<InfoPanelText>
									<Button onClick={onClickViewChannels} small>
										{t('View_channels')}
									</Button>
								</InfoPanelText>
							</InfoPanelField>
						)}

						{retentionPolicy?.isActive && <RetentionPolicyCallout room={room} />}
					</InfoPanelSection>
				</InfoPanel>
			</ContextualbarScrollableContent>
		</>
	);
};

export default TeamsInfo;
