import { Card, CardBody, CardColSection, CardFooter, CardTitle } from '@rocket.chat/ui-client';
import type { ReactElement, ReactNode } from 'react';
import React, { memo } from 'react';

import InfoTextIconModal from './InfoTextIconModal';
import UpgradeButton from './UpgradeButton';

type FeatureUsageCardProps = {
	children?: ReactNode;
	card: CardProps;
};

export type CardProps = {
	title: string;
	infoText?: string;
	showUpgradeButton?: boolean;
	upgradeButtonText?: string;
};

const FeatureUsageCard = ({ children, card }: FeatureUsageCardProps): ReactElement => {
	const { title, infoText, showUpgradeButton, upgradeButtonText = 'Upgrade' } = card;
	return (
		<Card>
			<CardTitle>
				{title} {infoText && <InfoTextIconModal title={title} infoText={infoText} />}
			</CardTitle>
			<CardBody height='x184'>
				<CardColSection display='flex' flexDirection='row' justifyContent='center' alignItems='center' fontScale='p2' h='full' w='full'>
					{children}
				</CardColSection>
			</CardBody>
			{showUpgradeButton && (
				<CardFooter>
					<UpgradeButton small i18nKey={upgradeButtonText} />
				</CardFooter>
			)}
		</Card>
	);
};

export default memo(FeatureUsageCard);
