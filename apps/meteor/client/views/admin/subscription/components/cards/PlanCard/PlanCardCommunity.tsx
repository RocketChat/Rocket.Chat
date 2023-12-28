import { Card, CardBody, CardRow, Icon } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import PlanCardHeader from './PlanCardHeader';

const PlanCardCommunity = (): ReactElement => {
	const { t } = useTranslation();

	return (
		<Card height='full'>
			<PlanCardHeader name={t('Community')} />
			<CardBody flexDirection='column'>
				<CardRow>
					<Icon name='card' size={24} mie={12} /> {t('free_per_month_user')}
				</CardRow>
				<CardRow>
					<Icon name='cloud-plus' size={24} mie={12} /> {t('Self_managed_hosting')}
				</CardRow>
			</CardBody>
		</Card>
	);
};

export default PlanCardCommunity;
