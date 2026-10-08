import type { AbacRoomPreviewMember } from '@rocket.chat/core-typings';
import { Box, Icon, Tag } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

const roleLabels: [string, TranslationKey][] = [
	['owner', 'ABAC_Preview_Role_Owner'],
	['leader', 'ABAC_Preview_Role_Leader'],
	['moderator', 'ABAC_Preview_Role_Moderator'],
];

type AbacRoomPreviewMemberRowProps = {
	member: AbacRoomPreviewMember;
};

const AbacRoomPreviewMemberRow = ({ member: { username, name, verdict, roles = [] } }: AbacRoomPreviewMemberRowProps) => {
	const { t } = useTranslation();
	const roleLabel = roleLabels.find(([role]) => roles.includes(role))?.[1];
	const fullName = [name, username && `@${username}`].filter(Boolean).join(' ');

	return (
		<Box role='listitem' display='flex' alignItems='center' paddingInline={24} paddingBlock={8}>
			{username && (
				<Box flexShrink={0} display='flex'>
					<UserAvatar username={username} size='x28' />
				</Box>
			)}
			<Box display='flex' alignItems='center' flexGrow={1} flexShrink={1} minWidth={0} marginInlineStart={8}>
				<Box withTruncatedText flexShrink={1} title={fullName}>
					<Box is='span' fontScale='p2m' color='default'>
						{name || username}
					</Box>
					{name && username && (
						<Box is='span' fontScale='p2' color='hint' marginInlineStart={4}>
							@{username}
						</Box>
					)}
				</Box>
				{roleLabel && (
					<Box flexShrink={0} marginInlineStart={8}>
						<Tag>{t(roleLabel)}</Tag>
					</Box>
				)}
			</Box>
			{verdict === 'compliant' && (
				<Icon
					name='success-circle'
					size='x20'
					color='status-font-on-success'
					flexShrink={0}
					marginInlineStart={8}
					role='img'
					aria-hidden={false}
					aria-label={t('ABAC_Preview_Retains_access')}
					title={t('ABAC_Preview_Retains_access')}
				/>
			)}
			{verdict === 'nonCompliant' && (
				<Icon
					name='error-circle'
					size='x20'
					color='status-font-on-danger'
					flexShrink={0}
					marginInlineStart={8}
					role='img'
					aria-hidden={false}
					aria-label={t('ABAC_Preview_Loses_access')}
					title={t('ABAC_Preview_Loses_access')}
				/>
			)}
			{verdict === 'inconclusive' && (
				<Icon
					name='warning'
					size='x20'
					color='status-font-on-warning'
					flexShrink={0}
					marginInlineStart={8}
					role='img'
					aria-hidden={false}
					aria-label={t('ABAC_Preview_Inconclusive_Removed')}
					title={t('ABAC_Preview_Inconclusive_Removed')}
				/>
			)}
		</Box>
	);
};

export default memo(AbacRoomPreviewMemberRow);
