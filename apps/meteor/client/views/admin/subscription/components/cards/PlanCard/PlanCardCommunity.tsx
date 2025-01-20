import { Box, Card, CardBody, Icon } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import PlanCardHeader from './PlanCardHeader';

const PlanCardCommunity = (): ReactElement => {
	const { t } = useTranslation();

	return (
		<Card height='full'>
			<PlanCardHeader name={t('Community')} />
			<CardBody flexDirection='column'>
				<Box display='flex' flexDirection='row' alignItems='center'>
					<Icon name='card' size={24} mie={12} /> {t('free_per_month_user')}
				</Box>
				<Box display='flex' flexDirection='row' alignItems='center'>
					<Icon name='cloud-plus' size={24} mie={12} /> {t('Self_managed_hosting')}
				</Box>
			</CardBody>
		</Card>
	);
};

export default PlanCardCommunity;
