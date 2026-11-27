import { Icon } from '@rocket.chat/fuselage';
import { useTimeAgo } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';

export type InvitationBadgeProps = Pick<ComponentProps<typeof Icon>, 'size'> & {
	invitationDate: string | Date;
};

const InvitationBadge = ({ invitationDate, size = 'x20' }: InvitationBadgeProps) => {
	const { t } = useTranslation();
	const timeAgo = useTimeAgo();

	return (
		<Icon
			size={size}
			role='status'
			color='info'
			name='mail'
			aria-hidden='false'
			title={t('Invited__date__', { date: timeAgo(invitationDate) })}
		/>
	);
};

export default InvitationBadge;
