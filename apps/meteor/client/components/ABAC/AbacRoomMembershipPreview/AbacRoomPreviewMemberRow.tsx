import type { AbacMembershipVerdict, AbacRoomPreviewMember } from '@rocket.chat/core-typings';
import { Box, Icon, Tag } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

const roleLabels: [string, TranslationKey][] = [
	['owner', 'ABAC_Preview_Role_Owner'],
	['leader', 'ABAC_Preview_Role_Leader'],
	['moderator', 'ABAC_Preview_Role_Moderator'],
];

const verdictIcons: Record<AbacMembershipVerdict, Pick<ComponentProps<typeof Icon>, 'name' | 'color'> & { label: TranslationKey }> = {
	compliant: { name: 'success-circle', color: 'status-font-on-success', label: 'ABAC_Preview_Retains_access' },
	nonCompliant: { name: 'error-circle', color: 'status-font-on-danger', label: 'ABAC_Preview_Loses_access' },
	inconclusive: { name: 'warning', color: 'status-font-on-warning', label: 'ABAC_Preview_Inconclusive_Removed' },
};

type AbacRoomPreviewMemberRowProps = {
	member: AbacRoomPreviewMember;
};

const AbacRoomPreviewMemberRow = ({ member: { username, name, verdict, roles = [] } }: AbacRoomPreviewMemberRowProps) => {
	const { t } = useTranslation();
	const roleLabel = roleLabels.find(([role]) => roles.includes(role))?.[1];
	const fullName = [name, username && `@${username}`].filter(Boolean).join(' ');
	const { label, ...icon } = verdictIcons[verdict];

	return (
		<Box role='listitem' display='flex' alignItems='center' paddingInline={24} paddingBlock={8}>
			{username && (
				<Box flexShrink={0} display='flex'>
					<UserAvatar username={username} size='x28' />
				</Box>
			)}
			<Box display='flex' alignItems='center' flexGrow={1} minWidth={0} marginInline={8}>
				<Box withTruncatedText title={fullName}>
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
			<Icon {...icon} size='x20' title={t(label)} />
		</Box>
	);
};

export default memo(AbacRoomPreviewMemberRow);
