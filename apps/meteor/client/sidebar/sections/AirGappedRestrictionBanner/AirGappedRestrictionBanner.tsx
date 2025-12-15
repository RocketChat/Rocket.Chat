import { SidebarBanner } from '@rocket.chat/fuselage';
import { ExternalLink } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import AirGappedRestrictionWarning from './AirGappedRestrictionWarning';
import { links } from '../../../lib/links';

const AirGappedRestrictionSection = ({ isRestricted, remainingDays }: { isRestricted: boolean; remainingDays: number }) => {
	const { t } = useTranslation();

	return (
		<SidebarBanner
			text={<AirGappedRestrictionWarning isRestricted={isRestricted} remainingDays={remainingDays} />}
			description={<ExternalLink to={links.go.airgappedRestriction}>{t('Learn_more')}</ExternalLink>}
		/>
	);
};

export default AirGappedRestrictionSection;
