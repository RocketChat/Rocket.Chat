import { SidebarBanner } from '@rocket.chat/fuselage';
import { ExternalLink } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import AirGappedRestrictionWarning from './AirGappedRestrictionWarning';

const AirGappedRestrictionSection = ({ isRestricted, remainingDays }: { isRestricted: boolean; remainingDays: number }) => {
	const { t } = useTranslation();

	return (
		<SidebarBanner
			text={<AirGappedRestrictionWarning isRestricted={isRestricted} remainingDays={remainingDays} />}
			description={<ExternalLink to='https://go.rocket.chat/i/airgapped-restriction'>{t('Learn_more')}</ExternalLink>}
		/>
	);
};

export default AirGappedRestrictionSection;
