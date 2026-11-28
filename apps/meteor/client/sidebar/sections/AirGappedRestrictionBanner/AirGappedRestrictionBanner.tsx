import { SidebarBanner, SidebarBannerLink } from '@rocket.chat/fuselage';
import { links } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import AirGappedRestrictionWarning from './AirGappedRestrictionWarning';

export type AirGappedRestrictionSectionProps = { isRestricted: boolean; remainingDays: number };

const AirGappedRestrictionSection = ({ isRestricted, remainingDays }: AirGappedRestrictionSectionProps) => {
	const { t } = useTranslation();

	return (
		<SidebarBanner title={<AirGappedRestrictionWarning isRestricted={isRestricted} remainingDays={remainingDays} />}>
			<SidebarBannerLink target='_blank' rel='noopener noreferrer' href={links.go.airgappedRestriction}>
				{t('Learn_more')}
			</SidebarBannerLink>
		</SidebarBanner>
	);
};

export default AirGappedRestrictionSection;
