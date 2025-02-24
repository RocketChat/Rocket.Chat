import { States, StatesIcon, StatesTitle, StatesSubtitle, StatesActions, Button } from '@rocket.chat/fuselage';
import { usePermission } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { useExternalLink } from '../../../hooks/useExternalLink';
import UpgradeButton from '../../admin/subscription/components/UpgradeButton';
import { PRICING_LINK } from '../../admin/subscription/utils/links';

const PrivateEmptyStateUpgrade = () => {
	const { t } = useTranslation();
	const isAdmin = usePermission('manage-apps');

	const handleOpenLink = useExternalLink();

	return (
		<States>
			<StatesIcon name='lightning' />
			<StatesTitle>{t('Private_apps_upgrade_empty_state_title')}</StatesTitle>
			<StatesSubtitle>{t('Private_apps_upgrade_empty_state_description')}</StatesSubtitle>
			<StatesActions>
				{isAdmin && (
					<UpgradeButton primary target='private-apps-header' action='upgrade'>
						{t('Upgrade')}
					</UpgradeButton>
				)}
				{!isAdmin && (
					<Button onClick={() => handleOpenLink(PRICING_LINK)} role='link'>
						{t('Learn_more')}
					</Button>
				)}
			</StatesActions>
		</States>
	);
};

export default PrivateEmptyStateUpgrade;
