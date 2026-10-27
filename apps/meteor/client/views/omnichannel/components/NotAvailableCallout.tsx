import { Box, Callout } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

const NotAvailableCallout = () => {
	const { t } = useTranslation();

	return (
		<Box padding={16}>
			<Callout type='danger'>{t('Not_Available')}</Callout>
		</Box>
	);
};

export default NotAvailableCallout;
