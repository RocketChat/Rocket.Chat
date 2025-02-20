import { Card, CardControls, CardTitle } from '@rocket.chat/fuselage';
import type { ReactElement, ReactNode } from 'react';
import { memo } from 'react';

import InfoTextIconModal from './InfoTextIconModal';

type FeatureUsageCardProps = {
	children?: ReactNode;
	card: CardProps;
};

export type CardProps = {
	title: string;
	infoText?: ReactNode;
	upgradeButton?: ReactNode;
};

const FeatureUsageCard = ({ children, card }: FeatureUsageCardProps): ReactElement => {
	const { title, infoText, upgradeButton } = card;

	return (
		<Card height='full'>
			<CardTitle>
				{title} {infoText && <InfoTextIconModal title={title} infoText={infoText} />}
			</CardTitle>
			{children}
			{upgradeButton && <CardControls>{upgradeButton}</CardControls>}
		</Card>
	);
};

export default memo(FeatureUsageCard);
