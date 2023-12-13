import { Box, Card, CardBody, CardControls, CardTitle } from '@rocket.chat/fuselage';
import type { ReactElement, ReactNode } from 'react';
import React, { memo } from 'react';

import InfoTextIconModal from './InfoTextIconModal';

type FeatureUsageCardProps = {
	children?: ReactNode;
	card: CardProps;
};

export type CardProps = {
	title: string;
	infoText?: string;
	upgradeButton?: ReactNode;
};

const FeatureUsageCard = ({ children, card }: FeatureUsageCardProps): ReactElement => {
	const { title, infoText, upgradeButton } = card;
	return (
		<Card height='full'>
			<CardTitle>
				{title} {infoText && <InfoTextIconModal title={title} infoText={infoText} />}
			</CardTitle>
			<CardBody>
				<Box h='full' w='full'>
					{children}
				</Box>
			</CardBody>
			{upgradeButton && <CardControls>{upgradeButton}</CardControls>}
		</Card>
	);
};

export default memo(FeatureUsageCard);
