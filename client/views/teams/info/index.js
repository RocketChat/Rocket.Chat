import React from 'react';
import { Box, Button, Callout } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../contexts/TranslationContext';
import VerticalBar from '../../../components/VerticalBar';
import InfoPanel, { RetentionPolicyCallout } from '../../InfoPanel';
import RoomAvatar from '../../../components/avatar/RoomAvatar';

const TeamsInfo = ({
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
	// onClickHide,
	onClickClose,
	// onClickLeave,
	// onClickEdit,
	// onClickDelete,
}) => {
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
				<InfoPanel flexGrow={1}>

					<InfoPanel.Avatar>
						<RoomAvatar size={'x332'} room={{ _id: rid, type, t: type } } />
					</InfoPanel.Avatar>

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

						<InfoPanel.Field>
							<InfoPanel.Label>{t('Teams_channels')}</InfoPanel.Label>
							<InfoPanel.Text>
								<Button small>{t('View_channels')}</Button>
							</InfoPanel.Text>
						</InfoPanel.Field>

						{retentionPolicyEnabled && (
							<RetentionPolicyCallout filesOnlyDefault={filesOnlyDefault} excludePinnedDefault={excludePinnedDefault} maxAgeDefault={maxAgeDefault} />
						)}
					</InfoPanel.Section>

				</InfoPanel>
			</VerticalBar.ScrollableContent>
		</>
	);
};

export default TeamsInfo;
