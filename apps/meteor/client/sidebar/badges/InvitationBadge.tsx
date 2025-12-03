import { Icon } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { useTimeFromNow } from '../../hooks/useTimeFromNow';

type InvitationBadgeProps = {
	inviteDate?: string;
};

const InvitationBadge = ({ inviteDate }: InvitationBadgeProps) => {
	const { t } = useTranslation();
	const getTimeFromNow = useTimeFromNow(true);
	const title = t('Invited__date__', { date: getTimeFromNow(inviteDate) ?? '' });

	return <Icon role='status' name='mail' mbs={2} size='x20' color='info' title={title} aria-hidden='false' aria-label={title} />;
};

export default InvitationBadge;
