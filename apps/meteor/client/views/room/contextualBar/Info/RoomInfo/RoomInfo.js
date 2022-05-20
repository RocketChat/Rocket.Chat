import { Box, Callout, Menu, Option } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';

import MarkdownText from '../../../../../components/MarkdownText';
import VerticalBar from '../../../../../components/VerticalBar';
import RoomAvatar from '../../../../../components/avatar/RoomAvatar';
import InfoPanel from '../../../../InfoPanel';
import RetentionPolicyCallout from '../../../../InfoPanel/RetentionPolicyCallout';
import { useActionSpread } from '../../../../hooks/useActionSpread';

const RoomInfo = ({
	room,
	icon,
	retentionPolicy = {},
	onClickBack,
	onClickHide,
	onClickClose,
	onClickLeave,
	onClickEdit,
	onClickDelete,
	onClickMoveToTeam,
	onClickConvertToTeam,
	onClickEnterRoom,
}) => {
	const t = useTranslation();
	const { name, fname, description, topic, archived, broadcast, announcement } = room;

	const { retentionPolicyEnabled, filesOnlyDefault, excludePinnedDefault, maxAgeDefault, retentionEnabledDefault } = retentionPolicy;

	const memoizedActions = useMemo(
		() => ({
			...(onClickEnterRoom && {
				enter: {
					label: t('Enter'),
					icon: 'login',
					action: onClickEnterRoom,
				},
			}),
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
			...(onClickMoveToTeam && {
				move: {
					label: t('Teams_move_channel_to_team'),
					icon: 'team-arrow-right',
					action: onClickMoveToTeam,
				},
			}),
			...(onClickConvertToTeam && {
				convert: {
					label: t('Teams_convert_channel_to_team'),
					icon: 'team',
					action: onClickConvertToTeam,
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
		[onClickEdit, t, onClickDelete, onClickMoveToTeam, onClickConvertToTeam, onClickHide, onClickLeave, onClickEnterRoom],
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
				{onClickBack ? <VerticalBar.Back onClick={onClickBack} /> : <VerticalBar.Icon name='info-circled' />}
				<VerticalBar.Text>{t('Room_Info')}</VerticalBar.Text>
				{onClickClose && <VerticalBar.Close onClick={onClickClose} />}
			</VerticalBar.Header>

			<VerticalBar.ScrollableContent p='x24'>
				<InfoPanel flexGrow={1}>
					<InfoPanel.Avatar>
						<RoomAvatar size={'x332'} room={room} />
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

						{retentionPolicyEnabled && retentionEnabledDefault && (
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

export default RoomInfo;
