import { SidebarV2Banner } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import AirGappedRestrictionWarning from './AirGappedRestrictionWarning';

const AirGappedRestrictionSection = ({ isRestricted, remainingDays }: { isRestricted: boolean; remainingDays: number }) => {
	const { t } = useTranslation();

	return (
		<SidebarV2Banner
			title={<AirGappedRestrictionWarning isRestricted={isRestricted} remainingDays={remainingDays} />}
			linkText={t('Learn_more')}
			linkProps={{
				target: '_blank',
				rel: 'noopener noreferrer',
				href: 'https://go.rocket.chat/i/airgapped-restriction',
			}}
		/>
	);
};

export default AirGappedRestrictionSection;
