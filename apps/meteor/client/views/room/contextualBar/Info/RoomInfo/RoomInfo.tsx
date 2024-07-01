import type { IRoom } from '@rocket.chat/core-typings';
import { Box, Callout, Menu, Option } from '@rocket.chat/fuselage';
import { RoomAvatar } from '@rocket.chat/ui-avatar';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';

import {
	ContextualbarHeader,
	ContextualbarScrollableContent,
	ContextualbarBack,
	ContextualbarIcon,
	ContextualbarClose,
	ContextualbarTitle,
} from '../../../../../components/Contextualbar';
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
} from '../../../../../components/InfoPanel';
import RetentionPolicyCallout from '../../../../../components/InfoPanel/RetentionPolicyCallout';
import MarkdownText from '../../../../../components/MarkdownText';
import type { Action } from '../../../../hooks/useActionSpread';
import { useActionSpread } from '../../../../hooks/useActionSpread';
import { useRetentionPolicy } from '../../../hooks/useRetentionPolicy';
import { useRoomActions } from '../hooks/useRoomActions';

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
	const memoizedActions = useRoomActions(room, { onClickEnterRoom, onClickEdit }, resetState);
	const { actions: actionsDefinition, menu: menuOptions } = useActionSpread(memoizedActions);

	const menu = useMemo(() => {
		if (!menuOptions) {
			return null;
		}

		return (
			<Menu
				small={false}
				flexShrink={0}
				flexGrow={0}
				key='menu'
				maxHeight='initial'
				secondary
				renderItem={({ label: { label, icon }, ...props }) => <Option {...props} label={label} icon={icon} />}
				options={menuOptions}
			/>
		);
	}, [menuOptions]);

	const actions = useMemo(() => {
		const mapAction = ([key, { label, icon, action }]: [string, Action]) => (
			<InfoPanelAction key={key} label={label} onClick={action} icon={icon} />
		);

		return [...actionsDefinition.map(mapAction), menu].filter(Boolean);
	}, [actionsDefinition, menu]);

	return (
		<>
			<ContextualbarHeader>
				{onClickBack ? <ContextualbarBack onClick={onClickBack} /> : <ContextualbarIcon name='info-circled' />}
				<ContextualbarTitle>{isDiscussion ? t('Discussion_info') : t('Channel_info')}</ContextualbarTitle>
				{onClickClose && <ContextualbarClose onClick={onClickClose} />}
			</ContextualbarHeader>

			<ContextualbarScrollableContent p={24}>
				<InfoPanel>
					<InfoPanelSection maxWidth='x332' mi='auto'>
						<InfoPanelAvatar>
							<RoomAvatar size='x332' room={room} />
						</InfoPanelAvatar>

						<InfoPanelActionGroup>{actions}</InfoPanelActionGroup>
					</InfoPanelSection>

					{archived && (
						<InfoPanelSection>
							<Box mb={16}>
								<Callout type='warning'>{t('Room_archived')}</Callout>
							</Box>
						</InfoPanelSection>
					)}

					{roomTitle && (
						<InfoPanelSection>
							<InfoPanelTitle title={roomTitle} icon={icon} />
						</InfoPanelSection>
					)}

					<InfoPanelSection>
						{broadcast && (
							<InfoPanelField>
								<InfoPanelLabel>
									<b>{t('Broadcast_channel')}</b> {t('Broadcast_channel_Description')}
								</InfoPanelLabel>
							</InfoPanelField>
						)}

						{description && description !== '' && (
							<InfoPanelField>
								<InfoPanelLabel>{t('Description')}</InfoPanelLabel>
								<InfoPanelText withTruncatedText={false}>
									<MarkdownText variant='inline' content={description} />
								</InfoPanelText>
							</InfoPanelField>
						)}

						{announcement && announcement !== '' && (
							<InfoPanelField>
								<InfoPanelLabel>{t('Announcement')}</InfoPanelLabel>
								<InfoPanelText withTruncatedText={false}>
									<MarkdownText variant='inline' content={announcement} />
								</InfoPanelText>
							</InfoPanelField>
						)}

						{topic && topic !== '' && (
							<InfoPanelField>
								<InfoPanelLabel>{t('Topic')}</InfoPanelLabel>
								<InfoPanelText withTruncatedText={false}>
									<MarkdownText variant='inline' content={topic} />
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

export default RoomInfo;
