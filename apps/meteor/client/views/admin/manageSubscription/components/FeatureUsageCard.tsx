import { Box } from '@rocket.chat/fuselage';
import { Card, CardBody, CardColSection, CardTitle } from '@rocket.chat/ui-client';
import type { ReactElement, ReactNode } from 'react';
import React, { memo } from 'react';

import CardUpgradeButton from './CardUpgradeButton';
import InfoTextIconModal from './InfoTextIconModal';

export type FeatureUsageCardProps = {
	title: string;
	children?: ReactNode;
	infoText?: string;
	showUpgradeButton?: boolean;
	upgradeButtonText?: string;
};

const FeatureUsageCard = ({
	children,
	title,
	infoText,
	showUpgradeButton,
	upgradeButtonText = 'Upgrade',
}: FeatureUsageCardProps): ReactElement => {
	return (
		<Card minHeight={280}>
			<CardTitle fontScale='p2b'>
				<Box display='flex' alignItems='center'>
					{title} {infoText && <InfoTextIconModal title={title} infoText={infoText} />}
				</Box>
			</CardTitle>
			<CardBody>
				<CardColSection display='flex' flexDirection='row' justifyContent='center' alignItems='center' fontScale='p2' h='full' w='full'>
					{children}
				</CardColSection>
			</CardBody>
			{showUpgradeButton && <CardUpgradeButton i18nKey={upgradeButtonText} />}
		</Card>
	);
};

export default memo(FeatureUsageCard);
