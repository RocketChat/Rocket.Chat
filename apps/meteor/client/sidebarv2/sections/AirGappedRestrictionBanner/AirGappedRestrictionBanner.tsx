import { SidebarV2Banner } from '@rocket.chat/fuselage';
import React from 'react';
import { useTranslation } from 'react-i18next';

import AirGappedRestrictionWarning from './AirGappedRestrictionWarning';

// TODO: go.rocket.chat link to learn more
const AirGappedRestrictionSection = ({ isRestricted, remainingDays }: { isRestricted: boolean; remainingDays: number }) => {
	const { t } = useTranslation();

	return (
		<SidebarV2Banner
			title={<AirGappedRestrictionWarning isRestricted={isRestricted} remainingDays={remainingDays} />}
			linkText={t('Learn_more')}
		/>
	);
};

export default AirGappedRestrictionSection;
