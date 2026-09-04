import type { AbacPreviewMember, AbacRoomRoleTag } from '@rocket.chat/core-typings';
import { Box, Tag } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useTranslation } from 'react-i18next';

export type AbacPreviewMemberRowProps = {
	member: AbacPreviewMember;
};

/** One member line in the membership-impact preview, with their room-scoped role tags. */
const AbacPreviewMemberRow = ({ member }: AbacPreviewMemberRowProps) => {
	const { t } = useTranslation();

	const roleLabels: Record<AbacRoomRoleTag, string> = {
		owner: t('Owner'),
		moderator: t('Moderator'),
		leader: t('Leader'),
	};

	return (
		<Box display='flex' alignItems='center' paddingBlockEnd={4} style={{ gap: '0.5rem' }}>
			{member.username && <UserAvatar username={member.username} size='x28' />}
			<Box display='flex' alignItems='center' flexGrow={1} minWidth={0} style={{ gap: '0.25rem' }}>
				<Box withTruncatedText fontScale='p2m'>
					{member.name ?? member.username}
				</Box>
				{member.name && member.username && (
					<Box withTruncatedText fontScale='p2' color='hint' title={`@${member.username}`}>
						@{member.username}
					</Box>
				)}
			</Box>
			{member.roles.map((role) => (
				<Tag key={role}>{roleLabels[role]}</Tag>
			))}
		</Box>
	);
};

export default AbacPreviewMemberRow;
