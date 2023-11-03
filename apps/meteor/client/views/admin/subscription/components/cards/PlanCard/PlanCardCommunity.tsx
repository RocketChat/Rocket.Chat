import { Box, Icon } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import PlanCardBase from './PlanCardBase';

const PlanCardCommunity = (): ReactElement => {
	const { t } = useTranslation();

	return (
		<PlanCardBase name='Community'>
			<Box fontScale='p2' display='flex' mb={4} alignItems='center'>
				<Icon name='card' size={24} mie={12} /> {t('free_per_month_user')}
			</Box>
			<Box fontScale='p2' display='flex' mb={4} alignItems='center'>
				<Icon name='cloud-plus' size={24} mie={12} /> {t('Self_managed_hosting')}
			</Box>
		</PlanCardBase>
	);
};

export default PlanCardCommunity;
