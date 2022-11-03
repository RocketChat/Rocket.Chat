import { Box, Icon } from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors';
import { useRoutePath, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement, useMemo } from 'react';

import { getUpgradeTabLabel, isFullyFeature, UpgradeTabVariant } from '../../../../lib/upgradeTab';
import Emoji from '../../../components/Emoji';
import Sidebar from '../../../components/Sidebar';

const customColors = {
	default: colors['s2-700'],
	hover: colors['s2-800'],
	active: colors['s2-900'],
};

type UpgradeTabProps = { type: UpgradeTabVariant; currentPath: string; trialEndDate: string | undefined };

const UpgradeTab = ({ type, currentPath, trialEndDate }: UpgradeTabProps): ReactElement => {
	const path = useRoutePath(
		'upgrade',
		useMemo(
			() => ({
				type,
			}),
			[type],
		),
		useMemo(() => (trialEndDate ? { trialEndDate } : undefined), [trialEndDate]),
	);
	const t = useTranslation();

	const label = getUpgradeTabLabel(type);
	const displayEmoji = isFullyFeature(type);

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
