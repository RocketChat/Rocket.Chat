import React, { ReactElement } from 'react';

import Page from '../../../components/Page';
import { useRouteParameter } from '../../../contexts/RouterContext';
import type { UpgradeTabVariants } from './getUpgradeTabType';

const iframeStyle = { width: '100%', height: '100%' };

const getUrl = (type: UpgradeTabVariants): string => {
	switch (type) {
		case 'goFullyFeatured':
			return 'https://rocket.chat/product-projects/upgrade-tab-ce-1-unregistered';
		case 'goFullyFeaturedRegistered':
			return 'https://rocket.chat/product-projects/upgrade-tab-ce-1-registered';
		case 'trialGold':
			return 'https://rocket.chat/product-projects/upgrade-tab-gold-trial';
		case 'trialEnterprise':
			return 'https://rocket.chat/product-projects/upgrade-tab-ee-trial';
		case 'upgradeYourPlan':
			return 'https://rocket.chat/product-projects/upgrade-tab-ce-2';
	}
};

const UpgradePage = (): ReactElement => {
	const type = useRouteParameter('type') as UpgradeTabVariants;

	// todo get isRegistered and isGoldTrial
	const pageUrl = getUrl(type);
	return (
		<Page>
			<iframe src={pageUrl} style={iframeStyle} />
		</Page>
	);
};

export default UpgradePage;
