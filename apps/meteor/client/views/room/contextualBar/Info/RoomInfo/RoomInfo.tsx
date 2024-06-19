import type { IRoom } from '@rocket.chat/core-typings';
import { Box, Callout } from '@rocket.chat/fuselage';
import { RoomAvatar } from '@rocket.chat/ui-avatar';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import {
	ContextualbarHeader,
	ContextualbarScrollableContent,
	ContextualbarBack,
	ContextualbarIcon,
	ContextualbarClose,
	ContextualbarTitle,
} from '../../../../../components/Contextualbar';
import InfoPanel from '../../../../../components/InfoPanel';
import RetentionPolicyCallout from '../../../../../components/InfoPanel/RetentionPolicyCallout';
import MarkdownText from '../../../../../components/MarkdownText';
import { useRetentionPolicy } from '../../../hooks/useRetentionPolicy';
import { useRoomActions } from '../hooks/useRoomActions';
import Actions from './Actions';
import RoomActionsMenu from './RoomActionsMenu';

type RoomInfoProps = {
	room: IRoom;
	icon: string;
	onClickBack?: () => void;
	onClickClose?: () => void;
	onClickEnterRoom?: () => void;
	onClickEdit?: () => void;
	resetState?: () => void;
};

const RoomInfo = ({ room, icon, onClickBack, onClickClose, onClickEnterRoom, onClickEdit, resetState }: RoomInfoProps) => {
	const t = useTranslation();
	const { name, fname, description, topic, archived, broadcast, announcement } = room;
	const roomTitle = fname || name;
	const isDiscussion = 'prid' in room;

	const retentionPolicy = useRetentionPolicy(room);
	const { actions: actionsDefinition, menu: menuActions } = useRoomActions(room, { onClickEnterRoom, onClickEdit, resetState });

	return (
		<>
			<ContextualbarHeader>
				{onClickBack ? <ContextualbarBack onClick={onClickBack} /> : <ContextualbarIcon name='info-circled' />}
				<ContextualbarTitle>{isDiscussion ? t('Discussion_info') : t('Channel_info')}</ContextualbarTitle>
				{onClickClose && <ContextualbarClose onClick={onClickClose} />}
			</ContextualbarHeader>

			<ContextualbarScrollableContent p={24}>
				<InfoPanel>
					<InfoPanel.Section maxWidth='x332' mi='auto'>
						<InfoPanel.Avatar>
							<RoomAvatar size='x332' room={room} />
						</InfoPanel.Avatar>

						<InfoPanel.ActionGroup>
							<Actions actions={actionsDefinition} />
							{menuActions && <RoomActionsMenu actions={menuActions} />}
						</InfoPanel.ActionGroup>
					</InfoPanel.Section>

					{archived && (
						<InfoPanel.Section>
							<Box mb={16}>
								<Callout type='warning'>{t('Room_archived')}</Callout>
							</Box>
						</InfoPanel.Section>
					)}

					{roomTitle && (
						<InfoPanel.Section>
							<InfoPanel.Title title={roomTitle} icon={icon} />
						</InfoPanel.Section>
					)}

					<InfoPanel.Section>
						{broadcast && (
							<InfoPanel.Field>
								<InfoPanel.Label>
									<b>{t('Broadcast_channel')}</b> {t('Broadcast_channel_Description')}
								</InfoPanel.Label>
							</InfoPanel.Field>
						)}

						{description && description !== '' && (
							<InfoPanel.Field>
								<InfoPanel.Label>{t('Description')}</InfoPanel.Label>
								<InfoPanel.Text withTruncatedText={false}>
									<MarkdownText variant='inline' content={description} />
								</InfoPanel.Text>
							</InfoPanel.Field>
						)}

						{announcement && announcement !== '' && (
							<InfoPanel.Field>
								<InfoPanel.Label>{t('Announcement')}</InfoPanel.Label>
								<InfoPanel.Text withTruncatedText={false}>
									<MarkdownText variant='inline' content={announcement} />
								</InfoPanel.Text>
							</InfoPanel.Field>
						)}

						{topic && topic !== '' && (
							<InfoPanel.Field>
								<InfoPanel.Label>{t('Topic')}</InfoPanel.Label>
								<InfoPanel.Text withTruncatedText={false}>
									<MarkdownText variant='inline' content={topic} />
								</InfoPanel.Text>
							</InfoPanel.Field>
						)}

						{retentionPolicy?.isActive && (
							<RetentionPolicyCallout
								filesOnly={retentionPolicy.filesOnly}
								excludePinned={retentionPolicy.excludePinned}
								maxAge={retentionPolicy.maxAge}
							/>
						)}
					</InfoPanel.Section>
				</InfoPanel>
			</ContextualbarScrollableContent>
		</>
	);
};

export default RoomInfo;
