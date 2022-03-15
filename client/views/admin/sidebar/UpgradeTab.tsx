import { Box, Icon } from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors';
import React, { ReactElement } from 'react';

import Emoji from '../../../components/Emoji';
import Sidebar from '../../../components/Sidebar';
import { useRoutePath } from '../../../contexts/RouterContext';
import { useTranslation, TranslationKey } from '../../../contexts/TranslationContext';
import type { UpgradeTabVariants } from './getUpgradeTabType';

const getUpgradeTabLabel = (type: UpgradeTabVariants): TranslationKey => {
	switch (type) {
		case 'goFullyFeatured':
			return 'Upgrade_tab_go_fully_featured';
		case 'trialGuide':
			return 'Upgrade_tab_trial_guide';
		case 'upgradeYourPlan':
			return 'Upgrade_tab_upgrade_your_plan';
	}
};

// purple not on fuselage yet
const customColors = {
	default: colors.p500,
	hover: colors.p900,
	active: colors.p700,
};

const UpgradeTab = ({ type }: { type: UpgradeTabVariants }): ReactElement => {
	const path = useRoutePath('upgrade');
	const t = useTranslation();

	const label = getUpgradeTabLabel(type);
	const displayEmoji = type === 'goFullyFeatured';

	return (
		<Sidebar.GenericItem href={String(path)} customColors={customColors} textColor='alternative'>
			<Icon name='arrow-jump' size='x20' mi='x4' />
			<Box withTruncatedText fontScale='p2' mi='x4' color='alternative'>
				{t(label)} {displayEmoji && <Emoji emojiHandle=':zap:' />}
			</Box>
		</Sidebar.GenericItem>
	);
};

export default UpgradeTab;
