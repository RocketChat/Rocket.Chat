import { SidebarBanner } from '@rocket.chat/fuselage';
import React from 'react';
import { useTranslation } from 'react-i18next';

import AirGappedRestrictionWarning from './AirGappedRestrictionWarning';

// TODO: Ensure sidebarV2
// TODO: go.rocket.chat link to learn more
const AirGappedRestrictionSection = ({ isRestricted, remainingDays }: { isRestricted: boolean; remainingDays: number }) => {
	const { t } = useTranslation();

	return (
		<SidebarBanner
			text={<AirGappedRestrictionWarning isRestricted={isRestricted} remainingDays={remainingDays} />}
			description={t('Learn_more')}
		/>
	);
};

export default AirGappedRestrictionSection;
