import { Icon } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';

import { useTimeAgo } from '../../hooks/useTimeAgo';

type InvitationBadgeProps = Omit<ComponentProps<typeof Icon>, 'name' | 'color' | 'role'> & {
	invitationDate: string | Date;
};

const InvitationBadge = ({ invitationDate, ...props }: InvitationBadgeProps) => {
	const { t } = useTranslation();
	const timeAgo = useTimeAgo();

	return (
		<Icon
			size='x20'
			{...props}
			role='status'
			color='info'
			name='mail'
			aria-hidden='false'
			title={t('Invited__date__', { date: timeAgo(invitationDate) })}
		/>
	);
};

export default InvitationBadge;
