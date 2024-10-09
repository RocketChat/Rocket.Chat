import type { IRoom } from '@rocket.chat/core-typings';
import { Box, Button, Callout, Option, Menu } from '@rocket.chat/fuselage';
import { RoomAvatar } from '@rocket.chat/ui-avatar';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useMemo } from 'react';

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
import type { Action } from '../../../hooks/useActionSpread';
import { useActionSpread } from '../../../hooks/useActionSpread';
import { useRetentionPolicy } from '../../../room/hooks/useRetentionPolicy';

type TeamsInfoProps = {
	room: IRoom;
	onClickHide: () => void;
	onClickClose: () => void;
	onClickLeave: () => void;
	onClickEdit: () => void;
	onClickDelete: () => void;
	onClickViewChannels: () => void;
	onClickConvertToChannel?: () => void;
};

const TeamsInfo = ({
	room,
	onClickHide,
	onClickClose,
	onClickLeave,
	onClickEdit,
	onClickDelete,
	onClickViewChannels,
	onClickConvertToChannel,
}: TeamsInfoProps): ReactElement => {
	const t = useTranslation();

	const retentionPolicy = useRetentionPolicy(room);

	const memoizedActions = useMemo(
		() => ({
			...(onClickEdit && {
				edit: {
					label: t('Edit'),
					action: onClickEdit,
					icon: 'edit' as const,
				},
			}),
			...(onClickDelete && {
				delete: {
					label: t('Delete'),
					action: onClickDelete,
					icon: 'trash' as const,
				},
			}),
			...(onClickConvertToChannel && {
				convertToChannel: {
					label: t('Convert_to_channel'),
					action: onClickConvertToChannel,
					icon: 'hash' as const,
				},
			}),
			...(onClickHide && {
				hide: {
					label: t('Hide'),
					action: onClickHide,
					icon: 'eye-off' as const,
				},
			}),
			...(onClickLeave && {
				leave: {
					label: t('Leave'),
					action: onClickLeave,
					icon: 'sign-out' as const,
				},
			}),
		}),
		[t, onClickHide, onClickLeave, onClickEdit, onClickDelete, onClickConvertToChannel],
	);

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
				title={t('More')}
				secondary
				renderItem={({ label: { label, icon }, ...props }): ReactElement => <Option {...props} label={label} icon={icon} />}
				options={menuOptions}
			/>
		);
	}, [t, menuOptions]);

	const actions = useMemo(() => {
		const mapAction = ([key, { label, icon, action }]: [string, Action]): ReactElement => (
			<InfoPanelAction key={key} label={label as string} onClick={action} icon={icon} />
		);

		return [...actionsDefinition.map(mapAction), menu].filter(Boolean);
	}, [actionsDefinition, menu]);

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

						<InfoPanelActionGroup>{actions}</InfoPanelActionGroup>
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
