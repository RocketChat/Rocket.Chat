import type { IRoom } from '@rocket.chat/core-typings';
import { Box, Callout, Menu, Option } from '@rocket.chat/fuselage';
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
import InfoPanel from '../../../../../components/InfoPanel';
import RetentionPolicyCallout from '../../../../../components/InfoPanel/RetentionPolicyCallout';
import MarkdownText from '../../../../../components/MarkdownText';
import RoomAvatar from '../../../../../components/avatar/RoomAvatar';
import type { Action } from '../../../../hooks/useActionSpread';
import { useActionSpread } from '../../../../hooks/useActionSpread';
import { useRetentionPolicy } from '../../../body/hooks/useRetentionPolicy';
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
				mi={2}
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
			<InfoPanel.Action key={key} label={label} onClick={action} icon={icon} />
		);

		return [...actionsDefinition.map(mapAction), menu].filter(Boolean);
	}, [actionsDefinition, menu]);

	return (
		<>
			<ContextualbarHeader>
				{onClickBack ? <ContextualbarBack onClick={onClickBack} /> : <ContextualbarIcon name='info-circled' />}
				<ContextualbarTitle>{t('Room_Info')}</ContextualbarTitle>
				{onClickClose && <ContextualbarClose onClick={onClickClose} />}
			</ContextualbarHeader>

			<ContextualbarScrollableContent p={24}>
				<InfoPanel>
					<InfoPanel.Avatar>
						<RoomAvatar size='x332' room={room} />
					</InfoPanel.Avatar>

					<InfoPanel.ActionGroup>{actions}</InfoPanel.ActionGroup>

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

						{retentionPolicy && (
							<RetentionPolicyCallout
								filesOnlyDefault={retentionPolicy.filesOnly}
								excludePinnedDefault={retentionPolicy.excludePinned}
								maxAgeDefault={retentionPolicy.maxAge}
							/>
						)}
					</InfoPanel.Section>
				</InfoPanel>
			</ContextualbarScrollableContent>
		</>
	);
};

export default RoomInfo;
