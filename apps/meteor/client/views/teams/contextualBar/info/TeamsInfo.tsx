import type { IRoom } from '@rocket.chat/core-typings';
import type { Icon } from '@rocket.chat/fuselage';
import { Box, Button, Callout, Option, Menu } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement, ComponentProps } from 'react';
import React, { useMemo } from 'react';

import InfoPanel from '../../../../components/InfoPanel';
import RetentionPolicyCallout from '../../../../components/InfoPanel/RetentionPolicyCallout';
import MarkdownText from '../../../../components/MarkdownText';
import VerticalBar from '../../../../components/VerticalBar';
import RoomAvatar from '../../../../components/avatar/RoomAvatar';
import type { Action } from '../../../hooks/useActionSpread';
import { useActionSpread } from '../../../hooks/useActionSpread';

type RetentionPolicy = {
	retentionPolicyEnabled: boolean;
	maxAgeDefault: number;
	retentionEnabledDefault: boolean;
	excludePinnedDefault: boolean;
	filesOnlyDefault: boolean;
};

type TeamsInfoProps = {
	room: IRoom;
	retentionPolicy: RetentionPolicy;
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
	retentionPolicy,
	onClickHide,
	onClickClose,
	onClickLeave,
	onClickEdit,
	onClickDelete,
	onClickViewChannels,
	onClickConvertToChannel,
}: TeamsInfoProps): ReactElement => {
	const t = useTranslation();

	const { retentionPolicyEnabled, filesOnlyDefault, excludePinnedDefault, maxAgeDefault } = retentionPolicy;

	const memoizedActions = useMemo(
		() => ({
			...(onClickEdit && {
				edit: {
					label: t('Edit'),
					icon: 'edit',
					action: onClickEdit,
				},
			}),
			...(onClickDelete && {
				delete: {
					label: t('Delete'),
					icon: 'trash',
					action: onClickDelete,
				},
			}),
			...(onClickConvertToChannel && {
				convertToChannel: {
					label: t('Convert_to_channel'),
					action: onClickConvertToChannel,
					icon: 'hash',
				},
			}),
			...(onClickHide && {
				hide: {
					label: t('Hide'),
					action: onClickHide,
					icon: 'eye-off',
				},
			}),
			...(onClickLeave && {
				leave: {
					label: t('Leave'),
					action: onClickLeave,
					icon: 'sign-out',
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
				mi='x2'
				key='menu'
				maxHeight='initial'
				secondary
				renderItem={({ label: { label, icon }, ...props }): ReactElement => <Option {...props} label={label} icon={icon} />}
				options={menuOptions}
			/>
		);
	}, [menuOptions]);

	const actions = useMemo(() => {
		const mapAction = ([key, { label, icon, action }]: [string, Action]): ReactElement => (
			<InfoPanel.Action key={key} label={label as string} onClick={action} icon={icon as ComponentProps<typeof Icon>['name']} />
		);

		return [...actionsDefinition.map(mapAction), menu].filter(Boolean);
	}, [actionsDefinition, menu]);

	return (
		<>
			<VerticalBar.Header>
				<VerticalBar.Icon name='info-circled' />
				<VerticalBar.Text>{t('Teams_Info')}</VerticalBar.Text>
				{onClickClose && <VerticalBar.Close onClick={onClickClose} />}
			</VerticalBar.Header>

			<VerticalBar.ScrollableContent p='x24'>
				<InfoPanel>
					<InfoPanel.Avatar>
						<RoomAvatar size={'x332'} room={room} />
					</InfoPanel.Avatar>

					<InfoPanel.ActionGroup>{actions}</InfoPanel.ActionGroup>

					<InfoPanel.Section>
						{room.archived && (
							<Box mb='x16'>
								<Callout type='warning'>{t('Room_archived')}</Callout>
							</Box>
						)}
					</InfoPanel.Section>

					<InfoPanel.Section>
						<InfoPanel.Title title={room.fname || room.name || ''} icon={'team'} />
					</InfoPanel.Section>

					<InfoPanel.Section>
						{room.broadcast && (
							<InfoPanel.Field>
								<InfoPanel.Label>
									<b>{t('Broadcast_channel')}</b> {t('Broadcast_channel_Description')}
								</InfoPanel.Label>
							</InfoPanel.Field>
						)}

						{room.description && (
							<InfoPanel.Field>
								<InfoPanel.Label>{t('Description')}</InfoPanel.Label>
								<InfoPanel.Text withTruncatedText={false}>{<MarkdownText variant='inline' content={room.description} />}</InfoPanel.Text>
							</InfoPanel.Field>
						)}

						{room.announcement && (
							<InfoPanel.Field>
								<InfoPanel.Label>{t('Announcement')}</InfoPanel.Label>
								<InfoPanel.Text withTruncatedText={false}>{<MarkdownText variant='inline' content={room.announcement} />}</InfoPanel.Text>
							</InfoPanel.Field>
						)}

						{room.topic && (
							<InfoPanel.Field>
								<InfoPanel.Label>{t('Topic')}</InfoPanel.Label>
								<InfoPanel.Text withTruncatedText={false}>{<MarkdownText variant='inline' content={room.topic} />}</InfoPanel.Text>
							</InfoPanel.Field>
						)}

						{onClickViewChannels && (
							<InfoPanel.Field>
								<InfoPanel.Label>{t('Teams_channels')}</InfoPanel.Label>
								<InfoPanel.Text>
									<Button onClick={onClickViewChannels} small>
										{t('View_channels')}
									</Button>
								</InfoPanel.Text>
							</InfoPanel.Field>
						)}

						{retentionPolicyEnabled && (
							<RetentionPolicyCallout
								filesOnlyDefault={filesOnlyDefault}
								excludePinnedDefault={excludePinnedDefault}
								maxAgeDefault={maxAgeDefault}
							/>
						)}
					</InfoPanel.Section>
				</InfoPanel>
			</VerticalBar.ScrollableContent>
		</>
	);
};

export default TeamsInfo;
