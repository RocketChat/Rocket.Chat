import { States, StatesIcon, StatesTitle, StatesSubtitle, StatesActions } from '@rocket.chat/fuselage';
import { usePermission } from '@rocket.chat/ui-contexts';
import React from 'react';
import { useTranslation } from 'react-i18next';

import UpgradeButton from '../../admin/subscription/components/UpgradeButton';

const PrivateEmptyStateUpgrade = () => {
	const { t } = useTranslation();
	const isAdmin = usePermission('manage-apps');

	return (
		<States>
			<StatesIcon name='lightning' />
			<StatesTitle>{t('Private_apps_upgrade_empty_state_title')}</StatesTitle>
			<StatesSubtitle>{t('Private_apps_upgrade_empty_state_description')}</StatesSubtitle>
			{isAdmin && (
				<StatesActions>
					<UpgradeButton primary icon={undefined} target='private-apps-header' action='upgrade'>
						{t('Upgrade')}
					</UpgradeButton>
				</StatesActions>
			)}
		</States>
	);
};

export default PrivateEmptyStateUpgrade;
