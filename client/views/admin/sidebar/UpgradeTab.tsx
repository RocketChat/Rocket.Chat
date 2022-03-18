import { Box, Icon } from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors';
import React, { ReactElement, useMemo } from 'react';

import Emoji from '../../../components/Emoji';
import Sidebar from '../../../components/Sidebar';
import { useRoutePath } from '../../../contexts/RouterContext';
import { useTranslation, TranslationKey } from '../../../contexts/TranslationContext';
import type { UpgradeTabVariants } from '../upgrade/getUpgradeTabType';

const getUpgradeTabLabel = (type: UpgradeTabVariants): TranslationKey => {
	switch (type) {
		case 'goFullyFeatured':
		case 'goFullyFeaturedRegistered':
			return 'Upgrade_tab_go_fully_featured';
		case 'trialGold':
		case 'trialEnterprise':
			return 'Upgrade_tab_trial_guide';
		case 'upgradeYourPlan':
			return 'Upgrade_tab_upgrade_your_plan';
	}
};

const customColors = {
	default: colors.p700,
	hover: colors.p800,
	active: colors.p900,
};

type UpgradeTabProps = { type: UpgradeTabVariants; currentPath: string };

const UpgradeTab = ({ type, currentPath }: UpgradeTabProps): ReactElement => {
	const path = useRoutePath(
		'upgrade',
		useMemo(
			() => ({
				type,
			}),
			[type],
		),
	);
	const t = useTranslation();

	const label = getUpgradeTabLabel(type);
	const displayEmoji = type === 'goFullyFeatured';

	return (
		<Sidebar.GenericItem active={currentPath === path} href={String(path)} customColors={customColors} textColor='alternative'>
			<Icon name='arrow-stack-up' size='x20' mi='x4' />
			<Box withTruncatedText fontScale='p2' mi='x4' color='alternative'>
				{t(label)} {displayEmoji && <Emoji emojiHandle=':zap:' />}
			</Box>
		</Sidebar.GenericItem>
	);
};

export default UpgradeTab;
