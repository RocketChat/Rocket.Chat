import { Icon } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

const InvitationBadge = () => {
	const { t } = useTranslation();

	return (
		<Icon
			role='status'
			name='mail'
			mbs={2}
			size='x20'
			color='info'
			title={t('Message_request')}
			aria-hidden='false'
			aria-label={t('Message_request')}
		/>
	);
};

export default InvitationBadge;
