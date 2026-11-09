import { Card, CardBody, Icon, Stack } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import PlanCardHeader from './PlanCardHeader';
import PlanCardLicenseDetails from './PlanCardLicenseDetails';

const PlanCardCommunity = () => {
	const { t } = useTranslation();

	return (
		<Card>
			<PlanCardHeader name={t('Community')} />
			<CardBody flexDirection='column'>
				<Stack direction='row' align='center' gap='x12'>
					<Icon name='card' size={24} /> {t('free_per_month_user')}
				</Stack>
				<Stack direction='row' align='center' gap='x12'>
					<Icon name='cloud-plus' size={24} /> {t('Self_managed_hosting')}
				</Stack>
				<PlanCardLicenseDetails />
			</CardBody>
		</Card>
	);
};

export default PlanCardCommunity;
