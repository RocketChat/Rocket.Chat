import { Box, Button, Callout, Option, Menu } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';

import VerticalBar from '../../../../components/VerticalBar';
import RoomAvatar from '../../../../components/avatar/RoomAvatar';
import InfoPanel from '../../../InfoPanel';
import RetentionPolicyCallout from '../../../InfoPanel/RetentionPolicyCallout';
import { useActionSpread } from '../../../hooks/useActionSpread';

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
	onClickHide,
	onClickClose,
	onClickLeave,
	onClickEdit,
	onClickDelete,
	onClickViewChannels,
	onClickConvertToChannel,
}) => {
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
				ghost={false}
				renderItem={({ label: { label, icon }, ...props }) => <Option {...props} label={label} icon={icon} />}
				options={menuOptions}
			/>
		);
	}, [menuOptions]);

	const actions = useMemo(() => {
		const mapAction = ([key, { label, icon, action }]) => <InfoPanel.Action key={key} label={label} onClick={action} icon={icon} />;

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
				<InfoPanel flexGrow={1}>
					<InfoPanel.Avatar>
						<RoomAvatar size={'x332'} room={{ _id: rid, type, t: type }} />
					</InfoPanel.Avatar>

					<InfoPanel.ActionGroup>{actions}</InfoPanel.ActionGroup>

					<InfoPanel.Section>
						{archived && (
							<Box mb='x16'>
								<Callout type='warning'>{t('Room_archived')}</Callout>
							</Box>
						)}
					</InfoPanel.Section>

					<InfoPanel.Section>
						<InfoPanel.Title title={fname || name} icon={icon} />
					</InfoPanel.Section>

					<InfoPanel.Section>
						{broadcast && broadcast !== '' && (
							<InfoPanel.Field>
								<InfoPanel.Label>
									<b>{t('Broadcast_channel')}</b> {t('Broadcast_channel_Description')}
								</InfoPanel.Label>
							</InfoPanel.Field>
						)}

						{description && description !== '' && (
							<InfoPanel.Field>
								<InfoPanel.Label>{t('Description')}</InfoPanel.Label>
								<InfoPanel.Text withTruncatedText={false}>{description}</InfoPanel.Text>
							</InfoPanel.Field>
						)}

						{announcement && announcement !== '' && (
							<InfoPanel.Field>
								<InfoPanel.Label>{t('Announcement')}</InfoPanel.Label>
								<InfoPanel.Text withTruncatedText={false}>{announcement}</InfoPanel.Text>
							</InfoPanel.Field>
						)}

						{topic && topic !== '' && (
							<InfoPanel.Field>
								<InfoPanel.Label>{t('Topic')}</InfoPanel.Label>
								<InfoPanel.Text withTruncatedText={false}>{topic}</InfoPanel.Text>
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
