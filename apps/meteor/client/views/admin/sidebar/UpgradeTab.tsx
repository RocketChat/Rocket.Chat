import { Box, Icon } from '@rocket.chat/fuselage';
import { useRouter, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import type { UpgradeTabVariant } from '../../../../lib/upgradeTab';
import { getUpgradeTabLabel, isFullyFeature } from '../../../../lib/upgradeTab';
import Emoji from '../../../components/Emoji';
import Sidebar from '../../../components/Sidebar';

type UpgradeTabProps = { type: UpgradeTabVariant; currentPath: string; trialEndDate: string | undefined };

const UpgradeTab = ({ type, currentPath, trialEndDate }: UpgradeTabProps): ReactElement => {
	const router = useRouter();

	const path = router.buildRoutePath({
		name: 'upgrade',
		params: { type },
		search: trialEndDate ? { trialEndDate } : undefined,
	});

	const t = useTranslation();

	const label = getUpgradeTabLabel(type);
	const displayEmoji = isFullyFeature(type);

	return (
		<Sidebar.GenericItem active={currentPath === path} href={path} featured>
			<Icon name='arrow-stack-up' size='x20' mi={4} />
			<Box withTruncatedText fontScale='p2' mi={4}>
				{t(label)} {displayEmoji && <Emoji emojiHandle=':zap:' />}
			</Box>
		</Sidebar.GenericItem>
	);
};

export default UpgradeTab;
